package model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uq_users_username", columnNames = {"username"}),
        @UniqueConstraint(name = "uq_users_email", columnNames = {"email"})
})

public enum Role {
    USER,
    ADMIN
}
