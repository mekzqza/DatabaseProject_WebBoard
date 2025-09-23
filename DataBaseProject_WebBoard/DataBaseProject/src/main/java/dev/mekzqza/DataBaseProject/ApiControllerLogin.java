package dev.mekzqza.DataBaseProject;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000") // อนุญาต React ที่พอร์ต 3000 --->URL จากfornt  "http://localhost:3000"

@RestController
public class ApiControllerLogin {

    @PostMapping("/api/submit")
    public Map<String, Object> submitData(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        System.out.println(">>> Received Username: " + username);
        System.out.println(">>> Received Password: " + password);

        boolean loginSuccess = true;
        if (loginSuccess) {
            // ถ้าล็อกอินสำเร็จ, return true
            return Map.of("status", true, "message", "Login successful", "username", username);
        } else {
            // ถ้าล็อกอินไม่สำเร็จ, return false
            return Map.of("status", false, "message", "Invalid username or password");
        }

    }

}
