package ua.pnu.smartcode.dto;

import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.time.Instant;
import java.util.UUID;

public record AnalysisHistoryItemDto(
        UUID id,
        ProgrammingLanguage language,
        AnalysisFocus focus,
        int qualityScore,
        String summary,
        int filesCount,
        int issuesCount,
        int criticalCount,
        int warningCount,
        int infoCount,
        int insightsCount,
        Instant createdAt
) {
}
