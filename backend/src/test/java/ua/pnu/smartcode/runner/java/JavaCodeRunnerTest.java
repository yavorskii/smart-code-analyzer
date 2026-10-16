package ua.pnu.smartcode.runner.java;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaCodeRunnerTest {

    private JavaCodeRunner runner;

    @BeforeEach
    void setUp() {
        runner = new JavaCodeRunner();
    }

    @Test
    void shouldSupportJava() {
        assertTrue(runner.supports(ProgrammingLanguage.JAVA));
        assertFalse(runner.supports(ProgrammingLanguage.PYTHON));
    }

    @Test
    void shouldRunValidJavaMainMethodSuccessfully() {
        String code = """
                package ua.pnu.shop.service;

                public class OrderService {
                    public static void main(String[] args) {
                        System.out.println("Hello World from Test!");
                    }
                }
                """;

        ExecutionRequestDto request = new ExecutionRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("OrderService.java", code)),
                "OrderService.java",
                null
        );

        ExecutionResponseDto response = runner.run(request);

        assertNotNull(response);
        assertTrue(response.success(), "Execution should succeed");
        assertEquals(0, response.exitCode());
        assertTrue(response.stdout().contains("Hello World from Test!"));
        assertFalse(response.timedOut());
    }

    @Test
    void shouldFailWhenMainMethodMissing() {
        String code = """
                package ua.pnu.shop.service;

                public class OrderService {
                    public void helper() {
                        System.out.println("No main here");
                    }
                }
                """;

        ExecutionRequestDto request = new ExecutionRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("OrderService.java", code)),
                null,
                null
        );

        ExecutionResponseDto response = runner.run(request);

        assertNotNull(response);
        assertFalse(response.success());
        assertTrue(response.stderr().contains("Main method not found"));
    }

    @Test
    void shouldHandleSyntaxErrorsGracefully() {
        String brokenCode = """
                public class Broken {
                    public static void main(String[] args) {
                        int x = "incompatible types"
                    }
                }
                """;

        ExecutionRequestDto request = new ExecutionRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("Broken.java", brokenCode)),
                null,
                null
        );

        ExecutionResponseDto response = runner.run(request);

        assertNotNull(response);
        assertFalse(response.success());
        assertNotEquals(0, response.exitCode());
    }
}
