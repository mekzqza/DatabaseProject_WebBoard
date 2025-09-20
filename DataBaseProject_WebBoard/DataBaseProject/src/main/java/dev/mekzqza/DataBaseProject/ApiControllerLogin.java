package dev.mekzqza.DataBaseProject;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ApiControllerLogin {


    //Input form locallhost:8080/login.thml  @PostMapping
    //เหมือนการนัดเจอกันของข้อมูลบน locallhost:8080/api/submit ฝั่ง fornend
    // fetch('/api/submit', {
    //            method: 'POST',  // ใช้ POST เพื่อส่งข้อมูล
    //            headers: {
    //                'Content-Type': 'application/json'  // ส่งข้อมูลในรูปแบบ JSON
    //            },
    //            body: JSON.stringify({ username: username, password: password })  // แปลงข้อมูลเป็น JSON
    //        })


    @PostMapping("/api/submit")
    public String submitData(@RequestBody Map<String, String> data) {
        // รับข้อมูลจาก Frontend
        String username = data.get("username");
        String password = data.get("password");

        // ประมวลผลข้อมูล (ตัวอย่างนี้แค่แสดงผลใน console)
        System.out.println("Received Username: " + username);
        System.out.println("Received Password: " + password);

        // คุณสามารถบันทึกข้อมูลลงฐานข้อมูลได้ที่นี่
        return "success";
    }


}
