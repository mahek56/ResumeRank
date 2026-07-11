package com.resumerank.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Type-safe binding for all custom "app.*" properties in application.yml.
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final AiService aiService = new AiService();
    private final Storage storage = new Storage();
    private final Security security = new Security();

    public Jwt getJwt() { return jwt; }
    public Cors getCors() { return cors; }
    public AiService getAiService() { return aiService; }
    public Storage getStorage() { return storage; }
    public Security getSecurity() { return security; }

    public static class Jwt {
        private String secret;
        private long expirationMs = 86_400_000; // 24 hours
        private String cookieName = "resumerank_token";
        private boolean cookieSecure = false;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }

        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }

        public String getCookieName() { return cookieName; }
        public void setCookieName(String cookieName) { this.cookieName = cookieName; }

        public boolean isCookieSecure() { return cookieSecure; }
        public void setCookieSecure(boolean cookieSecure) { this.cookieSecure = cookieSecure; }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class AiService {
        private String url = "http://localhost:8000";

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    public static class Storage {
        private String uploadDir = "./uploads";

        public String getUploadDir() { return uploadDir; }
        public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }
    }

    public static class Security {
        private int bcryptStrength = 12;

        public int getBcryptStrength() { return bcryptStrength; }
        public void setBcryptStrength(int bcryptStrength) { this.bcryptStrength = bcryptStrength; }
    }
}
