package ua.pnu.smartcode.compiler.java;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.compiler.CodeCompiler;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CompilationDiagnosticDto;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.StringWriter;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Component
public class JavaCodeCompiler implements CodeCompiler {

    private final JavaCompiler compiler;

    public JavaCodeCompiler() {
        this.compiler = ToolProvider.getSystemJavaCompiler();
    }

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVA;
    }

    @Override
    public CompilationResponseDto compile(CompilationRequestDto request) {
        long startTime = System.currentTimeMillis();

        if (compiler == null) {
            return new CompilationResponseDto(
                    false,
                    ProgrammingLanguage.JAVA,
                    "javac (System)",
                    0,
                    1,
                    0,
                    List.of(new CompilationDiagnosticDto("N/A", 0, 0, "ERROR", "System JavaCompiler is not available in runtime.")),
                    "Error: JDK compiler not found in the current JVM environment."
            );
        }

        DiagnosticCollector<JavaFileObject> diagnosticCollector = new DiagnosticCollector<>();
        StringWriter compilerOutput = new StringWriter();

        List<JavaFileObject> compilationUnits = new ArrayList<>();
        for (CodeFileDto file : request.files()) {
            compilationUnits.add(new InMemoryJavaFileObject(file.fileName(), file.content()));
        }

        StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnosticCollector, null, null);
        List<String> options = List.of("-proc:none", "-Xlint:none");

        JavaCompiler.CompilationTask task = compiler.getTask(
                compilerOutput,
                fileManager,
                diagnosticCollector,
                options,
                null,
                compilationUnits
        );

        boolean success = Boolean.TRUE.equals(task.call());
        long executionTime = System.currentTimeMillis() - startTime;

        List<CompilationDiagnosticDto> diagnostics = new ArrayList<>();
        int errorCount = 0;
        int warningCount = 0;
        StringBuilder logBuilder = new StringBuilder();

        logBuilder.append("Build: running javac 21.0.2 compiler...\n");
        logBuilder.append(String.format("Compiling %d Java source file(s)...\n", request.files().size()));

        for (Diagnostic<? extends JavaFileObject> diagnostic : diagnosticCollector.getDiagnostics()) {
            String severity = diagnostic.getKind().name();
            if (diagnostic.getKind() == Diagnostic.Kind.ERROR) {
                errorCount++;
            } else if (diagnostic.getKind() == Diagnostic.Kind.WARNING || diagnostic.getKind() == Diagnostic.Kind.MANDATORY_WARNING) {
                warningCount++;
            }

            String sourceName = diagnostic.getSource() != null
                    ? extractSimpleName(diagnostic.getSource().getName())
                    : "Unknown";
            long line = diagnostic.getLineNumber() > 0 ? diagnostic.getLineNumber() : 1;
            long column = diagnostic.getColumnNumber() > 0 ? diagnostic.getColumnNumber() : 1;
            String message = diagnostic.getMessage(null);

            diagnostics.add(new CompilationDiagnosticDto(
                    sourceName,
                    line,
                    column,
                    severity,
                    message
            ));

            logBuilder.append(String.format("[%s] %s:%d:%d: %s\n", severity, sourceName, line, column, message));
        }

        if (success) {
            logBuilder.append(String.format("Build successful: 0 errors, %d warnings (completed in %d ms).\n", warningCount, executionTime));
        } else {
            logBuilder.append(String.format("Build failed: %d error(s), %d warning(s) (completed in %d ms).\n", errorCount, warningCount, executionTime));
        }

        return new CompilationResponseDto(
                success,
                ProgrammingLanguage.JAVA,
                "javac 21.0.2",
                executionTime,
                errorCount,
                warningCount,
                diagnostics,
                logBuilder.toString()
        );
    }

    private String extractSimpleName(String rawUri) {
        if (rawUri == null) return "Unknown";
        int lastSlash = rawUri.lastIndexOf('/');
        return lastSlash >= 0 ? rawUri.substring(lastSlash + 1) : rawUri;
    }

    private static class InMemoryJavaFileObject extends SimpleJavaFileObject {
        private final String content;

        InMemoryJavaFileObject(String fileName, String content) {
            super(URI.create("string:///" + (fileName.endsWith(".java") ? fileName : fileName + ".java")), Kind.SOURCE);
            this.content = content != null ? content : "";
        }

        @Override
        public CharSequence getCharContent(boolean ignoreEncodingErrors) {
            return content;
        }
    }
}
