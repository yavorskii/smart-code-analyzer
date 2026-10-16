package ua.pnu.smartcode.tester.python;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PythonTestRunnerTest {

    private PythonTestRunner runner;

    @BeforeEach
    void setUp() {
        runner = new PythonTestRunner();
    }

    @Test
    void shouldSupportPython() {
        assertTrue(runner.supports(ProgrammingLanguage.PYTHON));
        assertFalse(runner.supports(ProgrammingLanguage.JAVA));
    }

    @Test
    void shouldExecutePythonPytest() {
        String serviceCode = """
                def multiply(a, b):
                    return a * b
                """;

        String testCode = """
                import pytest
                from service import multiply

                def test_multiply():
                    assert multiply(3, 4) == 12
                """;

        TestExecutionRequestDto request = new TestExecutionRequestDto(
                ProgrammingLanguage.PYTHON,
                List.of(new CodeFileDto("service.py", serviceCode)),
                List.of(new GeneratedTestDto("test_service.py", "service.py", testCode, "pytest")),
                null
        );

        TestExecutionResponseDto response = runner.runTests(request);

        assertNotNull(response);
        assertTrue(response.success(), "Pytest execution should succeed");
        assertEquals(0, response.failedCount());
        assertEquals(1, response.passedCount());
    }
}
