package Services;

import java.security.SecureRandom;
import java.security.spec.KeySpec;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.util.Base64;

public final class PasswordHash {
    // PBKDF2 parameters
    private static final int ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256; // bits
    private static final SecureRandom RANDOM = new SecureRandom();

    // สร้าง hash ในรูปแบบ: iterations:saltBase64:hashBase64
    public static String createHash(String password) {
        try {
            byte[] salt = new byte[16];
            RANDOM.nextBytes(salt);
            byte[] hash = pbkdf2(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
            String saltB64 = Base64.getEncoder().encodeToString(salt);
            String hashB64 = Base64.getEncoder().encodeToString(hash);
            return ITERATIONS + ":" + saltB64 + ":" + hashB64;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create password hash", e);
        }
    }

    private static byte[] pbkdf2(char[] password, byte[] salt, int iterations, int keyLength) throws Exception {
        KeySpec spec = new PBEKeySpec(password, salt, iterations, keyLength);
        SecretKeyFactory f = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        return f.generateSecret(spec).getEncoded();
    }

    // ยืนยันรหัสผ่าน โดยรับ plain password และ stored hash (iterations:salt:hash)
    public static boolean verifyPassword(String password, String storedHash) {
        try {
            String[] parts = storedHash.split(":" );
            int iterations = Integer.parseInt(parts[0]);
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] hash = Base64.getDecoder().decode(parts[2]);

            byte[] testHash = pbkdf2(password.toCharArray(), salt, iterations, hash.length * 8);
            return java.security.MessageDigest.isEqual(hash, testHash);
        } catch (Exception e) {
            return false;
        }
    }
}

