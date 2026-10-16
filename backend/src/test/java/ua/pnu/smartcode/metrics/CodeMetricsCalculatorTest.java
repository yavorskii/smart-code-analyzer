package ua.pnu.smartcode.metrics;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CodeMetricsSummaryDto;
import ua.pnu.smartcode.dto.FileMetricsDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CodeMetricsCalculatorTest {

    private CodeMetricsCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new CodeMetricsCalculator();
    }

    @Test
    void shouldCalculateAccurateJavaMetrics() {
        String javaCode = """
                package ua.pnu.demo;

                // Service to process orders
                public class OrderService {
                    /* Process an incoming order */
                    public void process(int amount) {
                        if (amount > 0 && amount < 1000) {
                            for (int i = 0; i < 5; i++) {
                                System.out.println(i);
                            }
                        } else {
                            throw new IllegalArgumentException();
                        }
                    }
                }
                """;

        FileMetricsDto metrics = calculator.calculateFileMetrics(
                new CodeFileDto("OrderService.java", javaCode),
                ProgrammingLanguage.JAVA
        );

        assertNotNull(metrics);
        assertEquals("OrderService.java", metrics.fileName());
        assertTrue(metrics.totalLines() > 10);
        assertTrue(metrics.sourceLines() > 5);
        assertTrue(metrics.commentLines() >= 2);
        assertTrue(metrics.commentRatio() > 0.0);
        // CC: 1 base + if (1) + && (1) + for (1) = 4
        assertTrue(metrics.cyclomaticComplexity() >= 3);
        assertTrue(metrics.cognitiveComplexity() >= 2);
        assertTrue(metrics.maintainabilityIndex() >= 50 && metrics.maintainabilityIndex() <= 100);
        assertEquals("LOW", metrics.complexityRating());
        assertTrue(List.of("A", "B", "C").contains(metrics.maintainabilityRating()));
    }

    @Test
    void shouldCalculateAccuratePythonMetrics() {
        String pythonCode = """
                # Order processor module
                def calculate(items, discount=False):
                    \"\"\"Docstring explaining logic\"\"\"
                    total = 0
                    if items and len(items) > 0:
                        for item in items:
                            total += item.price
                    return total
                """;

        FileMetricsDto metrics = calculator.calculateFileMetrics(
                new CodeFileDto("processor.py", pythonCode),
                ProgrammingLanguage.PYTHON
        );

        assertNotNull(metrics);
        assertEquals("processor.py", metrics.fileName());
        assertTrue(metrics.totalLines() > 5);
        assertTrue(metrics.commentLines() >= 2);
        assertTrue(metrics.cyclomaticComplexity() >= 3); // base 1 + if + and + for
        assertTrue(metrics.maintainabilityIndex() >= 60);
    }

    @Test
    void shouldAggregateProjectMetricsSummary() {
        List<CodeFileDto> files = List.of(
                new CodeFileDto("ServiceA.java", "public class ServiceA { void a() { if (true) {} } }"),
                new CodeFileDto("ServiceB.java", "public class ServiceB { void b() {} }")
        );

        CodeMetricsSummaryDto summary = calculator.calculateMetrics(files, ProgrammingLanguage.JAVA);

        assertNotNull(summary);
        assertEquals(2, summary.files().size());
        assertTrue(summary.totalLines() >= 2);
        assertTrue(summary.maxCyclomaticComplexity() >= 2);
        assertTrue(summary.overallMaintainabilityIndex() > 0);
        assertNotNull(summary.maintainabilityRating());
    }

    @Test
    void shouldHandleEmptyFileList() {
        CodeMetricsSummaryDto summary = calculator.calculateMetrics(List.of(), ProgrammingLanguage.JAVA);

        assertNotNull(summary);
        assertEquals(0, summary.totalLines());
        assertEquals(0, summary.files().size());
        assertEquals(100, summary.overallMaintainabilityIndex());
        assertEquals("A", summary.maintainabilityRating());
    }
}
