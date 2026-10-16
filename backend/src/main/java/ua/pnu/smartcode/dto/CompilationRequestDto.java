package ua.pnu.smartcode.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

public record CompilationRequestDto(
        @NotNull(message = "Programming language is required")
        ProgrammingLanguage language,

        @NotEmpty(message = "Files list cannot be empty")
        List<CodeFileDto> files
) {
    public CompilationRequestDto {
        files = files == null ? List.of() : List.copyOf(files);
    }
}
