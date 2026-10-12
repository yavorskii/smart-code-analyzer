package ua.pnu.smartcode.analyzer;

import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

public interface LanguageAnalyzer {

    boolean supports(ProgrammingLanguage language);

    AnalysisResponseDto analyze(AnalysisRequestDto request);
}
