package com.resumerank.storage;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

/**
 * Abstraction over the physical file store.
 * The current implementation is local filesystem; swap to S3 etc. by
 * providing an alternative bean without touching callers.
 */
public interface StorageService {

    /**
     * Persist a file and return the relative path it was stored at.
     *
     * @param file    the uploaded multipart file
     * @param subPath e.g. "{jobId}/{candidateId}" — callers supply context
     * @return relative path from the upload root, e.g. "jobs/abc/xyz.pdf"
     */
    String store(MultipartFile file, String subPath);

    /**
     * Load a previously stored file as a Spring Resource (for serving).
     *
     * @param filePath relative path returned by {@link #store}
     * @return Resource ready for streaming
     */
    Resource load(String filePath);

    /**
     * Delete a stored file. Best-effort; logs warnings on failure.
     *
     * @param filePath relative path returned by {@link #store}
     */
    void delete(String filePath);
}
