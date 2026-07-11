package com.resumerank.aiservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumerank.config.AppProperties;
import com.resumerank.dto.AiScoreRequest;
import com.resumerank.dto.AiScoreResponse;
import com.resumerank.dto.ParseResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * HTTP client for the FastAPI AI service.
 *
 * Calls:
 *   POST {aiServiceUrl}/parse-resume — resume bytes → ParseResponse
 *   POST {aiServiceUrl}/score        — ScoreRequest → AiScoreResponse
 *
 * Timeouts: 30s connect, 60s read (model inference may be slow).
 * Error handling: if the service is unreachable or returns a non-2xx,
 * a RuntimeException with a clear message is thrown — callers decide policy.
 */
@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AiServiceClient(AppProperties props, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        // Configure timeouts
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30_000);
        factory.setReadTimeout(60_000);

        this.restClient = RestClient.builder()
                .baseUrl(props.getAiService().getUrl())
                .requestFactory(factory)
                .build();
    }

    /**
     * Send a PDF to the AI service for parsing.
     *
     * @param fileName original filename (for the multipart part name)
     * @param pdfBytes raw PDF bytes
     * @return structured parse result
     * @throws RuntimeException if the AI service is down or returns an error
     */
    public ParseResponse parseResume(String fileName, byte[] pdfBytes) {
        log.debug("Calling AI service /parse-resume for file: {} ({} bytes)", fileName, pdfBytes.length);

        try {
            // Build multipart body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileResource = new ByteArrayResource(pdfBytes) {
                @Override
                public String getFilename() { return fileName; }
            };
            body.add("file", fileResource);

            return restClient.post()
                    .uri("/parse-resume")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(ParseResponse.class);

        } catch (ResourceAccessException e) {
            log.error("AI service unreachable at /parse-resume: {}", e.getMessage());
            throw new RuntimeException(
                    "AI service is unavailable. Please try again later.", e);
        } catch (RestClientException e) {
            log.error("AI service /parse-resume returned error: {}", e.getMessage());
            throw new RuntimeException(
                    "Resume parsing failed: " + e.getMessage(), e);
        }
    }

    /**
     * Request a candidate score from the AI service.
     *
     * @param request the scoring request
     * @return scoring result with composite/semantic/keyword scores
     * @throws RuntimeException if the AI service is down or returns an error
     */
    public AiScoreResponse scoreCandidate(AiScoreRequest request) {
        log.debug("Calling AI service /score (method=POST)");

        try {
            return restClient.post()
                    .uri("/score")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AiScoreResponse.class);

        } catch (ResourceAccessException e) {
            log.error("AI service unreachable at /score: {}", e.getMessage());
            throw new RuntimeException(
                    "AI service is unavailable. Please try again later.", e);
        } catch (RestClientException e) {
            log.error("AI service /score returned error: {}", e.getMessage());
            throw new RuntimeException(
                    "Candidate scoring failed: " + e.getMessage(), e);
        }
    }
}
