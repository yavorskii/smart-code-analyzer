package ua.pnu.smartcode.runner.java;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.runner.CodeRunner;

import java.io.File;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Component
public class JavaCodeRunner implements CodeRunner {

    private static final int TIMEOUT_SECONDS = 5;
    private static final Pattern PACKAGE_PATTERN = Pattern.compile("(?m)^\\s*package\\s+([a-zA-Z0-9_.]+)\\s*;");
    private static final Pattern MAIN_METHOD_PATTERN = Pattern.compile("public\\s+static\\s+void\\s+main\\s*\\(");
    private static final Pattern CLASS_NAME_PATTERN = Pattern.compile("(?:public\\s+)?(?:class|record|enum)\\s+([a-zA-Z0-9_]+)");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVA;
    }

    @Override
    public ExecutionResponseDto run(ExecutionRequestDto request) {
        long startTime = System.currentTimeMillis();

        if (request.files().isEmpty()) {
            return new ExecutionResponseDto(
                    false,
                    ProgrammingLanguage.JAVA,
                    1,
                    "",
                    "Error: No source files provided for execution.",
                    0,
                    "java",
                    false
            );
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("smartcode-run-java-");
            Path srcDir = workDir.resolve("src");
            Path outDir = workDir.resolve("out");
            Files.createDirectories(srcDir);
            Files.createDirectories(outDir);

            List<String> sourceFilePaths = new ArrayList<>();
            for (CodeFileDto file : request.files()) {
                String content = file.content() != null ? file.content() : "";
                String pkg = extractPackage(content);
                Path targetFolder = pkg.isEmpty() ? srcDir : srcDir.resolve(pkg.replace('.', File.separatorChar));
                Files.createDirectories(targetFolder);

                String fileName = file.fileName().endsWith(".java") ? file.fileName() : file.fileName() + ".java";
                Path targetFile = targetFolder.resolve(fileName);
                Files.writeString(targetFile, content);
                sourceFilePaths.add(targetFile.toAbsolutePath().toString());
            }

            List<String> javacCmd = new ArrayList<>();
            javacCmd.add("javac");
            javacCmd.add("-d");
            javacCmd.add(outDir.toAbsolutePath().toString());
            javacCmd.addAll(sourceFilePaths);

            ProcessBuilder javacPb = new ProcessBuilder(javacCmd);
            Process javacProcess = javacPb.start();
            boolean javacFinished = javacProcess.waitFor(10, TimeUnit.SECONDS);

            if (!javacFinished) {
                javacProcess.destroyForcibly();
                return new ExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        124,
                        "",
                        "Compilation timed out after 10 seconds.",
                        System.currentTimeMillis() - startTime,
                        String.join(" ", javacCmd),
                        true
                );
            }

            int javacExitCode = javacProcess.exitValue();
            if (javacExitCode != 0) {
                String javacError = readStream(javacProcess.getErrorStream());
                return new ExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        javacExitCode,
                        "",
                        javacError.isBlank() ? "Compilation failed with exit code " + javacExitCode : javacError,
                        System.currentTimeMillis() - startTime,
                        String.join(" ", javacCmd),
                        false
                );
            }

            String mainClass = findMainClass(request.files(), request.mainFileName());
            if (mainClass == null) {
                return new ExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        1,
                        "",
                        "Error: Main method not found in project.\nPlease define the entry method as: public static void main(String[] args)",
                        System.currentTimeMillis() - startTime,
                        "java -cp out",
                        false
                );
            }

            List<String> javaCmd = List.of(
                    "java",
                    "-Xmx128m",
                    "-cp",
                    outDir.toAbsolutePath().toString(),
                    mainClass
            );

            ProcessBuilder javaPb = new ProcessBuilder(javaCmd);
            Process javaProcess = javaPb.start();

            if (request.stdin() != null && !request.stdin().isEmpty()) {
                try (OutputStream os = javaProcess.getOutputStream()) {
                    os.write(request.stdin().getBytes(StandardCharsets.UTF_8));
                    os.flush();
                } catch (IOException ignored) {
                }
            }

            boolean finished = javaProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long executionTime = System.currentTimeMillis() - startTime;

            if (!finished) {
                javaProcess.destroyForcibly();
                return new ExecutionResponseDto(
                        false,
                        ProgrammingLanguage.JAVA,
                        124,
                        readStream(javaProcess.getInputStream()),
                        String.format("Process timed out after %d seconds (terminated).", TIMEOUT_SECONDS),
                        executionTime,
                        String.join(" ", javaCmd),
                        true
                );
            }

            int exitCode = javaProcess.exitValue();
            String stdout = readStream(javaProcess.getInputStream());
            String stderr = readStream(javaProcess.getErrorStream());

            return new ExecutionResponseDto(
                    exitCode == 0,
                    ProgrammingLanguage.JAVA,
                    exitCode,
                    stdout,
                    stderr,
                    executionTime,
                    String.join(" ", javaCmd),
                    false
            );

        } catch (Exception e) {
            return new ExecutionResponseDto(
                    false,
                    ProgrammingLanguage.JAVA,
                    1,
                    "",
                    "Execution error: " + e.getMessage(),
                    System.currentTimeMillis() - startTime,
                    "java",
                    false
            );
        } finally {
            deleteRecursively(workDir);
        }
    }

    private String extractPackage(String content) {
        if (content == null) return "";
        Matcher matcher = PACKAGE_PATTERN.matcher(content);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private String findMainClass(List<CodeFileDto> files, String preferredFileName) {
        if (preferredFileName != null) {
            for (CodeFileDto file : files) {
                if (file.fileName().equalsIgnoreCase(preferredFileName) ||
                        file.fileName().equalsIgnoreCase(preferredFileName + ".java")) {
                    String candidate = extractClassWithMain(file);
                    if (candidate != null) {
                        return candidate;
                    }
                }
            }
        }

        for (CodeFileDto file : files) {
            String candidate = extractClassWithMain(file);
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private String extractClassWithMain(CodeFileDto file) {
        String content = file.content() != null ? file.content() : "";
        if (!MAIN_METHOD_PATTERN.matcher(content).find()) {
            return null;
        }

        String pkg = extractPackage(content);
        Matcher classMatcher = CLASS_NAME_PATTERN.matcher(content);
        String className = null;
        if (classMatcher.find()) {
            className = classMatcher.group(1);
        } else {
            className = file.fileName().replace(".java", "");
        }

        return pkg.isEmpty() ? className : pkg + "." + className;
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
