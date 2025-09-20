package dev.mekzqza.DataBaseProject;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;  // เปลี่ยนเป็น Controller
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
//import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@Controller  // ใช้ @Controller แทน @RestController


class WebboadProjectApplication {
	
	@GetMapping("/greeting")
	public String getGreeting(Model model) {

		MyJDBC myJDBC =new MyJDBC();
		String command = "SELECT * FROM user";

		Map<String,String> credentials  = myJDBC.sQlSeLect(command);

		for (Map.Entry<String, String> entry : credentials.entrySet()) {
			model.addAttribute("message555",
					"Username: " + entry.getKey() + ", Password: " + entry.getValue()
			);
		}

		// ส่งข้อมูลไปยัง Frontend ผ่าน Model

		return "greeting";  // Spring Boot จะไปหา greeting.html ในโฟลเดอร์ templates
	}


//    @RestController
//    public class ApiController {
//        @GetMapping("/api/hello")
//        public Map<String, String> hello() {
//            Map<String, String> data = new HashMap<>();
//            data.put("message", "สวัสดีจาก Backend (Java)");
//            return data; // จะส่งกลับเป็น JSON { "message": "สวัสดีจาก Backend (Java)" }
//        }
//    }

	//RUNApp
	public static void main(String[] args) {
		SpringApplication.run(WebboadProjectApplication.class, args);
	}
	


}
