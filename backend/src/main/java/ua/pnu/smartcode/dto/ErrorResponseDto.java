package ua.pnu.smartcode.dto;

import java.time.Instant;
import java.util.List;

public record ErrorResponseDto(
        int status,
        String error,
        String message,
        List<String> details,
        Instant timestamp
) {
    public ErrorResponseDto(int status, String error, String message, List<String> details) {
        this(status, error, message, details != null ? List.copyOf(details) : List.of(), Instant.now());
    }

    public ErrorResponseDto(int status, String error, String message) {
        this(status, error, message, List.of(), Instant.now());
    }
}
