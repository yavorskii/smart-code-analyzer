package ua.pnu.smartcode.tester.javascript;

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
public class JavaScriptTypeScriptTestRunner implements TestRunner {

    private static final int TIMEOUT_SECONDS = 12;
    private static final Pattern PASS_PATTERN = Pattern.compile("#\\s+pass\\s+(\\d+)");
    private static final Pattern FAIL_PATTERN = Pattern.compile("#\\s+fail\\s+(\\d+)");
    private static final Pattern TESTS_PATTERN = Pattern.compile("#\\s+tests\\s+(\\d+)");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVASCRIPT || language == ProgrammingLanguage.TYPESCRIPT;
    }

    @Override
    public TestExecutionResponseDto runTests(TestExecutionRequestDto request) {
        long startTime = System.currentTimeMillis();

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("smartcode-test-js-ts-");

            boolean isTs = request.language() == ProgrammingLanguage.TYPESCRIPT;
            for (CodeFileDto file : request.files()) {
                String name = file.fileName();
                if (!name.endsWith(".ts") && !name.endsWith(".js")) {
                    name = isTs ? name + ".ts" : name + ".js";
                }
                Files.writeString(workDir.resolve(name), file.content() != null ? file.content() : "");
            }

            List<String> testFileNames = new ArrayList<>();
            for (GeneratedTestDto test : request.tests()) {
                if (request.testFileName() != null && !request.testFileName().isBlank()) {
                    if (!test.testFileName().equalsIgnoreCase(request.testFileName())) {
                        continue;
                    }
                }
                String name = test.testFileName();
                if (!name.endsWith(".ts") && !name.endsWith(".js")) {
                    name = isTs ? name + ".test.ts" : name + ".test.js";
                }
                Files.writeString(workDir.resolve(name), test.testCode() != null ? test.testCode() : "");
                testFileNames.add(name);
                if (name.endsWith(".ts")) {
                    isTs = true;
                }
            }

            if (testFileNames.isEmpty()) {
                return new TestExecutionResponseDto(
                        false,
                        request.language(),
                        0,
                        0,
                        1,
                        0,
                        0,
                        isTs ? "tsx --test" : "node --test",
                        "",
                        "No test files found to execute.",
                        "No tests"
                );
            }

            List<String> cmd = new ArrayList<>();
            if (isTs) {
                cmd.add("npx");
                cmd.add("--yes");
                cmd.add("tsx");
                cmd.add("--test");
            } else {
                cmd.add("node");
                cmd.add("--test");
            }
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
                        request.language(),
                        0,
                        0,
                        1,
                        0,
                        executionTime,
                        isTs ? "tsx --test" : "node --test",
                        "",
                        "Test execution timed out.",
                        "Timed out"
                );
            }

            String stdout = readStream(process.getInputStream());
            String stderr = readStream(process.getErrorStream());
            String fullOutput = (stdout + "\n" + stderr).trim();

            int passed = extractCount(fullOutput, PASS_PATTERN);
            int failed = extractCount(fullOutput, FAIL_PATTERN);
            int total = extractCount(fullOutput, TESTS_PATTERN);
            if (total == 0) {
                total = passed + failed;
            }

            boolean success = (process.exitValue() == 0) && (failed == 0);

            return new TestExecutionResponseDto(
                    success,
                    request.language(),
                    total,
                    passed,
                    failed,
                    0,
                    executionTime,
                    isTs ? "tsx --test" : "node --test",
                    stdout,
                    stderr,
                    fullOutput
            );

        } catch (Exception e) {
            return new TestExecutionResponseDto(
                    false,
                    request.language(),
                    0,
                    0,
                    1,
                    0,
                    System.currentTimeMillis() - startTime,
                    "node --test",
                    "",
                    "Error executing tests: " + e.getMessage(),
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
