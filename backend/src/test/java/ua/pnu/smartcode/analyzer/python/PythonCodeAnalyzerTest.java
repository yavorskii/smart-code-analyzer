package ua.pnu.smartcode.analyzer.python;

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

class PythonCodeAnalyzerTest {

    private PythonCodeAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new PythonCodeAnalyzer();
    }

    @Test
    void shouldSupportPythonLanguage() {
        assertTrue(analyzer.supports(ProgrammingLanguage.PYTHON));
        assertFalse(analyzer.supports(ProgrammingLanguage.JAVA));
    }

    @Test
    void shouldDetectCircularImportsBetweenPythonModules() {
        String moduleA = """
                from payment_service import PaymentService

                class OrderService:
                    def __init__(self):
                        self.payment = PaymentService()
                """;

        String moduleB = """
                from order_service import OrderService

                class PaymentService:
                    def notify(self):
                        OrderService().complete()
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.PYTHON,
                AnalysisFocus.ARCHITECTURE,
                List.of(
                        new CodeFileDto("order_service.py", moduleA),
                        new CodeFileDto("payment_service.py", moduleB)
                )
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertNotNull(response);
        assertEquals(ProgrammingLanguage.PYTHON, response.language());
        assertTrue(response.architectureInsights().stream()
                .anyMatch(i -> "CIRCULAR_IMPORT".equals(i.relationshipType())));
        assertTrue(response.issues().stream()
                .anyMatch(i -> i.severity() == IssueSeverity.CRITICAL && i.category() == IssueCategory.ARCHITECTURE));
    }

    @Test
    void shouldDetectMutableDefaultArgumentAndPrintStatements() {
        String code = """
                def process_items(items=[]):
                    print("Processing items...")
                    return len(items)
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.PYTHON,
                AnalysisFocus.CLEAN_CODE,
                List.of(new CodeFileDto("processor.py", code))
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertTrue(response.issues().stream()
                .anyMatch(i -> "Mutable Default Argument".equals(i.title()) && i.severity() == IssueSeverity.CRITICAL));
        assertTrue(response.issues().stream()
                .anyMatch(i -> "Direct Standard Output Print".equals(i.title())));

        assertFalse(response.refactoredFiles().isEmpty());
        assertTrue(response.refactoredFiles().get(0).refactoredContent().contains("logger.info"));
    }

    @Test
    void shouldGeneratePytestTestCases() {
        String code = """
                class OrderService:
                    def calculate_total(self, price, quantity):
                        return price * quantity
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.PYTHON,
                AnalysisFocus.CLEAN_CODE,
                List.of(new CodeFileDto("order_service.py", code))
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertFalse(response.generatedTests().isEmpty());
        assertEquals("pytest", response.generatedTests().get(0).framework());
        assertTrue(response.generatedTests().get(0).testCode().contains("import pytest"));
    }
}
