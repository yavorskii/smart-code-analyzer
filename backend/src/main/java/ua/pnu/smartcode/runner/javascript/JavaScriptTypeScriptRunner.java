package ua.pnu.smartcode.runner.javascript;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.runner.CodeRunner;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class JavaScriptTypeScriptRunner implements CodeRunner {

    private static final int TIMEOUT_SECONDS = 5;

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVASCRIPT || language == ProgrammingLanguage.TYPESCRIPT;
    }

    @Override
    public ExecutionResponseDto run(ExecutionRequestDto request) {
        long startTime = System.currentTimeMillis();

        if (request.files().isEmpty()) {
            return new ExecutionResponseDto(
                    false,
                    request.language(),
                    1,
                    "",
                    "Error: No source files provided for execution.",
                    0,
                    request.language() == ProgrammingLanguage.TYPESCRIPT ? "npx tsx" : "node",
                    false
            );
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("smartcode-run-js-ts-");

            boolean isTs = request.language() == ProgrammingLanguage.TYPESCRIPT;
            for (CodeFileDto file : request.files()) {
                String name = file.fileName();
                if (!name.endsWith(".ts") && !name.endsWith(".js")) {
                    name = isTs ? name + ".ts" : name + ".js";
                }
                Path filePath = workDir.resolve(name);
                Files.writeString(filePath, file.content() != null ? file.content() : "");
                if (name.endsWith(".ts")) {
                    isTs = true;
                }
            }

            String entryName = selectEntryFileName(request.files(), request.mainFileName(), isTs);
            Path entryFilePath = workDir.resolve(entryName);

            List<String> command = new ArrayList<>();
            if (isTs || entryName.endsWith(".ts")) {
                command.add("npx");
                command.add("--yes");
                command.add("tsx");
            } else {
                command.add("node");
            }
            command.add(entryFilePath.toAbsolutePath().toString());

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(workDir.toFile());

            Process process = pb.start();

            if (request.stdin() != null && !request.stdin().isEmpty()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(request.stdin().getBytes(StandardCharsets.UTF_8));
                    os.flush();
                } catch (IOException ignored) {
                }
            }

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long executionTime = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                return new ExecutionResponseDto(
                        false,
                        request.language(),
                        124,
                        readStream(process.getInputStream()),
                        String.format("Execution timed out after %d seconds (terminated).", TIMEOUT_SECONDS),
                        executionTime,
                        String.join(" ", command),
                        true
                );
            }

            int exitCode = process.exitValue();
            String stdout = readStream(process.getInputStream());
            String stderr = readStream(process.getErrorStream());

            return new ExecutionResponseDto(
                    exitCode == 0,
                    request.language(),
                    exitCode,
                    stdout,
                    stderr,
                    executionTime,
                    String.join(" ", command),
                    false
            );

        } catch (Exception e) {
            return new ExecutionResponseDto(
                    false,
                    request.language(),
                    1,
                    "",
                    "Execution error: " + e.getMessage(),
                    System.currentTimeMillis() - startTime,
                    request.language() == ProgrammingLanguage.TYPESCRIPT ? "npx tsx" : "node",
                    false
            );
        } finally {
            deleteRecursively(workDir);
        }
    }

    private String selectEntryFileName(List<CodeFileDto> files, String preferredFileName, boolean isTs) {
        String defaultExt = isTs ? ".ts" : ".js";
        if (preferredFileName != null && !preferredFileName.isBlank()) {
            for (CodeFileDto file : files) {
                if (file.fileName().equalsIgnoreCase(preferredFileName) ||
                        file.fileName().equalsIgnoreCase(preferredFileName + defaultExt)) {
                    return ensureExt(file.fileName(), defaultExt);
                }
            }
        }

        for (CodeFileDto file : files) {
            String name = file.fileName().toLowerCase();
            if (name.equals("index.ts") || name.equals("index.js") ||
                    name.equals("main.ts") || name.equals("main.js") ||
                    name.equals("app.ts") || name.equals("app.js")) {
                return file.fileName();
            }
        }

        CodeFileDto first = files.get(0);
        return ensureExt(first.fileName(), defaultExt);
    }

    private String ensureExt(String fileName, String defaultExt) {
        if (fileName.endsWith(".ts") || fileName.endsWith(".js")) {
            return fileName;
        }
        return fileName + defaultExt;
    }

    private String readStream(InputStream inputStream) {
        try {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    private void deleteRecursively(Path root) {
        if (root == null || !Files.exists(root)) return;
        try {
            Files.walkFileTree(root, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.deleteIfExists(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.deleteIfExists(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException ignored) {
        }
    }
}
