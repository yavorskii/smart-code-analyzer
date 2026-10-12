package ua.pnu.smartcode.analyzer.java;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.IssueCategory;
import ua.pnu.smartcode.model.IssueSeverity;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaCodeAnalyzerTest {

    private JavaCodeAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new JavaCodeAnalyzer();
    }

    @Test
    void shouldSupportJavaLanguage() {
        assertTrue(analyzer.supports(ProgrammingLanguage.JAVA));
        assertFalse(analyzer.supports(ProgrammingLanguage.PYTHON));
    }

    @Test
    void shouldDetectCircularDependencyBetweenTwoClasses() {
        String orderServiceCode = """
                package ua.pnu.demo;

                public class OrderService {
                    private PaymentService paymentService;

                    public void processOrder() {
                        paymentService.pay();
                    }
                }
                """;

        String paymentServiceCode = """
                package ua.pnu.demo;

                public class PaymentService {
                    private OrderService orderService;

                    public void pay() {
                        orderService.processOrder();
                    }
                }
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.JAVA,
                AnalysisFocus.ARCHITECTURE,
                List.of(
                        new CodeFileDto("OrderService.java", orderServiceCode),
                        new CodeFileDto("PaymentService.java", paymentServiceCode)
                )
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertNotNull(response);
        assertEquals(ProgrammingLanguage.JAVA, response.language());
        assertFalse(response.architectureInsights().isEmpty());
        assertTrue(response.architectureInsights().stream()
                .anyMatch(insight -> "CIRCULAR_DEPENDENCY".equals(insight.relationshipType())));

        assertTrue(response.issues().stream()
                .anyMatch(issue -> issue.category() == IssueCategory.ARCHITECTURE && issue.severity() == IssueSeverity.CRITICAL));
    }

    @Test
    void shouldDetectTightCouplingViaNewOperator() {
        String clientServiceCode = """
                package ua.pnu.demo;

                public class OrderService {
                    public void create() {
                        PaymentService paymentService = new PaymentService();
                    }
                }
                """;

        String targetServiceCode = """
                package ua.pnu.demo;

                public class PaymentService {
                }
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.JAVA,
                AnalysisFocus.CLEAN_CODE,
                List.of(
                        new CodeFileDto("OrderService.java", clientServiceCode),
                        new CodeFileDto("PaymentService.java", targetServiceCode)
                )
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertTrue(response.architectureInsights().stream()
                .anyMatch(insight -> "TIGHT_COUPLING".equals(insight.relationshipType())));
        assertFalse(response.refactoredFiles().isEmpty());
    }

    @Test
    void shouldDetectSystemOutAndGenericCatchIssues() {
        String code = """
                package ua.pnu.demo;

                public class LegacyManager {
                    public void execute() {
                        try {
                            System.out.println("Processing");
                        } catch (Exception e) {
                            // ignore
                        }
                    }
                }
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.JAVA,
                AnalysisFocus.CLEAN_CODE,
                List.of(new CodeFileDto("LegacyManager.java", code))
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertTrue(response.issues().stream().anyMatch(i -> i.title().contains("Standard Output")));
        assertTrue(response.issues().stream().anyMatch(i -> i.title().contains("Generic Exception")));
        assertFalse(response.generatedTests().isEmpty());
    }
}
