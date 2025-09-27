package dev.mekzqza.DataBaseProject.ConnecDatabases;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;


public class ThreadConnect {
    String url = "jdbc:mysql://127.0.0.1:3307/login_schema";
    String username = "root";  // ชื่อผู้ใช้ฐานข้อมูล
    String dbPassword = "mek0934396759";

    /**
     * Insert a new thread into `threads` table and return the generated thread_id.
     *
     * @param categoryId category id (required)
     * @param userId     user id (required)
     * @param title      thread title (required, non-blank)
     * @param content    thread content (required)
     * @return the generated thread_id
     */
    public long newThread(long categoryId, long userId, String title, String content) {

        if (categoryId <= 0) throw new IllegalArgumentException("categoryId is required");
        if (userId <= 0) throw new IllegalArgumentException("userId is required");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title is required");
        if (content == null) throw new IllegalArgumentException("content is required");

        String insertSql = "INSERT INTO threads (category_id, user_id, title, content, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, NOW(), NOW())";

        try (Connection connection = DriverManager.getConnection(url, username, dbPassword);
             PreparedStatement ps = connection.prepareStatement(insertSql, PreparedStatement.RETURN_GENERATED_KEYS)) {

            ps.setLong(1, categoryId);
            ps.setLong(2, userId);
            ps.setString(3, title);
            ps.setString(4, content);

            int affected = ps.executeUpdate();
            if (affected == 0) {
                return -1;  // หรือสามารถกำหนดให้เป็นค่าผิดปกติที่ไม่ใช่รหัสจริง
            }

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);  // คืนค่าค่า thread_id ที่สร้างขึ้น
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return -1;  // คืนค่าผิดปกติหากเกิดข้อผิดพลาด
    }


}
