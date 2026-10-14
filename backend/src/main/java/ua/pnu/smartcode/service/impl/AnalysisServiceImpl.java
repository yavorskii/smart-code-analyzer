package ua.pnu.smartcode.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.pnu.smartcode.analyzer.LanguageAnalyzer;
import ua.pnu.smartcode.dto.AnalysisHistoryItemDto;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.dto.CodeIssueDto;
import ua.pnu.smartcode.entity.AnalysisRecordEntity;
import ua.pnu.smartcode.exception.RecordNotFoundException;
import ua.pnu.smartcode.exception.UnsupportedLanguageException;
import ua.pnu.smartcode.model.IssueSeverity;
import ua.pnu.smartcode.repository.AnalysisRecordRepository;
import ua.pnu.smartcode.service.AnalysisService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisServiceImpl implements AnalysisService {

    private final List<LanguageAnalyzer> analyzers;
    private final AnalysisRecordRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public AnalysisResponseDto analyzeCode(AnalysisRequestDto request) {
        LanguageAnalyzer matchingAnalyzer = analyzers.stream()
                .filter(analyzer -> analyzer.supports(request.language()))
                .findFirst()
                .orElseThrow(() -> new UnsupportedLanguageException(request.language()));

        AnalysisResponseDto response = matchingAnalyzer.analyze(request);

        saveAnalysisRecord(request, response);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnalysisHistoryItemDto> getHistory() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToHistoryItem)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AnalysisResponseDto getById(UUID id) {
        AnalysisRecordEntity entity = repository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        try {
            return objectMapper.readValue(entity.getFullReportJson(), AnalysisResponseDto.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize analysis report for id {}", id, e);
            throw new IllegalStateException("Failed to parse stored analysis report", e);
        }
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        if (!repository.existsById(id)) {
            throw new RecordNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void saveAnalysisRecord(AnalysisRequestDto request, AnalysisResponseDto response) {
        try {
            UUID recordId = UUID.fromString(response.id());
            String jsonReport = objectMapper.writeValueAsString(response);

            List<CodeIssueDto> issues = response.issues();
            int critical = (int) issues.stream().filter(i -> i.severity() == IssueSeverity.CRITICAL).count();
            int warning = (int) issues.stream().filter(i -> i.severity() == IssueSeverity.WARNING).count();
            int info = (int) issues.stream().filter(i -> i.severity() == IssueSeverity.INFO).count();

            AnalysisRecordEntity entity = AnalysisRecordEntity.builder()
                    .id(recordId)
                    .language(response.language())
                    .focus(request.focus())
                    .qualityScore(response.qualityScore())
                    .summary(response.summary())
                    .filesCount(request.files().size())
                    .issuesCount(issues.size())
                    .criticalCount(critical)
                    .warningCount(warning)
                    .infoCount(info)
                    .insightsCount(response.architectureInsights().size())
                    .fullReportJson(jsonReport)
                    .createdAt(Instant.now())
                    .build();

            repository.save(entity);
        } catch (Exception e) {
            log.error("Failed to persist analysis record", e);
        }
    }

    private AnalysisHistoryItemDto mapToHistoryItem(AnalysisRecordEntity entity) {
        return new AnalysisHistoryItemDto(
                entity.getId(),
                entity.getLanguage(),
                entity.getFocus(),
                entity.getQualityScore(),
                entity.getSummary(),
                entity.getFilesCount(),
                entity.getIssuesCount(),
                entity.getCriticalCount(),
                entity.getWarningCount(),
                entity.getInfoCount(),
                entity.getInsightsCount(),
                entity.getCreatedAt()
        );
    }
}
