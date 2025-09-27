package dev.mekzqza.DataBaseProject;



import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;  // เปลี่ยนเป็น Controller
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

//import org.springframework.web.bind.annotation.ResponseBody;

///check point  0d7fe6ac-7f4a-4f3d-8e2b-5e6f3c9e6a1b
import java.util.Map;

@SpringBootApplication
@Controller  // ใช้ @Controller แทน @RestController


class WebboadProjectApplication {

	@GetMapping("/greeting")
	public String getGreeting(Model model) {

		MyJDBC myJDBC = new MyJDBC();
		String command = "SELECT * FROM users";

		Map<String,String> credentials  = myJDBC.sQlSeLect(command);

		for (Map.Entry<String, String> entry : credentials.entrySet()) {
			// ไม่โชว์ hash ตรงๆ เพื่อความปลอดภัย
			model.addAttribute("message555",
					"Username: " + entry.getKey() + ", Password: [HIDDEN]"
			);
		}

		// ส่งข้อมูลไปยัง Frontend ผ่าน Model

		return "greeting";  // Spring Boot จะไปหา greeting.html ในโฟลเดอร์ templates
	}

	//RUNApp
	public static void main(String[] args) {
		SpringApplication.run(WebboadProjectApplication.class, args);

	}
}
