package ua.pnu.smartcode.service;

import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;

public interface AnalysisService {

    AnalysisResponseDto analyzeCode(AnalysisRequestDto request);
}
