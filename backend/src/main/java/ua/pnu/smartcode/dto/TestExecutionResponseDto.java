package ua.pnu.smartcode.dto;

import ua.pnu.smartcode.model.ProgrammingLanguage;

public record TestExecutionResponseDto(
        boolean success,
        ProgrammingLanguage language,
        int totalCount,
        int passedCount,
        int failedCount,
        int skippedCount,
        long executionTimeMs,
        String framework,
        String stdout,
        String stderr,
        String outputLog
) {
}
