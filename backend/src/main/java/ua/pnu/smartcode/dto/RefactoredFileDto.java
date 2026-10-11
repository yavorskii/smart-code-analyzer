package ua.pnu.smartcode.dto;

import java.util.List;

public record RefactoredFileDto(
        String fileName,
        String refactoredContent,
        List<String> changesSummary
) {
    public RefactoredFileDto {
        changesSummary = changesSummary == null ? List.of() : List.copyOf(changesSummary);
    }
}
