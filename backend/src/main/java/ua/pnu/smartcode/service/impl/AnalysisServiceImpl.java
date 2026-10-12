package ua.pnu.smartcode.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ua.pnu.smartcode.analyzer.LanguageAnalyzer;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.exception.UnsupportedLanguageException;
import ua.pnu.smartcode.service.AnalysisService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalysisServiceImpl implements AnalysisService {

    private final List<LanguageAnalyzer> analyzers;

    @Override
    public AnalysisResponseDto analyzeCode(AnalysisRequestDto request) {
        LanguageAnalyzer matchingAnalyzer = analyzers.stream()
                .filter(analyzer -> analyzer.supports(request.language()))
                .findFirst()
                .orElseThrow(() -> new UnsupportedLanguageException(request.language()));

        return matchingAnalyzer.analyze(request);
    }
}
