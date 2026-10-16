package ua.pnu.smartcode.tester.javascript;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaScriptTypeScriptTestRunnerTest {

    private JavaScriptTypeScriptTestRunner runner;

    @BeforeEach
    void setUp() {
        runner = new JavaScriptTypeScriptTestRunner();
    }

    @Test
    void shouldSupportJavaScriptAndTypeScript() {
        assertTrue(runner.supports(ProgrammingLanguage.JAVASCRIPT));
        assertTrue(runner.supports(ProgrammingLanguage.TYPESCRIPT));
        assertFalse(runner.supports(ProgrammingLanguage.JAVA));
    }

    @Test
    void shouldExecuteNodeTest() {
        String serviceCode = "function sum(a, b) { return a + b; }\nmodule.exports = { sum };";
        String testCode = """
                const { test } = require('node:test');
                const assert = require('node:assert');
                const { sum } = require('./service');

                test('sum adds two numbers', () => {
                    assert.strictEqual(sum(10, 20), 30);
                });
                """;

        TestExecutionRequestDto request = new TestExecutionRequestDto(
                ProgrammingLanguage.JAVASCRIPT,
                List.of(new CodeFileDto("service.js", serviceCode)),
                List.of(new GeneratedTestDto("service.test.js", "service.js", testCode, "node --test")),
                null
        );

        TestExecutionResponseDto response = runner.runTests(request);

        assertNotNull(response);
        assertTrue(response.success());
        assertEquals(0, response.failedCount());
        assertTrue(response.passedCount() >= 1);
    }
}
