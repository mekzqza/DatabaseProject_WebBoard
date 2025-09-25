package dev.mekzqza.DataBaseProject;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000") // หรือเพิ่ม allowedOrigins ที่จำเป็น
@RestController
public class ApiControllerLogin {

    @PostMapping("/api/login")
    public ResponseEntity<Map<String, Object>> submitData(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        System.out.println(">>> Received Username: " + username);
        // don't print password in production logs

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", false,
                    "message", "username and password are required"
            ));
        }

        try {
            MyJDBC myJDBC = new MyJDBC();
            boolean loginSuccess = myJDBC.authenticate(username, password);

            if (loginSuccess) {
                // get user id and details (remove or mask password if desired)
                String userId = myJDBC.getUserIdByUsername(username);
                Map<String, String> userDetails = userId != null ? myJDBC.selectUserByID(userId) : new HashMap<>();
                // avoid exposing password_hash in API response
                if (userDetails != null) {
                    userDetails.remove("password_hash");
                }

                Map<String, Object> body = new HashMap<>();
                body.put("status", true);
                body.put("message", "Login successful");
                body.put("username", username);
                body.put("user", userDetails);

                return ResponseEntity.ok(body);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "status", false,
                        "message", "Invalid username or password"
                ));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", false,
                    "message", "Internal server error"
            ));
        }
    }

    @PostMapping("/api/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> data) {
        // Log incoming payload to help debugging wrong values
        System.out.println("/api/register payload: " + data);

        String username = data.get("username");
        String password = data.get("password");
        String email = data.get("email");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", false,
                    "message", "username and password are required"
            ));
        }

        // Trim inputs
        username = username.trim();
        password = password.trim();
        if (email != null) email = email.trim();

        // Debug log: show trimmed/normalized values (do not print password)
        System.out.println("/api/register received -> username: '" + username + "', email: '" + email + "'");

        try {
            MyJDBC myJDBC = new MyJDBC();
            // extra check
            if (myJDBC.userExistsByUsername(username)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "status", false,
                        "message", "username already exists"
                ));
            }

            // Call the full addNewUser to include email and proper timestamps
            Timestamp now = new Timestamp(System.currentTimeMillis());
            boolean created = myJDBC.addNewUser(
                    username,
                    email,
                    password, // plain password - addNewUser will hash it
                    null, // avatarUrl
                    null, // bio
                    null, // socialLinks
                    "user",
                    now,
                    now
            );

            if (created) {
                return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                        "status", true,
                        "message", "User created",
                        "username", username
                ));
            } else {
                // If not created, try to determine reason (duplicate etc.)
                if (myJDBC.userExistsByUsername(username)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                            "status", false,
                            "message", "username already exists"
                    ));
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                        "status", false,
                        "message", "Failed to create user"
                ));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", false,
                    "message", "Internal server error"
            ));
        }
    }
}

