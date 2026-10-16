package ua.pnu.smartcode.runner.javascript;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaScriptTypeScriptRunnerTest {

    private JavaScriptTypeScriptRunner runner;

    @BeforeEach
    void setUp() {
        runner = new JavaScriptTypeScriptRunner();
    }

    @Test
    void shouldSupportJavaScriptAndTypeScript() {
        assertTrue(runner.supports(ProgrammingLanguage.JAVASCRIPT));
        assertTrue(runner.supports(ProgrammingLanguage.TYPESCRIPT));
        assertFalse(runner.supports(ProgrammingLanguage.JAVA));
    }

    @Test
    void shouldRunJavaScriptSuccessfully() {
        String code = "console.log('Hello from Node test!');";

        ExecutionRequestDto request = new ExecutionRequestDto(
                ProgrammingLanguage.JAVASCRIPT,
                List.of(new CodeFileDto("app.js", code)),
                "app.js",
                null
        );

        ExecutionResponseDto response = runner.run(request);

        assertNotNull(response);
        assertTrue(response.success());
        assertEquals(0, response.exitCode());
        assertTrue(response.stdout().contains("Hello from Node test!"));
    }
}
