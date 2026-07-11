package com.resumerank.storage;

import com.resumerank.config.AppProperties;
import com.resumerank.exception.ValidationException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Stores uploaded resume PDFs on the local filesystem.
 *
 * Root directory: app.storage.upload-dir (default: ./uploads)
 * Layout: {uploadDir}/{subPath}/{filename}
 *
 * Validation enforced here:
 *   - MIME type must be application/pdf
 *   - Max file size: 10 MB
 *
 * Note: on Render free tier local disk is ephemeral; documented limitation.
 */
@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private static final long MAX_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final String PDF_MIME = "application/pdf";

    private final Path rootDir;

    public LocalStorageService(AppProperties props) {
        this.rootDir = Paths.get(props.getStorage().getUploadDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootDir);
            log.info("Upload directory ready: {}", rootDir);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directory: " + rootDir, e);
        }
    }

    @Override
    public String store(MultipartFile file, String subPath) {
        validatePdf(file);

        String originalName = file.getOriginalFilename();
        String safeFileName = sanitize(originalName != null ? originalName : "resume.pdf");

        try {
            Path targetDir = rootDir.resolve(subPath).normalize();
            // Guard against path-traversal: targetDir must stay under rootDir
            if (!targetDir.startsWith(rootDir)) {
                throw new ValidationException("Invalid upload path");
            }
            Files.createDirectories(targetDir);

            Path targetFile = targetDir.resolve(safeFileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path (subPath/filename)
            String relative = rootDir.relativize(targetFile).toString().replace("\\", "/");
            log.debug("Stored file: {}", relative);
            return relative;

        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource load(String filePath) {
        try {
            Path file = rootDir.resolve(filePath).normalize();
            if (!file.startsWith(rootDir)) {
                throw new ValidationException("Invalid file path");
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("File not readable: " + filePath);
            }
            return resource;
        } catch (IOException e) {
            throw new RuntimeException("Cannot read file: " + filePath, e);
        }
    }

    @Override
    public void delete(String filePath) {
        try {
            Path file = rootDir.resolve(filePath).normalize();
            if (!file.startsWith(rootDir)) {
                log.warn("Refused to delete outside upload root: {}", filePath);
                return;
            }
            boolean deleted = Files.deleteIfExists(file);
            if (deleted) {
                log.debug("Deleted file: {}", filePath);
            } else {
                log.warn("File not found for deletion: {}", filePath);
            }
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", filePath, e.getMessage());
        }
    }

    // --- Helpers ---

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Uploaded file is empty");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ValidationException("File exceeds the 10 MB limit");
        }
        String mime = file.getContentType();
        if (mime == null || (!PDF_MIME.equals(mime) && !"application/octet-stream".equals(mime))) {
            throw new ValidationException("Only PDF files are accepted. Received: " + mime);
        }
    }

    /**
     * Strip path separators and dangerous characters from a filename.
     */
    private String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
