package com.resumerank.config;

import com.resumerank.auth.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Spring Security configuration.
 *
 * Key decisions:
 * - Stateless sessions (JWT in httpOnly cookie, not server session)
 * - CSRF protection via double-submit cookie pattern:
 *   Spring's CookieCsrfTokenRepository writes an XSRF-TOKEN cookie (readable by JS),
 *   and the frontend sends it back as the X-XSRF-TOKEN header on mutating requests.
 * - BCrypt password encoder with cost factor ≥ 12
 * - Security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options
 * - Public paths: /auth/**, all others require authentication
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AppProperties appProperties;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, AppProperties appProperties) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.appProperties = appProperties;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Use a non-deferred handler so the CSRF token is available immediately
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        // Setting to empty string disables the deferred behavior (Spring 6.x)
        csrfHandler.setCsrfRequestAttributeName(null);

        http
            // -- CORS: use CorsConfigurationSource bean from CorsConfig --
            .cors(Customizer.withDefaults())

            // -- Session management: stateless --
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // -- CSRF: double-submit cookie pattern --
            // CookieCsrfTokenRepository writes XSRF-TOKEN cookie (JS-readable).
            // Frontend reads it and sends it back as X-XSRF-TOKEN header.
            .csrf(csrf -> {
                CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
                repo.setCookieCustomizer(cookie -> cookie.sameSite("None").secure(true).path("/"));
                csrf.csrfTokenRepository(repo)
                    .csrfTokenRequestHandler(csrfHandler)
                    .ignoringRequestMatchers("/api/auth/**");
            })

            // -- Authorization rules --
            .authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/health").permitAll()
    .anyRequest().authenticated())
            // -- Custom JWT filter before UsernamePasswordAuthenticationFilter --
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

            // -- Exception handling: return JSON errors, not redirects --
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"status\":401,\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"status\":403,\"message\":\"Access denied\"}");
                }))

            // -- Security headers --
            .headers(headers -> headers
                .contentSecurityPolicy(csp ->
                    csp.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
                .frameOptions(fo -> fo.deny())
                .httpStrictTransportSecurity(hsts ->
                    hsts.includeSubDomains(true).maxAgeInSeconds(31536000)));

        return http.build();
    }

    /**
     * BCrypt password encoder with cost factor read from config.
     * Default is 12 (minimum acceptable for production).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        int strength = appProperties.getSecurity().getBcryptStrength();
        if (strength < 12) {
            throw new IllegalArgumentException(
                "BCrypt strength must be >= 12, got " + strength);
        }
        return new BCryptPasswordEncoder(strength);
    }
}
