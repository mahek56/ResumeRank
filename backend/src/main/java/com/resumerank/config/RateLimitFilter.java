package com.resumerank.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiter applied to sensitive auth endpoints to prevent brute-force attacks.
 *
 * Endpoints rate-limited:
 *   - POST /auth/login          — 5 requests per 15 minutes per IP
 *   - POST /auth/reset-password — 5 requests per 15 minutes per IP
 *
 * Uses Bucket4j with per-IP token buckets stored in a ConcurrentHashMap.
 * In a multi-instance deployment, replace with a distributed cache (Redis).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final int MAX_REQUESTS = 5;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(15);

    // Per-IP buckets. In production with multiple instances, use Redis/Hazelcast.
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        // Only rate-limit POST to these specific paths
        if (!"POST".equalsIgnoreCase(method)) return true;
        return !"/auth/login".equals(path) && !"/auth/reset-password".equals(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = getClientIp(request);
        String bucketKey = clientIp + ":" + request.getRequestURI();

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for {} on {}", clientIp, request.getRequestURI());
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
        }
    }

    private Bucket createBucket() {
        // Bucket4j 8.x API: Bandwidth.builder() replaces Bandwidth.classic() + Refill
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_REQUESTS)
                .refillIntervally(MAX_REQUESTS, REFILL_PERIOD)
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // Take the first IP (client's real IP) from the chain
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
