package dev.mekzqza.DataBaseProject;


import java.sql.*;
import java.util.HashMap;
import java.util.Map;


public  class MyJDBC {
    // สตริงเชื่อมต่อกับฐานข้อมูล
    String url = "jdbc:mysql://127.0.0.1:3307/login_schema";
    String username = "root";  // ชื่อผู้ใช้ฐานข้อมูล
    String dbPassword = "mek0934396759";  // รหัสผ่านฐานข้อมูล


    public static void main(String[] args) {
        MyJDBC myJDBC =new MyJDBC();


   }


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



    public void databaseCommands(String command){

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



}
