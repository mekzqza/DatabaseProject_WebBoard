package dev.mekzqza.DataBaseProject;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000") // อนุญาต React ที่พอร์ต 3000 --->URL จากfornt  "http://localhost:3000"

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
    public Map<String,Object> submitData(@RequestBody Map<String,String> data){
        String username = data.get("username");
        String password = data.get("password");
        System.out.println(">>> Received Username: " + username);
        System.out.println(">>> Received Password: " + password);

//         สามารถใช้ Class MYJDBC เพื่อเพิ่ม user,password Database Table Userได้เลย
//        MyJDBC myJDBC = new MyJDBC();
//        เพิ่ม User ใหม่ได้เลย แต่ตอนนี้จะทำเป็น เพิ่มใน database + Cache เพื่อใช้ใน ในการคำนวนใน server ขณะนั้นเพื่อเป็นการ optimize
//        myJDBC.addNewUser(username,username);



        //Return ค่ากับออกไปหน้า Rract
        return Map.of("status","success","username",username);
    }



    @RestController
    public class MyController {
        @GetMapping("/api/message")
        public Map<String, String> getMessage() {
            return Map.of("message", "Hello from Java Backend 👋 " +
                    "///  mapping at:http://localhost:3000/api/message\"");
        }
    }


}
