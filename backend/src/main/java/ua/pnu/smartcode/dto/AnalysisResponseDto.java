package ua.pnu.smartcode.dto;

import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

public record AnalysisResponseDto(
        String id,
        ProgrammingLanguage language,
        String summary,
        int qualityScore,
        List<CodeIssueDto> issues,
        List<ArchitectureInsightDto> architectureInsights,
        List<RefactoredFileDto> refactoredFiles,
        List<GeneratedTestDto> generatedTests
) {
    public AnalysisResponseDto {
        issues = issues == null ? List.of() : List.copyOf(issues);
        architectureInsights = architectureInsights == null ? List.of() : List.copyOf(architectureInsights);
        refactoredFiles = refactoredFiles == null ? List.of() : List.copyOf(refactoredFiles);
        generatedTests = generatedTests == null ? List.of() : List.copyOf(generatedTests);
    }
}
