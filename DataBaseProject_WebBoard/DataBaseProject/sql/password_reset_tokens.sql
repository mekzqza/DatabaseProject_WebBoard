-- DDL for password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Example to create users table if not exists (simplified)
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  avatar_url TEXT,
  bio TEXT,
  social_links TEXT,
  role VARCHAR(64),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Sample insert (username: zxcv12, password_hash: password123 - NOTE: hash in production)
INSERT INTO users (user_id, username, email, password_hash, avatar_url, bio, social_links, role, created_at, updated_at)
VALUES ('u1', 'zxcv12', 'me@example.com', 'password123', NULL, 'นี่คือ BIO ของฉัน', NULL, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE username = username; -- no-op if exists

