package ua.pnu.smartcode.dto;

public record FileMetricsDto(
        String fileName,
        int totalLines,
        int sourceLines,
        int commentLines,
        double commentRatio,
        int cyclomaticComplexity,
        int cognitiveComplexity,
        int maintainabilityIndex,
        String complexityRating,
        String maintainabilityRating
) {
}
