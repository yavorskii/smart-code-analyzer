package ua.pnu.smartcode.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analysis_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisRecordEntity {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProgrammingLanguage language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AnalysisFocus focus;

    @Column(name = "quality_score", nullable = false)
    private int qualityScore;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "files_count", nullable = false)
    private int filesCount;

    @Column(name = "issues_count", nullable = false)
    private int issuesCount;

    @Column(name = "critical_count", nullable = false)
    private int criticalCount;

    @Column(name = "warning_count", nullable = false)
    private int warningCount;

    @Column(name = "info_count", nullable = false)
    private int infoCount;

    @Column(name = "insights_count", nullable = false)
    private int insightsCount;

    @Column(name = "full_report_json", columnDefinition = "TEXT", nullable = false)
    private String fullReportJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
