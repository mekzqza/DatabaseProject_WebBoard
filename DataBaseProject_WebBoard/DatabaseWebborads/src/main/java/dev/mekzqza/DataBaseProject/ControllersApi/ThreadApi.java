package dev.mekzqza.DataBaseProject.ControllersApi;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.mekzqza.DataBaseProject.ConnecDatabases.ThreadConnect;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")

public class ThreadApi {

    @GetMapping("/threads")
    public ResponseEntity<Object> getAllThreads() {
        try {
            ThreadConnect tc = new ThreadConnect();
            List<ThreadConnect.ThreadRow> threads = tc.getAllThreads();
            return ResponseEntity.ok(threads);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("status", false);
            err.put("message", "Failed to fetch threads");
            return ResponseEntity.status(500).body(err);
        }
    }

    @PostMapping("/threads")
    public ResponseEntity<Object> createThread(@RequestBody Map<String, Object> payload) {
        try {
            ThreadConnect tc = new ThreadConnect();

            // Accept both snake_case and camelCase keys
            Object titleObj = payload.getOrDefault("title", payload.get("Title"));
            Object contentObj = payload.getOrDefault("content", payload.get("Content"));
            Object categoryObj = payload.containsKey("category_id") ? payload.get("category_id") : payload.get("categoryId");
            Object userObj = payload.containsKey("user_id") ? payload.get("user_id") : payload.get("userId");

            String title = titleObj == null ? null : titleObj.toString().trim();
            String content = contentObj == null ? null : contentObj.toString().trim();

            long categoryId = 0L;
            long userId = 0L;
            try {
                if (categoryObj != null) {
                    if (categoryObj instanceof Number) categoryId = ((Number) categoryObj).longValue();
                    else categoryId = Long.parseLong(categoryObj.toString());
                }
                if (userObj != null) {
                    if (userObj instanceof Number) userId = ((Number) userObj).longValue();
                    else userId = Long.parseLong(userObj.toString());
                }
            } catch (NumberFormatException nfe) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "category_id and user_id must be numeric");
                return ResponseEntity.badRequest().body(err);
            }

            // validate
            if (title == null || title.isEmpty() || content == null || content.isEmpty()) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "title and content are required");
                return ResponseEntity.badRequest().body(err);
            }
            if (categoryId <= 0) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "category_id is required and must be > 0");
                return ResponseEntity.badRequest().body(err);
            }
            if (userId <= 0) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "user_id is required and must be > 0");
                return ResponseEntity.badRequest().body(err);
            }

            // check FK targets
            if (!tc.categoryExists(categoryId)) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "category not found");
                return ResponseEntity.status(404).body(err);
            }
            if (!tc.userExists(userId)) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "user not found");
                return ResponseEntity.status(404).body(err);
            }

            long createdId = tc.newThread(categoryId, userId, title, content);
            if (createdId <= 0) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", false);
                err.put("message", "Failed to create thread");
                return ResponseEntity.status(500).body(err);
            }

            ThreadConnect.ThreadRow created = tc.getThreadById(createdId);
            if (created == null) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("status", true);
                resp.put("thread_id", createdId);
                return ResponseEntity.status(201).body(resp);
            }

            return ResponseEntity.status(201).body(created);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("status", false);
            err.put("message", "Internal server error");
            return ResponseEntity.status(500).body(err);
        }
    }
}
