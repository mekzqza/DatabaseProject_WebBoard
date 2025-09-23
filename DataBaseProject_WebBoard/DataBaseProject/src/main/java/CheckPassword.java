//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//
//public class CheckPassword {
//
//    private BCryptPasswordEncoder passwordEncoder;
//
//    public CheckPassword() {
//        this.passwordEncoder = new BCryptPasswordEncoder();  // สร้าง BCryptPasswordEncoder สำหรับการแฮชและตรวจสอบรหัสผ่าน
//    }
//
//    // เมธอดสำหรับแฮชรหัสผ่าน
//    public String hashPassword(String password) {
//        return passwordEncoder.encode(password);  // ใช้ BCrypt ในการแฮชรหัสผ่าน
//    }
//
//    // เมธอดสำหรับตรวจสอบรหัสผ่านที่กรอกกับแฮชในฐานข้อมูล
//    public boolean checkPassword(String inputPassword, String storedHashedPassword) {
//        return passwordEncoder.matches(inputPassword, storedHashedPassword);  // ตรวจสอบว่า password ที่กรอกตรงกับแฮชในฐานข้อมูล
//    }
//
//    public static void main(String[] args) {
//        // ตัวอย่างการใช้งาน CheckPassword
//        CheckPassword checkPassword = new CheckPassword();
//
//        // แฮชรหัสผ่าน
//        String password = "mySecretPassword123";
//        String hashedPassword = checkPassword.hashPassword(password);
//        System.out.println("Hashed Password: " + hashedPassword);
//
//        // ตรวจสอบรหัสผ่าน
//        boolean isPasswordValid = checkPassword.checkPassword("mySecretPassword123", hashedPassword);
//        System.out.println("Is password valid? " + isPasswordValid);
//    }
//}
