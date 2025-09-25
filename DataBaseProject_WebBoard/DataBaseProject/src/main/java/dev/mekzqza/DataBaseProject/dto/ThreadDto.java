package dev.mekzqza.DataBaseProject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ThreadDto {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "categoryId is required")
    private Long categoryId;

    @NotBlank(message = "Content is required")
    private String content;

    private String author;

    public ThreadDto() {}

    public ThreadDto(String title, Long categoryId, String content, String author) {
        this.title = title;
        this.categoryId = categoryId;
        this.content = content;
        this.author = author;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
}