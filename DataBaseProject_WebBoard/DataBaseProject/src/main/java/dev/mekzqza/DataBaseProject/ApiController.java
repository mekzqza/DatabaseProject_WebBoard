package dev.mekzqza.DataBaseProject;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ApiController {

    @PostMapping("/api/submit")
    public void submitData(@RequestBody Map<String, String> data) {
        // รับข้อมูลจาก Frontend
        String username = data.get("username");
        String password = data.get("password");

        // ประมวลผลข้อมูล (ตัวอย่างนี้แค่แสดงผลใน console)
        System.out.println("Received Username: " + username);
        System.out.println("Received Password: " + password);

        // คุณสามารถบันทึกข้อมูลลงฐานข้อมูลได้ที่นี่
    }
}
