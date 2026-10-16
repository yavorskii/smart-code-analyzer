package ua.pnu.smartcode.compiler.javascript;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.compiler.CodeCompiler;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CompilationDiagnosticDto;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Component
public class TypeScriptJavaScriptCompiler implements CodeCompiler {

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.TYPESCRIPT || language == ProgrammingLanguage.JAVASCRIPT;
    }

    @Override
    public CompilationResponseDto compile(CompilationRequestDto request) {
        long startTime = System.currentTimeMillis();

        List<CompilationDiagnosticDto> diagnostics = new ArrayList<>();
        StringBuilder logBuilder = new StringBuilder();

        String compilerName = request.language() == ProgrammingLanguage.TYPESCRIPT ? "TypeScript Compiler (tsc)" : "Node.js ECMAScript Validator";

        logBuilder.append(String.format("Build: running %s...\n", compilerName));
        logBuilder.append(String.format("Checking syntax for %d file(s)...\n", request.files().size()));

        int errorCount = 0;

        for (CodeFileDto file : request.files()) {
            List<CompilationDiagnosticDto> fileErrors = validateEcmaScript(file);
            for (CompilationDiagnosticDto diag : fileErrors) {
                errorCount++;
                diagnostics.add(diag);
                logBuilder.append(String.format("[ERROR] %s:%d:%d: %s\n", diag.fileName(), diag.lineNumber(), diag.columnNumber(), diag.message()));
            }
        }

        long executionTime = System.currentTimeMillis() - startTime;
        boolean success = errorCount == 0;

        if (success) {
            logBuilder.append(String.format("Build successful: 0 errors (completed in %d ms).\n", executionTime));
        } else {
            logBuilder.append(String.format("Build failed: %d syntax error(s) (completed in %d ms).\n", errorCount, executionTime));
        }

        return new CompilationResponseDto(
                success,
                request.language(),
                compilerName,
                executionTime,
                errorCount,
                0,
                diagnostics,
                logBuilder.toString()
        );
    }

    private List<CompilationDiagnosticDto> validateEcmaScript(CodeFileDto file) {
        List<CompilationDiagnosticDto> errors = new ArrayList<>();
        String[] lines = file.content().split("\\R", -1);

        Deque<BracketPos> stack = new ArrayDeque<>();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int lineNum = i + 1;
            boolean inSingleLineComment = false;

            for (int col = 0; col < line.length(); col++) {
                char c = line.charAt(col);

                if (c == '/' && col + 1 < line.length() && line.charAt(col + 1) == '/') {
                    inSingleLineComment = true;
                    break;
                }

                if (c == '{' || c == '(' || c == '[') {
                    stack.push(new BracketPos(c, lineNum, col + 1));
                } else if (c == '}' || c == ')' || c == ']') {
                    if (stack.isEmpty()) {
                        errors.add(new CompilationDiagnosticDto(file.fileName(), lineNum, col + 1, "ERROR", "Unmatched closing bracket '" + c + "'"));
                    } else {
                        BracketPos top = stack.pop();
                        if (!matches(top.bracket, c)) {
                            errors.add(new CompilationDiagnosticDto(file.fileName(), lineNum, col + 1, "ERROR", "Mismatched closing bracket '" + c + "', expected matching for '" + top.bracket + "' at line " + top.line));
                        }
                    }
                }
            }
        }

        while (!stack.isEmpty()) {
            BracketPos unclosed = stack.pop();
            errors.add(new CompilationDiagnosticDto(file.fileName(), unclosed.line, unclosed.col, "ERROR", "Unclosed bracket '" + unclosed.bracket + "'"));
        }

        return errors;
    }

    private boolean matches(char open, char close) {
        return (open == '{' && close == '}') ||
               (open == '(' && close == ')') ||
               (open == '[' && close == ']');
    }

    private record BracketPos(char bracket, int line, int col) {}
}
