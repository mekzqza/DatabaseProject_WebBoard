package dev.mekzqza.DataBaseProject.ControllersApi;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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
}
