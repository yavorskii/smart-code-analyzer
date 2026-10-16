package ua.pnu.smartcode.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

public record TestExecutionRequestDto(
        @NotNull(message = "Programming language is required")
        ProgrammingLanguage language,

        @NotEmpty(message = "Files list cannot be empty")
        List<CodeFileDto> files,

        @NotEmpty(message = "Generated tests list cannot be empty")
        List<GeneratedTestDto> tests,

        String testFileName
) {
    public TestExecutionRequestDto {
        files = files == null ? List.of() : List.copyOf(files);
        tests = tests == null ? List.of() : List.copyOf(tests);
    }
}
