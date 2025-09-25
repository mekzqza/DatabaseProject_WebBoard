package dev.mekzqza.DataBaseProject;


import java.sql.*;
import java.util.HashMap;
import java.util.Map;


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
                String password = resultSet.getString("password");  // ใช้ "password" เป็น value
                userCredentials.put(username, password);  // เก็บข้อมูลลงใน HashMap
            }

        }catch (SQLException e){
            e.printStackTrace();
        }
        return userCredentials ;
    }


    ///เพิ่ม User ใหม่
    public void addNewUser(String name ,String password) {

        String sql = "INSERT INTO users (username, password) VALUES (?, ?)";
        try (Connection connection = DriverManager.getConnection(url, username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            // ตั้งค่าค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, name);  // ตั้งค่าชื่อผู้ใช้
            preparedStatement.setString(2, password);  // ตั้งค่ารหัสผ่าน

            // รันคำสั่ง INSERT
            int rowsAffected = preparedStatement.executeUpdate();

            // เช็คจำนวนแถวที่ได้รับผลกระทบจากการเพิ่มข้อมูล
            if (rowsAffected > 0) {
                System.out.println("User added successfully!");
            } else {
                System.out.println("Failed to add user.");
            }

        } catch (SQLException e) {
            // หากเกิดข้อผิดพลาด
            e.printStackTrace();
        }

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
                System.out.println(resultSet.getString("password"));
            }

        }catch (SQLException e){
            e.printStackTrace();
        }
    }
    // ฟังก์ชันอัปเดตชื่อผู้ใช้

    public Map<String, String> selectUserByID(String userID) {
        Map<String, String> user = new HashMap<>();
        String query = "SELECT username, password FROM users WHERE userID = ?";  // คำสั่ง SQL

        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {

            // ตั้งค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, userID);  // ตั้งค่า userID ใน query

            // รันคำสั่ง SELECT
            ResultSet resultSet = preparedStatement.executeQuery();

            // ถ้าพบข้อมูลผู้ใช้
            if (resultSet.next()) {
                String username = resultSet.getString("username");
                String password = resultSet.getString("password");
                user.put("username", username);  // เก็บ username ใน Map
                user.put("password", password);  // เก็บ password ใน Map


                System.out.println("userID:"+userID+" username:"+username+" password:"+password);
            } else {
                System.out.println("User not found with ID: " + userID);
            }

        } catch (SQLException e) {
            e.printStackTrace();  // หากเกิดข้อผิดพลาด
        }

        return user;  // คืนค่าผลลัพธ์ (username, password)
    }

    public void updateUserName(String userID, String newUsername) {
        String sql = "UPDATE users SET username = ? WHERE userID = ?";

        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            // ตั้งค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, newUsername);  // ตั้งค่าชื่อผู้ใช้ใหม่
            preparedStatement.setString(2, userID);  // ตั้งค่ารหัสผู้ใช้ (userID)

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
        String sql = "UPDATE users SET password = ? WHERE userID = ?";

        try (Connection connection = DriverManager.getConnection(url, this.username, dbPassword);
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {

            // ตั้งค่าพารามิเตอร์ในคำสั่ง SQL
            preparedStatement.setString(1, newPassword);  // ตั้งค่ารหัสผ่านใหม่
            preparedStatement.setString(2, userID);  // ตั้งค่ารหัสผู้ใช้ (userID)

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


    public Map<String, String> getuserById(long id) {
        Map<String, String> userCredentials = new HashMap<>();
        String sql = "SELECT username, password_hash AS password FROM users WHERE user_id = ?";

        try (Connection connection = DriverManager.getConnection(
                "jdbc:mysql://127.0.0.1:3307/login_schema",
                "root",
                "mek0934396759");
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setLong(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String username = rs.getString("username");
                    String password = rs.getString("password"); // นี่คือ password_hash จาก DB
                    userCredentials.put(username, password);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return userCredentials;
    }



//    public static void main(String[] args) {
//        MyJDBC myJDBC =new MyJDBC();
////        myJDBC.addNewUser("naruto","okage");
////        myJDBC.updateUserPassword("1","asdasdasd");
//        myJDBC.selectUserByID("10");
//
//   }

}
