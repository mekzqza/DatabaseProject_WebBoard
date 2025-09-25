package dev.mekzqza.DataBaseProject.controller;

import dev.mekzqza.DataBaseProject.dto.ThreadDto;
import dev.mekzqza.DataBaseProject.model.ThreadEntity;
import dev.mekzqza.DataBaseProject.service.ThreadService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/threads")
public class ThreadController {

    private final ThreadService threadService;

    @Autowired
    public ThreadController(ThreadService threadService) {
        this.threadService = threadService;
    }

    @PostMapping
    public ResponseEntity<?> createThread(@Valid @RequestBody ThreadDto dto) {
        try {
            ThreadEntity created = threadService.createThread(dto);
            return ResponseEntity.created(URI.create("/api/threads/" + created.getId()))
                    .body(Map.of(
                            "success", true,
                            "message", "Thread created",
                            "thread", created
                    ));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to create thread"
            ));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> recentThreads(@RequestParam(defaultValue = "10") int limit) {
        List<ThreadEntity> list = threadService.getRecentThreads(limit);
        return ResponseEntity.ok(Map.of("success", true, "threads", list));
    }
}