package ua.pnu.smartcode.dto;

import jakarta.validation.constraints.NotBlank;

public record CodeFileDto(
        @NotBlank(message = "File name is required")
        String fileName,

        @NotBlank(message = "File content cannot be empty")
        String content
) {
}
