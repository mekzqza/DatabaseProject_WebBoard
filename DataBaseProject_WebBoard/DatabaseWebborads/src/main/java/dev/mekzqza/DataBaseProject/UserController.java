package dev.mekzqza.DataBaseProject;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class UserController {

    // GET /api/users/{id}
    @GetMapping("/users/{id}")
    public ResponseEntity<Object> getUserById(@PathVariable("id") String id) {
        MyJDBC myJDBC = new MyJDBC();
        Map<String, String> row = myJDBC.selectUserByID(id);
        if (row == null || row.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", false, "message", "User not found"));
        }

        Map<String, Object> out = new HashMap<>();
        out.put("id", row.get("user_id"));
        out.put("username", row.get("username"));
        out.put("email", row.get("email"));
        out.put("avatar", row.get("avatar_url"));
        out.put("bio", row.get("bio"));
        out.put("social", row.get("social_links"));
        out.put("role", row.get("role"));

        return ResponseEntity.ok(out);
    }

    // GET /api/users/me
    @GetMapping("/users/me")
    public ResponseEntity<Object> getMe(HttpServletRequest request, Principal principal) {
        String userId = null;
        MyJDBC myJDBC = new MyJDBC();

        if (principal != null && principal.getName() != null) {
            // principal likely contains username - attempt to map to user_id
            userId = myJDBC.getUserIdByUsername(principal.getName());
        }

        if (userId == null) {
            // fallback to header X-User-Id for dev/testing
            String header = request.getHeader("X-User-Id");
            if (header != null && !header.isBlank()) userId = header.trim();
        }

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", false, "message", "Unauthorized"));
        }

        Map<String, String> row = myJDBC.selectUserByID(userId);
        if (row == null || row.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", false, "message", "User not found"));
        }

        Map<String, Object> out = new HashMap<>();
        out.put("id", row.get("user_id"));
        out.put("username", row.get("username"));
        out.put("email", row.get("email"));
        out.put("avatar", row.get("avatar_url"));
        out.put("bio", row.get("bio"));
        out.put("social", row.get("social_links"));
        out.put("role", row.get("role"));

        return ResponseEntity.ok(out);
    }
}

