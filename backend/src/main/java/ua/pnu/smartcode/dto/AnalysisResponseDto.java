package ua.pnu.smartcode.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AnalysisResponseDto(
        String id,
        ProgrammingLanguage language,
        String summary,
        int qualityScore,
        List<CodeIssueDto> issues,
        List<ArchitectureInsightDto> architectureInsights,
        List<RefactoredFileDto> refactoredFiles,
        List<GeneratedTestDto> generatedTests,
        CodeMetricsSummaryDto metrics
) {
    public AnalysisResponseDto {
        issues = issues == null ? List.of() : List.copyOf(issues);
        architectureInsights = architectureInsights == null ? List.of() : List.copyOf(architectureInsights);
        refactoredFiles = refactoredFiles == null ? List.of() : List.copyOf(refactoredFiles);
        generatedTests = generatedTests == null ? List.of() : List.copyOf(generatedTests);
    }

    public AnalysisResponseDto(
            String id,
            ProgrammingLanguage language,
            String summary,
            int qualityScore,
            List<CodeIssueDto> issues,
            List<ArchitectureInsightDto> architectureInsights,
            List<RefactoredFileDto> refactoredFiles,
            List<GeneratedTestDto> generatedTests
    ) {
        this(id, language, summary, qualityScore, issues, architectureInsights, refactoredFiles, generatedTests, null);
    }
}
