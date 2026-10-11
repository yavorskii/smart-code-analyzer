package ua.pnu.smartcode.dto;

import ua.pnu.smartcode.model.IssueCategory;
import ua.pnu.smartcode.model.IssueSeverity;

public record CodeIssueDto(
        String id,
        String fileName,
        Integer line,
        IssueSeverity severity,
        IssueCategory category,
        String title,
        String description,
        String recommendation
) {
}
