package com.resumerank.auth;

import com.resumerank.dto.AuthResponse;
import com.resumerank.dto.LoginRequest;
import com.resumerank.dto.RegisterRequest;
import com.resumerank.entity.User;
import com.resumerank.exception.NotFoundException;
import com.resumerank.exception.ValidationException;
import com.resumerank.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Authentication endpoints. All under /auth/** (public, no auth required).
 * JWT is never returned in the response body — only set as httpOnly cookie.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Register a new user. Auto-verified (demo mode).
     * Password is hashed with BCrypt (cost ≥ 12).
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletResponse response) {
        // Password confirmation check
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Passwords do not match");
        }

        // Duplicate email check
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ValidationException("An account with this email already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getEmail().toLowerCase(), hashedPassword);
        user = userRepository.save(user);

        // Set JWT cookie
        String token = jwtService.generateToken(user);
        jwtService.setTokenCookie(response, token);

        log.info("New user registered: {}", user.getEmail());
        return ResponseEntity.status(201).body(toAuthResponse(user));
    }

    /**
     * Authenticate with email + password. Sets JWT cookie on success.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Rotate token on login
        String token = jwtService.generateToken(user);
        jwtService.setTokenCookie(response, token);

        log.info("User logged in: {}", user.getEmail());
        return ResponseEntity.ok(toAuthResponse(user));
    }

    /**
     * Clear JWT cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        jwtService.clearTokenCookie(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /**
     * Stubbed password reset. Generates a token and logs it to console.
     * In production, this would send an email.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new ValidationException("Email is required");
        }

        // Don't reveal whether the email exists — always return 200
        userRepository.findByEmail(email.toLowerCase()).ifPresent(user -> {
            String resetToken = UUID.randomUUID().toString();
            log.info("=== PASSWORD RESET TOKEN (dev only) === email={}, token={}", email, resetToken);
        });

        return ResponseEntity.ok(Map.of(
                "message", "If an account exists with that email, a reset link has been sent."));
    }

    /**
     * Return the current authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new NotFoundException("User session not found");
        }
        return ResponseEntity.ok(toAuthResponse(user));
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.isEmailVerified(),
                user.getCreatedAt());
    }
}
