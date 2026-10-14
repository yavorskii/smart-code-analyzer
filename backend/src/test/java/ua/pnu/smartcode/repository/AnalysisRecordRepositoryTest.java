package ua.pnu.smartcode.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import ua.pnu.smartcode.entity.AnalysisRecordEntity;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class AnalysisRecordRepositoryTest {

    @Autowired
    private AnalysisRecordRepository repository;

    @Test
    void shouldSaveAndRetrieveAnalysisRecord() {
        UUID id = UUID.randomUUID();
        AnalysisRecordEntity entity = AnalysisRecordEntity.builder()
                .id(id)
                .language(ProgrammingLanguage.JAVA)
                .focus(AnalysisFocus.ARCHITECTURE)
                .qualityScore(85)
                .summary("Test analysis record")
                .filesCount(2)
                .issuesCount(1)
                .criticalCount(0)
                .warningCount(1)
                .infoCount(0)
                .insightsCount(1)
                .fullReportJson("{\"id\":\"" + id + "\"}")
                .createdAt(Instant.now())
                .build();

        repository.save(entity);

        List<AnalysisRecordEntity> records = repository.findAllByOrderByCreatedAtDesc();
        assertFalse(records.isEmpty());
        assertEquals(id, records.get(0).getId());
        assertEquals(85, records.get(0).getQualityScore());
    }
}
