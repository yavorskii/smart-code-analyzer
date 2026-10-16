package ua.pnu.smartcode.dto;

import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

public record CompilationResponseDto(
        boolean success,
        ProgrammingLanguage language,
        String compilerName,
        long executionTimeMs,
        int errorCount,
        int warningCount,
        List<CompilationDiagnosticDto> diagnostics,
        String outputLog
) {
    public CompilationResponseDto {
        diagnostics = diagnostics == null ? List.of() : List.copyOf(diagnostics);
    }
}
