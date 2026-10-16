package ua.pnu.smartcode.tester.java;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaTestRunnerTest {

    private JavaTestRunner runner;

    @BeforeEach
    void setUp() {
        runner = new JavaTestRunner();
    }

    @Test
    void shouldSupportJava() {
        assertTrue(runner.supports(ProgrammingLanguage.JAVA));
        assertFalse(runner.supports(ProgrammingLanguage.PYTHON));
    }

    @Test
    void shouldExecuteValidJUnit5Test() {
        String serviceCode = """
                package ua.pnu.shop;

                public class Calculator {
                    public int add(int a, int b) {
                        return a + b;
                    }
                }
                """;

        String testCode = """
                package ua.pnu.shop;

                import org.junit.jupiter.api.Test;
                import static org.junit.jupiter.api.Assertions.*;

                class CalculatorTest {
                    @Test
                    void shouldAddNumbers() {
                        Calculator calc = new Calculator();
                        assertEquals(5, calc.add(2, 3));
                    }
                }
                """;

        TestExecutionRequestDto request = new TestExecutionRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("Calculator.java", serviceCode)),
                List.of(new GeneratedTestDto("CalculatorTest.java", "Calculator.java", testCode, "JUnit 5")),
                null
        );

        TestExecutionResponseDto response = runner.runTests(request);

        assertNotNull(response);
        assertTrue(response.success(), "JUnit 5 execution should succeed");
        assertEquals(0, response.failedCount());
        assertTrue(response.passedCount() >= 1);
        assertTrue(response.stdout().contains("JUnit Jupiter") || response.stdout().contains("successful"));
    }
}
