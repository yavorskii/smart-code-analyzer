package ua.pnu.smartcode.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

public record AnalysisRequestDto(
        @NotNull(message = "Programming language is required")
        ProgrammingLanguage language,

        AnalysisFocus focus,

        @NotEmpty(message = "At least one code file is required")
        List<@Valid CodeFileDto> files
) {
    public AnalysisRequestDto {
        if (focus == null) {
            focus = AnalysisFocus.CLEAN_CODE;
        }
        if (files == null) {
            files = List.of();
        } else {
            files = List.copyOf(files);
        }
    }
}
