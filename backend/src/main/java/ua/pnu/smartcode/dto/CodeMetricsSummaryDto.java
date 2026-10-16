package ua.pnu.smartcode.dto;

import java.util.List;

public record CodeMetricsSummaryDto(
        int totalLines,
        int totalSourceLines,
        int totalCommentLines,
        double averageCommentRatio,
        int averageCyclomaticComplexity,
        int maxCyclomaticComplexity,
        int totalCognitiveComplexity,
        int overallMaintainabilityIndex,
        String maintainabilityRating,
        List<FileMetricsDto> files
) {
    public CodeMetricsSummaryDto {
        files = files == null ? List.of() : List.copyOf(files);
    }
}
