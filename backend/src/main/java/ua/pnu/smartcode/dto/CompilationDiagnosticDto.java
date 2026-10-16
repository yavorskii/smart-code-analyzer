package ua.pnu.smartcode.dto;

public record CompilationDiagnosticDto(
        String fileName,
        long lineNumber,
        long columnNumber,
        String severity,
        String message
) {
}
