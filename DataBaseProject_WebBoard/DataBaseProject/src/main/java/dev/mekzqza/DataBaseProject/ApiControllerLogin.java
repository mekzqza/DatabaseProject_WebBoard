package dev.mekzqza.DataBaseProject;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000") // หรือเพิ่ม allowedOrigins ที่จำเป็น
@RestController
public class ApiControllerLogin {

    @PostMapping("/api/submit")
    public ResponseEntity<Map<String, Object>> submitData(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        System.out.println(">>> Received Username: " + username);
        System.out.println(">>> Received Password: " + password);

        // TODO: แทนที่ด้วยการตรวจสอบจากฐานข้อมูลจริง
        boolean loginSuccess = "testuser".equals(username) && "password".equals(password);

        if (loginSuccess) {
            // ถ้าล็อกอินสำเร็จ, return 200 กับ body
            return ResponseEntity.ok(Map.of(
                    "status", true,
                    "message", "Login successful",
                    "username", username
            ));
        } else {
            // ถ้าล็อกอินไม่สำเร็จ, return 401 Unauthorized
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", false,
                    "message", "Invalid username or password"
            ));
        }
    }
}