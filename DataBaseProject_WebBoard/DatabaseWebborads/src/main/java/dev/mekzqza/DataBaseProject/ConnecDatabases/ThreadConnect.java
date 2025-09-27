package dev.mekzqza.DataBaseProject.ConnecDatabases;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


public class ThreadConnect {
    String url = "jdbc:mysql://127.0.0.1:3307/login_schema";
    String username = "root";  // ชื่อผู้ใช้ฐานข้อมูล
    String dbPassword = "mek0934396759";

    /**
     * Check whether a category exists (by category_id).
     */
    public boolean categoryExists(long categoryId) {
        if (categoryId <= 0) return false;
        String sql = "SELECT 1 FROM categories WHERE category_id = ? LIMIT 1";
        try (Connection conn = DriverManager.getConnection(url, username, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, categoryId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Check whether a user exists (by user_id).
     */
    public boolean userExists(long userId) {
        if (userId <= 0) return false;
        String sql = "SELECT 1 FROM users WHERE user_id = ? LIMIT 1";
        try (Connection conn = DriverManager.getConnection(url, username, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Insert a new thread into `threads` table and return the generated thread_id.
     *
     * @param categoryId category id (required)
     * @param userId     user id (required)
     * @param title      thread title (required, non-blank)
     * @param content    thread content (required)
     * @return the generated thread_id or -1 on failure
     */
    public long newThread(long categoryId, long userId, String title, String content) {

        if (categoryId <= 0) throw new IllegalArgumentException("categoryId is required");
        if (userId <= 0) throw new IllegalArgumentException("userId is required");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title is required");
        if (content == null) throw new IllegalArgumentException("content is required");

        // validate category and user exist to avoid FK violations
        if (!categoryExists(categoryId)) {
            System.err.println("Category not found: " + categoryId);
            return -1;
        }
        if (!userExists(userId)) {
            System.err.println("User not found: " + userId);
            return -1;
        }

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


    /**
     * Read all threads from the `threads` table and return as a list of ThreadRow objects.
     */
    public List<ThreadRow> getAllThreads() {
        String sql = "SELECT thread_id, category_id, user_id, title, content, created_at, updated_at FROM threads ORDER BY created_at DESC";
        List<ThreadRow> list = new ArrayList<>();
        try (Connection conn = DriverManager.getConnection(url, username, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                long threadId = rs.getLong("thread_id");
                long categoryId = rs.getLong("category_id");
                long userId = rs.getLong("user_id");
                String title = rs.getString("title");
                String content = rs.getString("content");
                Timestamp cts = rs.getTimestamp("created_at");
                Timestamp uts = rs.getTimestamp("updated_at");
                LocalDateTime createdAt = cts != null ? cts.toLocalDateTime() : null;
                LocalDateTime updatedAt = uts != null ? uts.toLocalDateTime() : null;

                ThreadRow row = new ThreadRow(threadId, categoryId, userId, title, content, createdAt, updatedAt);
                list.add(row);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Retrieve a single thread by id.
     */
    public ThreadRow getThreadById(long threadId) {
        if (threadId <= 0) return null;
        String sql = "SELECT thread_id, category_id, user_id, title, content, created_at, updated_at FROM threads WHERE thread_id = ? LIMIT 1";
        try (Connection conn = DriverManager.getConnection(url, username, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, threadId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    long id = rs.getLong("thread_id");
                    long categoryId = rs.getLong("category_id");
                    long userId = rs.getLong("user_id");
                    String title = rs.getString("title");
                    String content = rs.getString("content");
                    Timestamp cts = rs.getTimestamp("created_at");
                    Timestamp uts = rs.getTimestamp("updated_at");
                    LocalDateTime createdAt = cts != null ? cts.toLocalDateTime() : null;
                    LocalDateTime updatedAt = uts != null ? uts.toLocalDateTime() : null;
                    return new ThreadRow(id, categoryId, userId, title, content, createdAt, updatedAt);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Simple POJO to hold a thread row returned by getAllThreads().
     */
    public static class ThreadRow {
        private final long threadId;
        private final long categoryId;
        private final long userId;
        private final String title;
        private final String content;
        private final LocalDateTime createdAt;
        private final LocalDateTime updatedAt;

        public ThreadRow(long threadId, long categoryId, long userId, String title, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
            this.threadId = threadId;
            this.categoryId = categoryId;
            this.userId = userId;
            this.title = title;
            this.content = content;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }

        public long getThreadId() { return threadId; }
        public long getCategoryId() { return categoryId; }
        public long getUserId() { return userId; }
        public String getTitle() { return title; }
        public String getContent() { return content; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }

        @Override
        public String toString() {
            return "ThreadRow{" +
                    "threadId=" + threadId +
                    ", categoryId=" + categoryId +
                    ", userId=" + userId +
                    ", title='" + title + '\'' +
                    ", createdAt=" + createdAt +
                    ", updatedAt=" + updatedAt +
                    '}';
        }
    }

    // add a small main() to demonstrate getAllThreads()
    public static void main(String[] args) {
        ThreadConnect tc = new ThreadConnect();
        System.out.println("Fetching threads from DB...");
        List<ThreadRow> threads = tc.getAllThreads();
        System.out.println("Found " + threads.size() + " threads:");
        for (ThreadRow r : threads) {
            System.out.println(r);
        }
    }

}
