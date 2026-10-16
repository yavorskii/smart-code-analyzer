package ua.pnu.smartcode.runner.python;

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
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Component
public class PythonCodeRunner implements CodeRunner {

    private static final int TIMEOUT_SECONDS = 5;
    private static final Pattern MAIN_BLOCK_PATTERN = Pattern.compile("if\\s+__name__\\s*==\\s*['\"]__main__['\"]\\s*:");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.PYTHON;
    }

    @Override
    public ExecutionResponseDto run(ExecutionRequestDto request) {
        long startTime = System.currentTimeMillis();

        if (request.files().isEmpty()) {
            return new ExecutionResponseDto(
                    false,
                    ProgrammingLanguage.PYTHON,
                    1,
                    "",
                    "Error: No Python files provided for execution.",
                    0,
                    "python3",
                    false
            );
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("smartcode-run-python-");

            Path entryFilePath = null;
            for (CodeFileDto file : request.files()) {
                String fileName = file.fileName().endsWith(".py") ? file.fileName() : file.fileName() + ".py";
                Path filePath = workDir.resolve(fileName);
                Files.writeString(filePath, file.content() != null ? file.content() : "");
            }

            String entryName = selectEntryFileName(request.files(), request.mainFileName());
            entryFilePath = workDir.resolve(entryName);

            List<String> command = List.of("python3", "-u", entryFilePath.toAbsolutePath().toString());
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
                        ProgrammingLanguage.PYTHON,
                        124,
                        readStream(process.getInputStream()),
                        String.format("Python script timed out after %d seconds (terminated).", TIMEOUT_SECONDS),
                        executionTime,
                        "python3 " + entryName,
                        true
                );
            }

            int exitCode = process.exitValue();
            String stdout = readStream(process.getInputStream());
            String stderr = readStream(process.getErrorStream());

            return new ExecutionResponseDto(
                    exitCode == 0,
                    ProgrammingLanguage.PYTHON,
                    exitCode,
                    stdout,
                    stderr,
                    executionTime,
                    "python3 " + entryName,
                    false
            );

        } catch (Exception e) {
            return new ExecutionResponseDto(
                    false,
                    ProgrammingLanguage.PYTHON,
                    1,
                    "",
                    "Execution error: " + e.getMessage(),
                    System.currentTimeMillis() - startTime,
                    "python3",
                    false
            );
        } finally {
            deleteRecursively(workDir);
        }
    }

    private String selectEntryFileName(List<CodeFileDto> files, String preferredFileName) {
        if (preferredFileName != null && !preferredFileName.isBlank()) {
            for (CodeFileDto file : files) {
                if (file.fileName().equalsIgnoreCase(preferredFileName) ||
                        file.fileName().equalsIgnoreCase(preferredFileName + ".py")) {
                    return file.fileName().endsWith(".py") ? file.fileName() : file.fileName() + ".py";
                }
            }
        }

        for (CodeFileDto file : files) {
            String content = file.content() != null ? file.content() : "";
            if (MAIN_BLOCK_PATTERN.matcher(content).find()) {
                return file.fileName().endsWith(".py") ? file.fileName() : file.fileName() + ".py";
            }
        }

        for (CodeFileDto file : files) {
            if ("main.py".equalsIgnoreCase(file.fileName()) || "app.py".equalsIgnoreCase(file.fileName())) {
                return file.fileName();
            }
        }

        CodeFileDto first = files.get(0);
        return first.fileName().endsWith(".py") ? first.fileName() : first.fileName() + ".py";
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
