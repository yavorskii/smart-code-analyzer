package ua.pnu.smartcode.service;

import ua.pnu.smartcode.dto.AnalysisHistoryItemDto;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;

import java.util.List;
import java.util.UUID;

public interface AnalysisService {

    AnalysisResponseDto analyzeCode(AnalysisRequestDto request);

    List<AnalysisHistoryItemDto> getHistory();

    AnalysisResponseDto getById(UUID id);

    void deleteById(UUID id);
}
