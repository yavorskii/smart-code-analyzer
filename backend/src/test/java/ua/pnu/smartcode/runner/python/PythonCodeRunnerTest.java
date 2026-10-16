package ua.pnu.smartcode.runner.python;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PythonCodeRunnerTest {

    private PythonCodeRunner runner;

    @BeforeEach
    void setUp() {
        runner = new PythonCodeRunner();
    }

    @Test
    void shouldSupportPython() {
        assertTrue(runner.supports(ProgrammingLanguage.PYTHON));
        assertFalse(runner.supports(ProgrammingLanguage.JAVA));
    }

    @Test
    void shouldRunPythonScriptSuccessfully() {
        String code = "print('Hello from Python runner test!')";

        ExecutionRequestDto request = new ExecutionRequestDto(
                ProgrammingLanguage.PYTHON,
                List.of(new CodeFileDto("main.py", code)),
                "main.py",
                null
        );

        ExecutionResponseDto response = runner.run(request);

        assertNotNull(response);
        assertTrue(response.success());
        assertEquals(0, response.exitCode());
        assertTrue(response.stdout().contains("Hello from Python runner test!"));
    }
}
