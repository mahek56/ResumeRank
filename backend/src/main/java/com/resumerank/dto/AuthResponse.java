package com.resumerank.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Response body returned from auth endpoints (register/login/me).
 * Never contains the JWT — token is set as httpOnly cookie.
 */
public class AuthResponse {

    private UUID id;
    private String email;
    private boolean emailVerified;
    private OffsetDateTime createdAt;

    public AuthResponse() {}

    public AuthResponse(UUID id, String email, boolean emailVerified, OffsetDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
