package dev.mekzqza.DataBaseProject.service;

import dev.mekzqza.DataBaseProject.dto.ThreadDto;
import dev.mekzqza.DataBaseProject.model.ThreadEntity;
import dev.mekzqza.DataBaseProject.repository.ThreadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ThreadService {

    private final ThreadRepository threadRepository;

    @Autowired
    public ThreadService(ThreadRepository threadRepository) {
        this.threadRepository = threadRepository;
    }

    public ThreadEntity createThread(ThreadDto dto) {
        ThreadEntity e = new ThreadEntity(dto.getTitle(), dto.getCategoryId(), dto.getContent(), dto.getAuthor());
        return threadRepository.save(e);
    }

    public List<ThreadEntity> getRecentThreads(int limit) {
        return threadRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.max(1, limit)));
    }

}