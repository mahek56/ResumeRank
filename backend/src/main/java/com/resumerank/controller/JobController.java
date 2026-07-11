package com.resumerank.controller;

import com.resumerank.dto.JobRequest;
import com.resumerank.dto.JobResponse;
import com.resumerank.dto.PageResponse;
import com.resumerank.entity.User;
import com.resumerank.service.JobService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for Job CRUD.
 * All endpoints require authentication. Owner check enforced in service layer.
 */
@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public ResponseEntity<JobResponse> create(@Valid @RequestBody JobRequest request,
                                              @AuthenticationPrincipal User user) {
        JobResponse job = jobService.create(request, user);
        return ResponseEntity.status(201).body(job);
    }

    @GetMapping
    public ResponseEntity<PageResponse<JobResponse>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));
        PageResponse<JobResponse> jobs = jobService.findByOwner(user.getId(), pageable);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> findById(@PathVariable UUID id,
                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(jobService.findById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> update(@PathVariable UUID id,
                                              @Valid @RequestBody JobRequest request,
                                              @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(jobService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal User user) {
        jobService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
