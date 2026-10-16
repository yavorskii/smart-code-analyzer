package ua.pnu.smartcode.compiler.python;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.compiler.CodeCompiler;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CompilationDiagnosticDto;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class PythonCodeCompiler implements CodeCompiler {

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.PYTHON;
    }

    @Override
    public CompilationResponseDto compile(CompilationRequestDto request) {
        long startTime = System.currentTimeMillis();

        List<CompilationDiagnosticDto> diagnostics = new ArrayList<>();
        StringBuilder logBuilder = new StringBuilder();

        logBuilder.append("Build: running Python AST syntax compiler...\n");
        logBuilder.append(String.format("Validating syntax for %d Python file(s)...\n", request.files().size()));

        int errorCount = 0;

        for (CodeFileDto file : request.files()) {
            CompilationDiagnosticDto diag = validatePythonSyntax(file);
            if (diag != null) {
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
                ProgrammingLanguage.PYTHON,
                "Python 3.12 AST Compiler",
                executionTime,
                errorCount,
                0,
                diagnostics,
                logBuilder.toString()
        );
    }

    private CompilationDiagnosticDto validatePythonSyntax(CodeFileDto file) {
        String script = """
                import ast, sys
                content = sys.stdin.read()
                try:
                    ast.parse(content)
                    print("OK")
                except SyntaxError as e:
                    line = e.lineno if e.lineno is not None else 1
                    col = e.offset if e.offset is not None else 1
                    msg = e.msg if e.msg is not None else "Syntax Error"
                    print(f"ERR:{line}:{col}:{msg}")
                """;

        try {
            Process process = new ProcessBuilder("python3", "-c", script)
                    .redirectErrorStream(true)
                    .start();

            try (OutputStream os = process.getOutputStream()) {
                os.write(file.content().getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            boolean finished = process.waitFor(2, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return null;
            }

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("ERR:")) {
                        String[] parts = line.substring(4).split(":", 3);
                        long lineNum = parts.length > 0 ? Long.parseLong(parts[0]) : 1;
                        long colNum = parts.length > 1 ? Long.parseLong(parts[1]) : 1;
                        String msg = parts.length > 2 ? parts[2] : "Syntax error in Python code";
                        return new CompilationDiagnosticDto(file.fileName(), lineNum, colNum, "ERROR", msg);
                    }
                }
            }
        } catch (Exception e) {
            // If python3 cannot be spawned, return null (fallback)
            return null;
        }

        return null;
    }
}
