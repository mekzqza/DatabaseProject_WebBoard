package dev.mekzqza.DataBaseProject;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SecureRandom secureRandom = new SecureRandom();

    // POST /api/auth/forgot-password
    @PostMapping("/forgot-password")
    public ResponseEntity<Object> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.ok(Map.of("status", "ok", "message", "If that email exists, a reset link has been sent."));
        }

        MyJDBC myJDBC = new MyJDBC();
        try {
            String userId = myJDBC.getUserIdByEmail(email.trim());
            if (userId != null) {
                // generate token
                byte[] rnd = new byte[32];
                secureRandom.nextBytes(rnd);
                String token = Base64.getUrlEncoder().withoutPadding().encodeToString(rnd);

                Instant now = Instant.now();
                Timestamp createdAt = Timestamp.from(now);
                Timestamp expiresAt = Timestamp.from(now.plus(Duration.ofHours(1)));

                boolean saved = myJDBC.savePasswordResetToken(token, userId, expiresAt, createdAt);
                if (saved) {
                    // In production send email with token link; for now log to console
                    System.out.println("Password reset token for user_id=" + userId + ": " + token);
                    // TODO: integrate SMTP / send email to user with link to frontend reset page
                } else {
                    System.out.println("Failed to save password reset token for user_id=" + userId);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Do not reveal to the client
        }

        // Always return generic message to avoid user enumeration
        return ResponseEntity.ok(Map.of("status", "ok", "message", "If that email exists, a reset link has been sent."));
    }

    // POST /api/auth/reset-password
    @PostMapping("/reset-password")
    public ResponseEntity<Object> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", false, "message", "Invalid or expired token"));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", false, "message", "Password must be at least 8 characters"));
        }

        MyJDBC myJDBC = new MyJDBC();
        try {
            Map<String, Object> tokenRow = myJDBC.findPasswordResetToken(token);
            if (tokenRow == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", false, "message", "Invalid or expired token"));
            }

            Object expiresObj = tokenRow.get("expires_at");
            Timestamp expiresAt = null;
            if (expiresObj instanceof Timestamp) expiresAt = (Timestamp) expiresObj;
            else if (expiresObj != null) expiresAt = Timestamp.valueOf(expiresObj.toString());

            if (expiresAt == null || expiresAt.before(new Timestamp(System.currentTimeMillis()))) {
                // consume expired token if exists
                try { myJDBC.deletePasswordResetToken(token); } catch (Exception ignored) {}
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", false, "message", "Invalid or expired token"));
            }

            String userId = (String) tokenRow.get("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", false, "message", "Invalid or expired token"));
            }

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String hashed = encoder.encode(newPassword);

            boolean updated = myJDBC.updateUserPassword(userId, hashed);
            if (!updated) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("status", false, "message", "Failed to update password"));
            }

            // consume token
            myJDBC.deletePasswordResetToken(token);

            return ResponseEntity.ok(Map.of("status", true, "message", "Password updated"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("status", false, "message", "Internal server error"));
        }
    }
}

