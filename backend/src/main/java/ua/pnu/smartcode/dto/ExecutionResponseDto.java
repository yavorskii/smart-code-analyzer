package ua.pnu.smartcode.dto;

import ua.pnu.smartcode.model.ProgrammingLanguage;

public record ExecutionResponseDto(
        boolean success,
        ProgrammingLanguage language,
        int exitCode,
        String stdout,
        String stderr,
        long executionTimeMs,
        String commandExecuted,
        boolean timedOut
) {
}
