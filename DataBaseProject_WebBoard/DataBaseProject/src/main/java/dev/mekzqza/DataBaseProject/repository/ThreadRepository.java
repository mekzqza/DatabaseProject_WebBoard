package dev.mekzqza.DataBaseProject.repository;

import dev.mekzqza.DataBaseProject.model.ThreadEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ThreadRepository extends JpaRepository<ThreadEntity, Long> {
    List<ThreadEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}