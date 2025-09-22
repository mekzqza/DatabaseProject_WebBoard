package ModulesClass;

import java.util.ArrayList;
import java.util.List;

public class CacheServer {
    private List<User> users;  // ใช้ List เพื่อเก็บข้อมูลผู้ใช้ใน Cache

    // Constructor
    public CacheServer() {
        this.users = new ArrayList<>();  // สร้าง List ใหม่เพื่อเก็บ User
    }

    // เมธอดสำหรับเพิ่มผู้ใช้ลงใน Cache
    public void addUser(User user) {
        users.add(user);  // เพิ่ม User ลงใน List
    }

    // เมธอดสำหรับดึงผู้ใช้จาก Cache
    public User getUserById(String userId) {
        for (User user : users) {
            if (user.getId().equals(userId)) {
                return user;  // คืนค่าผู้ใช้ที่ตรงกับ userId
            }
        }
        return null;  // หากไม่พบผู้ใช้
    }

    // เมธอดสำหรับแสดงข้อมูลผู้ใช้ทั้งหมดใน Cache
    public List<User> getAllUsers() {
        return users;  // คืนค่ารายการผู้ใช้ทั้งหมดใน Cache
    }

    // เมธอดสำหรับลบผู้ใช้จาก Cache
    public void removeUserById(String userId) {
        users.removeIf(user -> user.getId().equals(userId));  // ลบผู้ใช้ตาม userId
    }
}
