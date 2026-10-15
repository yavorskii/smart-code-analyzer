package ua.pnu.smartcode.analyzer.javascript;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaScriptCodeAnalyzerTest {

    private JavaScriptCodeAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new JavaScriptCodeAnalyzer();
    }

    @Test
    void shouldSupportJavaScriptLanguage() {
        assertTrue(analyzer.supports(ProgrammingLanguage.JAVASCRIPT));
        assertFalse(analyzer.supports(ProgrammingLanguage.PYTHON));
    }

    @Test
    void shouldDetectVarAndJestFramework() {
        String code = """
                class CalculatorService {
                    calculate() {
                        var total = 10;
                        return total;
                    }
                }
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.JAVASCRIPT,
                AnalysisFocus.CLEAN_CODE,
                List.of(new CodeFileDto("CalculatorService.js", code))
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertNotNull(response);
        assertEquals(ProgrammingLanguage.JAVASCRIPT, response.language());
        assertFalse(response.issues().isEmpty());
        assertFalse(response.generatedTests().isEmpty());
        assertEquals("Jest", response.generatedTests().get(0).framework());
    }
}
