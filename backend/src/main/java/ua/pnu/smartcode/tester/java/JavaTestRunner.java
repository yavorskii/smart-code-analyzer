package ua.pnu.smartcode.tester.java;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.tester.TestRunner;

import java.io.File;
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
public class JavaTestRunner implements TestRunner {

    private static final int TIMEOUT_SECONDS = 15;
    private static final Pattern PACKAGE_PATTERN = Pattern.compile("(?m)^\\s*package\\s+([a-zA-Z0-9_.]+)\\s*;");
    private static final Pattern SUCCESS_PATTERN = Pattern.compile("(?i)\\[\\s*(\\d+)\\s+tests successful\\s*\\]");
    private static final Pattern FAILED_PATTERN = Pattern.compile("(?i)\\[\\s*(\\d+)\\s+tests failed\\s*\\]");
    private static final Pattern SKIPPED_PATTERN = Pattern.compile("(?i)\\[\\s*(\\d+)\\s+tests skipped\\s*\\]");
    private static final Pattern FOUND_PATTERN = Pattern.compile("(?i)\\[\\s*(\\d+)\\s+tests found\\s*\\]");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVA;
    }

    @Override
    public TestExecutionResponseDto runTests(TestExecutionRequestDto request) {
        long startTime = System.currentTimeMillis();

        Path junitJar = resolveJunitJar();
        if (junitJar == null || !Files.exists(junitJar)) {
            return new TestExecutionResponseDto(
                    false,
                    ProgrammingLanguage.JAVA,
                    0,
                    0,
                    1,
                    0,
                    0,
                    "JUnit 5",
                    "",
                    "Error: JUnit 5 platform runner jar not found in local Maven repository.",
                    "Build Error: JUnit standalone jar is missing."
            );
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("smartcode-test-java-");
            Path srcDir = workDir.resolve("src");
            Path outDir = workDir.resolve("out");
            Files.createDirectories(srcDir);
            Files.createDirectories(outDir);

            List<String> javaFilesToCompile = new ArrayList<>();

            for (CodeFileDto file : request.files()) {
                String content = file.content() != null ? file.content() : "";
                Path targetFile = writeSourceFile(srcDir, file.fileName(), content);
                javaFilesToCompile.add(targetFile.toAbsolutePath().toString());
            }

            for (GeneratedTestDto test : request.tests()) {
                if (request.testFileName() != null && !request.testFileName().isBlank()) {
                    if (!test.testFileName().equalsIgnoreCase(request.testFileName())) {
                        continue;
                    }
                }
                String content = test.testCode() != null ? test.testCode() : "";
                Path targetFile = writeSourceFile(srcDir, test.testFileName(), content);
                javaFilesToCompile.add(targetFile.toAbsolutePath().toString());
            }

            List<String> javacCmd = new ArrayList<>();
            javacCmd.add("javac");
            javacCmd.add("-cp");
            javacCmd.add(junitJar.toAbsolutePath().toString());
            javacCmd.add("-d");
            javacCmd.add(outDir.toAbsolutePath().toString());
            javacCmd.addAll(javaFilesToCompile);

            ProcessBuilder javacPb = new ProcessBuilder(javacCmd);
            Process javacProcess = javacPb.start();
            boolean javacFinished = javacProcess.waitFor(10, TimeUnit.SECONDS);

            if (!javacFinished) {
                javacProcess.destroyForcibly();
                return new TestExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        0,
                        0,
                        1,
                        0,
                        System.currentTimeMillis() - startTime,
                        "JUnit 5",
                        "",
                        "Compilation timed out.",
                        "Error: Test compilation timed out."
                );
            }

            if (javacProcess.exitValue() != 0) {
                String error = readStream(javacProcess.getErrorStream());
                return new TestExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        0,
                        0,
                        1,
                        0,
                        System.currentTimeMillis() - startTime,
                        "JUnit 5",
                        "",
                        error,
                        "Compilation failed:\n" + error
                );
            }

            List<String> junitCmd = List.of(
                    "java",
                    "-jar",
                    junitJar.toAbsolutePath().toString(),
                    "execute",
                    "--class-path",
                    outDir.toAbsolutePath().toString(),
                    "--scan-class-path",
                    "--disable-ansi-colors"
            );

            ProcessBuilder junitPb = new ProcessBuilder(junitCmd);
            Process junitProcess = junitPb.start();
            boolean junitFinished = junitProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            long executionTime = System.currentTimeMillis() - startTime;
            if (!junitFinished) {
                junitProcess.destroyForcibly();
                return new TestExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        0,
                        0,
                        1,
                        0,
                        executionTime,
                        "JUnit 5",
                        "",
                        "Test execution timed out after " + TIMEOUT_SECONDS + "s",
                        "Timed out"
                );
            }

            String stdout = readStream(junitProcess.getInputStream());
            String stderr = readStream(junitProcess.getErrorStream());
            int exitCode = junitProcess.exitValue();

            int passed = extractCount(stdout, SUCCESS_PATTERN);
            int failed = extractCount(stdout, FAILED_PATTERN);
            int skipped = extractCount(stdout, SKIPPED_PATTERN);
            int found = extractCount(stdout, FOUND_PATTERN);
            int total = found > 0 ? found : (passed + failed + skipped);

            boolean success = (exitCode == 0) && (failed == 0);

            return new TestExecutionResponseDto(
                    success,
                    ProgrammingLanguage.JAVA,
                    total,
                    passed,
                    failed,
                    skipped,
                    executionTime,
                    "JUnit 5",
                    stdout,
                    stderr,
                    stdout
            );

        } catch (Exception e) {
            return new TestExecutionResponseDto(
                    false,
                    ProgrammingLanguage.JAVA,
                    0,
                    0,
                    1,
                    0,
                    System.currentTimeMillis() - startTime,
                    "JUnit 5",
                    "",
                    "Error running tests: " + e.getMessage(),
                    "Execution failure: " + e.getMessage()
            );
        } finally {
            deleteRecursively(workDir);
        }
    }

    private Path writeSourceFile(Path baseDir, String fileName, String content) throws IOException {
        String pkg = extractPackage(content);
        Path targetDir = pkg.isEmpty() ? baseDir : baseDir.resolve(pkg.replace('.', File.separatorChar));
        Files.createDirectories(targetDir);
        String name = fileName.endsWith(".java") ? fileName : fileName + ".java";
        Path target = targetDir.resolve(name);
        Files.writeString(target, content);
        return target;
    }

    private String extractPackage(String content) {
        if (content == null) return "";
        Matcher matcher = PACKAGE_PATTERN.matcher(content);
        return matcher.find() ? matcher.group(1).trim() : "";
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

    private Path resolveJunitJar() {
        String home = System.getProperty("user.home");
        Path direct = Path.of(home, ".m2", "repository", "org", "junit", "platform", "junit-platform-console-standalone", "1.10.3", "junit-platform-console-standalone-1.10.3.jar");
        if (Files.exists(direct)) {
            return direct;
        }

        Path m2Repo = Path.of(home, ".m2", "repository");
        if (Files.exists(m2Repo)) {
            try (var stream = Files.walk(m2Repo)) {
                return stream
                        .filter(p -> p.getFileName().toString().startsWith("junit-platform-console-standalone") && p.getFileName().toString().endsWith(".jar"))
                        .findFirst()
                        .orElse(null);
            } catch (IOException ignored) {
            }
        }
        return null;
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
