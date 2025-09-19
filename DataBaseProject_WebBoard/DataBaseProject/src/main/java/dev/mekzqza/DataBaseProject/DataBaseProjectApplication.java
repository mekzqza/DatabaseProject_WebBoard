package dev.mekzqza.DataBaseProject;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;  // เปลี่ยนเป็น Controller
import org.springframework.web.bind.annotation.ResponseBody;

@SpringBootApplication
@Controller  // ใช้ @Controller แทน @RestController
class WebboadProjectApplication {

	MyJDBC dataBase = new MyJDBC();




	@GetMapping("/greeting")
	public String getGreeting(Model model) {
		// ส่งข้อมูลไปยัง Frontend ผ่าน Model
		model.addAttribute("message555", "Hello, welcome to the website!");
		return "greeting";  // Spring Boot จะไปหา greeting.html ในโฟลเดอร์ templates
	}

	@GetMapping("/greeting/Test")
	@ResponseBody
	public String Test() {
		return "hello Test";
	}

	@GetMapping("/hello")
	public String hello(Model model){
		model.addAttribute("message","mekzqza");
		return "hello";
	}



	public static void main(String[] args) {
		SpringApplication.run(WebboadProjectApplication.class, args);
	}
}
