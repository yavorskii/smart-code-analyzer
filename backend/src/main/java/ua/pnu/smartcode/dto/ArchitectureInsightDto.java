package ua.pnu.smartcode.dto;

public record ArchitectureInsightDto(
        String relationshipType,
        String sourceFile,
        String targetFile,
        String description,
        String suggestion
) {
}
