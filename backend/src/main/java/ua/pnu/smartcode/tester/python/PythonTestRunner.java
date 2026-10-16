package ua.pnu.smartcode.tester.python;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.tester.TestRunner;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PythonTestRunner implements TestRunner {

    private static final int TIMEOUT_SECONDS = 10;
    private static final Pattern PASSED_PATTERN = Pattern.compile("(\\d+)\\s+passed");
    private static final Pattern FAILED_PATTERN = Pattern.compile("(\\d+)\\s+failed");
    private static final Pattern ERRORS_PATTERN = Pattern.compile("(\\d+)\\s+error");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.PYTHON;
    }

    @Override
    public TestExecutionResponseDto runTests(TestExecutionRequestDto request) {
        long startTime = System.currentTimeMillis();

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("smartcode-test-py-");

            for (CodeFileDto file : request.files()) {
                String name = file.fileName().endsWith(".py") ? file.fileName() : file.fileName() + ".py";
                Files.writeString(workDir.resolve(name), file.content() != null ? file.content() : "");
            }

            List<String> testFileNames = new ArrayList<>();
            for (GeneratedTestDto test : request.tests()) {
                if (request.testFileName() != null && !request.testFileName().isBlank()) {
                    if (!test.testFileName().equalsIgnoreCase(request.testFileName())) {
                        continue;
                    }
                }
                String name = test.testFileName().endsWith(".py") ? test.testFileName() : test.testFileName() + ".py";
                Files.writeString(workDir.resolve(name), test.testCode() != null ? test.testCode() : "");
                testFileNames.add(name);
            }

            if (testFileNames.isEmpty()) {
                return new TestExecutionResponseDto(
                        false,
                        ProgrammingLanguage.PYTHON,
                        0,
                        0,
                        1,
                        0,
                        0,
                        "pytest",
                        "",
                        "No test files found to execute.",
                        "No tests"
                );
            }

            List<String> cmd = new ArrayList<>();
            cmd.add("python3");
            cmd.add("-m");
            cmd.add("pytest");
            cmd.add("-v");
            cmd.addAll(testFileNames);

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(workDir.toFile());

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            long executionTime = System.currentTimeMillis() - startTime;
            if (!finished) {
                process.destroyForcibly();
                return new TestExecutionResponseDto(
                        false,
                        ProgrammingLanguage.PYTHON,
                        0,
                        0,
                        1,
                        0,
                        executionTime,
                        "pytest",
                        "",
                        "Test execution timed out.",
                        "Timed out"
                );
            }

            String stdout = readStream(process.getInputStream());
            String stderr = readStream(process.getErrorStream());
            String fullOutput = (stdout + "\n" + stderr).trim();

            int passed = extractCount(fullOutput, PASSED_PATTERN);
            int failed = extractCount(fullOutput, FAILED_PATTERN) + extractCount(fullOutput, ERRORS_PATTERN);
            int total = passed + failed;

            boolean success = (process.exitValue() == 0) && (failed == 0);

            return new TestExecutionResponseDto(
                    success,
                    ProgrammingLanguage.PYTHON,
                    total,
                    passed,
                    failed,
                    0,
                    executionTime,
                    "pytest",
                    stdout,
                    stderr,
                    fullOutput
            );

        } catch (Exception e) {
            return new TestExecutionResponseDto(
                    false,
                    ProgrammingLanguage.PYTHON,
                    0,
                    0,
                    1,
                    0,
                    System.currentTimeMillis() - startTime,
                    "pytest",
                    "",
                    "Error executing Python tests: " + e.getMessage(),
                    "Execution error"
            );
        } finally {
            deleteRecursively(workDir);
        }
    }

    private int extractCount(String text, Pattern pattern) {
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return 0;
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
