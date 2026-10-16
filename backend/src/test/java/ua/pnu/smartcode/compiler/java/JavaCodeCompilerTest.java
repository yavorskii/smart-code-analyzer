package ua.pnu.smartcode.compiler.java;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaCodeCompilerTest {

    private JavaCodeCompiler compiler;

    @BeforeEach
    void setUp() {
        compiler = new JavaCodeCompiler();
    }

    @Test
    void shouldSupportJava() {
        assertTrue(compiler.supports(ProgrammingLanguage.JAVA));
        assertFalse(compiler.supports(ProgrammingLanguage.PYTHON));
    }

    @Test
    void shouldCompileValidJavaCodeSuccessfully() {
        String code = """
                package ua.pnu.demo;

                public class Calculator {
                    public int add(int a, int b) {
                        return a + b;
                    }
                }
                """;

        CompilationRequestDto request = new CompilationRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("Calculator.java", code))
        );

        CompilationResponseDto response = compiler.compile(request);

        assertNotNull(response);
        assertTrue(response.success(), "Compilation of valid Java code should succeed");
        assertEquals(0, response.errorCount());
        assertTrue(response.diagnostics().isEmpty());
        assertTrue(response.outputLog().contains("Build successful"));
    }

    @Test
    void shouldCaptureSyntaxErrorsWithLineAndColumn() {
        String invalidCode = """
                package ua.pnu.demo;

                public class BrokenClass {
                    public void brokenMethod() {
                        int x = 10 // missing semicolon
                        return x;
                    }
                }
                """;

        CompilationRequestDto request = new CompilationRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("BrokenClass.java", invalidCode))
        );

        CompilationResponseDto response = compiler.compile(request);

        assertNotNull(response);
        assertFalse(response.success(), "Invalid code must not compile");
        assertTrue(response.errorCount() > 0);
        assertFalse(response.diagnostics().isEmpty());
        assertTrue(response.diagnostics().get(0).lineNumber() > 0);
        assertTrue(response.outputLog().contains("Build failed"));
    }
}
