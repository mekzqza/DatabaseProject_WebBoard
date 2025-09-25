package dev.mekzqza.DataBaseProject;


import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import Services.PasswordHash;


public  class MyJDBC {
    // สตริงเชื่อมต่อกับฐานข้อมูล
    String url = "jdbc:mysql://127.0.0.1:3307/login_schema";
    String username = "root";  // ชื่อผู้ใช้ฐานข้อมูล
    String dbPassword = "mek0934396759";  // รหัสผ่านฐานข้อมูล




    public Map<String ,String> sQlSeLect(String command){
        Map<String,String > userCredentials = new HashMap<>();

        try{
            Connection connection = DriverManager.getConnection(
                    "jdbc:mysql://127.0.0.1:3307/login_schema",
                    "root",
                    "mek0934396759"
            );
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(command);

            while (resultSet.next()) {
                String username = resultSet.getString("username");  // ใช้ "username" เป็น key
                String password = resultSet.getString("password_hash");  // เปลี่ยนเป็น password_hash
                userCredentials.put(username, password);  // เก็บข้อมูลลงใน HashMap
            }

        }catch (SQLException e){
            e.printStackTrace();
        }
        return userCredentials ;
    }

    // ตรวจสอบว่าชื่อผู้ใช้มีในฐานข้อมูลแล้วหรือยัง
    public boolean userExistsByUsername(String usernameValue) {
        if (usernameValue == null) return false;
        String query = "SELECT user_id FROM users WHERE username = ? LIMIT 1";
        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, usernameValue);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            // หากไม่สามารถตรวจสอบได้ ให้ถือว่าไม่มี (หรือจะเปลี่ยนเป็น throw ได้ตามต้องการ)
            return false;
        }
    }

    // ตรวจสอบอีเมลว่ามีอยู่หรือยัง
    public boolean userExistsByEmail(String emailValue) {
        if (emailValue == null) return false;
        String query = "SELECT user_id FROM users WHERE email = ? LIMIT 1";
        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, emailValue);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // คืนค่า user_id เป็น String โดยค้นหาจาก username (หรือ null ถ้าไม่พบ)
    public String getUserIdByUsername(String usernameValue) {
        if (usernameValue == null) return null;
        String query = "SELECT user_id FROM users WHERE username = ? LIMIT 1";
        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, usernameValue);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("user_id");
                }
                return null;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    ///เพิ่ม User ใหม่
    // เพิ่ม User ใหม่: พารามิเตอร์สอดคล้องกับคอลัมน์ของตาราง users ยกเว้น user_id
    // เพิ่ม return boolean เพื่อแจ้งสถานะการ insert
    public boolean addNewUser(String usernameValue,
                           String email,
                           String passwordHash,
                           String avatarUrl,
                           String bio,
                           String socialLinks,
                           String role,
                           Timestamp createdAt,
                           Timestamp updatedAt) {

        // ตรวจสอบความซ้ำของ username ก่อน insert
        if (usernameValue != null && userExistsByUsername(usernameValue)) {
            System.out.println("Cannot add user: username already exists -> " + usernameValue);
            return false;
        }

        // ตรวจสอบความซ้ำของ email ก่อน insert
        if (email != null && userExistsByEmail(email)) {
            System.out.println("Cannot add user: email already exists -> " + email);
            return false;
        }

        // ถ้า parameter ที่ส่งเข้ามาเป็นรหัสผ่านธรรมดา (ไม่ใช่รูปแบบ hash ของเรา) ให้ทำการ hash ก่อน
        String toStorePassword = null;
        if (passwordHash != null) {
            // รูปแบบ hash ที่สร้างจาก PasswordHash คือ: iterations:salt:hash  -> เริ่มต้นด้วยตัวเลขและ ':'
            if (passwordHash.matches("^\\d+:.*:.*$")) {
                // ดูเหมือนว่าจะเป็น hash อยู่แล้ว
                toStorePassword = passwordHash;
            } else {
                // ยังเป็น plain text -> สร้าง hash
                toStorePassword = PasswordHash.createHash(passwordHash);
            }
        }

        String sql = "INSERT INTO users (username, email, password_hash, avatar_url, bio, social_links, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            // ตั้งค่าค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, usernameValue);
            preparedStatement.setString(2, email);
            preparedStatement.setString(3, toStorePassword);
            preparedStatement.setString(4, avatarUrl);
            preparedStatement.setString(5, bio);
            preparedStatement.setString(6, socialLinks);
            preparedStatement.setString(7, role);
            preparedStatement.setTimestamp(8, createdAt);
            preparedStatement.setTimestamp(9, updatedAt);

            // รันคำสั่ง INSERT
            int rowsAffected = preparedStatement.executeUpdate();

            // เช็คจำนวนแถวที่ได้รับผลกระทบจากการเพิ่มข้อมูล
            if (rowsAffected > 0) {
                System.out.println("User added successfully!");
                return true;
            } else {
                System.out.println("Failed to add user.");
                return false;
            }

        } catch (SQLIntegrityConstraintViolationException e) {
            // กรณี duplicate key หรือ constraint อื่นๆ
            System.out.println("Insert failed: duplicate or constraint violation (username/email may already exist): " + usernameValue);
            return false;
        } catch (SQLException e) {
            // หากเกิดข้อผิดพลาดอื่นๆ
            e.printStackTrace();
            return false;
        }

    }

    // Compatibility overload: เก็บของเดิมที่เรียกด้วย (username, password)
    public boolean addNewUser(String username, String password) {
        // ถ้ามีอยู่แล้ว ไม่ต้องแทรก
        if (username != null && userExistsByUsername(username)) {
            System.out.println("Cannot add user: username already exists -> " + username);
            return false;
        }

        // ทำการ hash รหัสผ่านก่อนเก็บ
        String hashedPassword = null;
        if (password != null) {
            hashedPassword = PasswordHash.createHash(password);
        }

        Timestamp now = new Timestamp(System.currentTimeMillis());
        // ส่งค่า default สำหรับคอลัมน์อื่น ๆ (email, avatar, bio, social_links) เป็น null
        return addNewUser(
                username,
                null,            // email
                hashedPassword,  // password_hash (now hashed)
                null,            // avatar_url
                null,            // bio
                null,            // social_links
                "user",         // role (default)
                now,             // created_at
                now              // updated_at
        );
    }


    public void databaseTestCommands(String command){

        try{
            Connection connection = DriverManager.getConnection(
                    "jdbc:mysql://127.0.0.1:3307/login_schema",
                    "root",
                    "mek0934396759"
            );
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(command);

            while (resultSet.next()){
                System.out.println(resultSet.getString("username"));
                System.out.println(resultSet.getString("password_hash"));
            }

        }catch (SQLException e){
            e.printStackTrace();
        }
    }
    // ฟังก์ชันอัปเดตชื่อผู้ใช้

    public Map<String, String> selectUserByID(String userID) {
        Map<String, String> user = new HashMap<>();
        String query = "SELECT user_id, username, email, password_hash, avatar_url, bio, social_links, role, created_at, updated_at FROM users WHERE user_id = ?";  // ดึงทุกคอลัมน์ที่สำคัญ

        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {

            // ตั้งค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, userID);  // ตั้งค่า user_id ใน query

            // รันคำสั่ง SELECT
            ResultSet resultSet = preparedStatement.executeQuery();

            // ถ้าพบข้อมูลผู้ใช้
            if (resultSet.next()) {
                // อ่านทุกคอลัมน์เป็น String (แปลง timestamp เป็น string ด้วย)
                String id = resultSet.getString("user_id");
                String username = resultSet.getString("username");
                String email = resultSet.getString("email");
                String password = resultSet.getString("password_hash");
                String avatar = resultSet.getString("avatar_url");
                String bio = resultSet.getString("bio");
                String social = resultSet.getString("social_links");
                String role = resultSet.getString("role");

                Timestamp createdTs = resultSet.getTimestamp("created_at");
                Timestamp updatedTs = resultSet.getTimestamp("updated_at");
                String created = createdTs != null ? createdTs.toString() : null;
                String updated = updatedTs != null ? updatedTs.toString() : null;

                // เก็บลงใน Map
                user.put("user_id", id);
                user.put("username", username);
                user.put("email", email);
                // ไม่คืน password_hash เพื่อความปลอดภัย
                //user.put("password_hash", password);
                user.put("avatar_url", avatar);
                user.put("bio", bio);
                user.put("social_links", social);
                user.put("role", role);
                user.put("created_at", created);
                user.put("updated_at", updated);

                // พิมพ์ข้อมูลทั้งหมดแบบ key: value
                System.out.println("--- User details ---");
                user.forEach((k, v) -> System.out.println(k + ": " + v));
                System.out.println("--- End user details ---");

            } else {
                System.out.println("User not found with ID: " + userID);
            }

        } catch (SQLException e) {
            e.printStackTrace();  // หากเกิดข้อผิดพลาด
        }

        return user;  // คืนค่าผลลัพธ์ (map ที่มีทุกคอลัมน์เป็น string)
    }

    public void updateUserName(String userID, String newUsername) {
        String sql = "UPDATE users SET username = ? WHERE user_id = ?";

        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            // ตั้งค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, newUsername);  // ตั้งค่าชื่อผู้ใช้ใหม่
            preparedStatement.setString(2, userID);  // ตั้งค่ารหัสผู้ใช้ (user_id)

            // รันคำสั่ง UPDATE
            int rowsAffected = preparedStatement.executeUpdate();

            // เช็คจำนวนแถวที่ได้รับผลกระทบจากการอัปเดตข้อมูล
            if (rowsAffected > 0) {
                System.out.println("Username updated successfully!");
            } else {
                System.out.println("Failed to update username. User not found.");
            }

        } catch (SQLException e) {
            // หากเกิดข้อผิดพลาด
            e.printStackTrace();
        }
    }

    // ฟังก์ชันอัปเดตรหัสผ่าน
    public void updateUserPassword(String userID, String newPassword) {
        String sql = "UPDATE users SET password_hash = ? WHERE user_id = ?";

        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            // hash รหัสผ่านก่อนบันทึก
            String hashed = newPassword != null ? PasswordHash.createHash(newPassword) : null;

            // ตั้งค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, hashed);  // ตั้งค่ารหัสผ่านใหม่ (hashed)
            preparedStatement.setString(2, userID);  // ตั้งค่ารหัสผู้ใช้ (user_id)

            // รันคำสั่ง UPDATE
            int rowsAffected = preparedStatement.executeUpdate();

            // เช็คจำนวนแถวที่ได้รับผลกระทบจากการอัปเดตข้อมูล
            if (rowsAffected > 0) {
                System.out.println("Password updated successfully!");
            } else {
                System.out.println("Failed to update password. User not found.");
            }

        } catch (SQLException e) {
            // หากเกิดข้อผิดพลาด
            e.printStackTrace();
        }
    }

    // ฟังก์ชันตรวจสอบรหัสผ่าน (ล็อคอิน)
    // คืนค่า true ถ้ารหัสผ่านตรงกับ hash ในฐานข้อมูล
    public boolean authenticate(String usernameValue, String plainPassword) {
        if (usernameValue == null || plainPassword == null) return false;
        String query = "SELECT password_hash FROM users WHERE username = ? LIMIT 1";
        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, usernameValue);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password_hash");
                    if (storedHash == null) return false;
                    return PasswordHash.verifyPassword(plainPassword, storedHash);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public static void main(String[] args) {

   }

}
