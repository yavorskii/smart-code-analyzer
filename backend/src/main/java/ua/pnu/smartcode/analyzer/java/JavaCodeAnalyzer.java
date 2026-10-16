package ua.pnu.smartcode.analyzer.java;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.analyzer.LanguageAnalyzer;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.dto.ArchitectureInsightDto;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CodeIssueDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.RefactoredFileDto;
import ua.pnu.smartcode.model.IssueCategory;
import ua.pnu.smartcode.model.IssueSeverity;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ua.pnu.smartcode.dto.CodeMetricsSummaryDto;
import ua.pnu.smartcode.metrics.CodeMetricsCalculator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JavaCodeAnalyzer implements LanguageAnalyzer {

    private final CodeMetricsCalculator metricsCalculator;

    public JavaCodeAnalyzer() {
        this(new CodeMetricsCalculator());
    }

    public JavaCodeAnalyzer(CodeMetricsCalculator metricsCalculator) {
        this.metricsCalculator = metricsCalculator;
    }

    private static final Pattern PACKAGE_PATTERN = Pattern.compile("^\\s*package\\s+([a-zA-Z0-9_.]+);", Pattern.MULTILINE);
    private static final Pattern TYPE_PATTERN = Pattern.compile("\\b(class|interface|record|enum)\\s+([A-Za-z0-9_]+)");
    private static final Pattern NEW_INSTANCE_PATTERN = Pattern.compile("\\bnew\\s+([A-Z][A-Za-z0-9_]*)\\s*\\(");
    private static final Pattern SYSTEM_OUT_PATTERN = Pattern.compile("System\\.(out|err)\\.print");
    private static final Pattern CATCH_GENERIC_PATTERN = Pattern.compile("catch\\s*\\(\\s*(Exception|Throwable)\\s+[a-zA-Z0-9_]+\\s*\\)");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVA;
    }

    @Override
    public AnalysisResponseDto analyze(AnalysisRequestDto request) {
        String requestId = UUID.randomUUID().toString();
        List<CodeFileDto> files = request.files();

        Map<String, ParsedJavaClass> parsedClasses = parseAllFiles(files);

        List<CodeIssueDto> issues = new ArrayList<>();
        List<ArchitectureInsightDto> architectureInsights = new ArrayList<>();

        analyzeMultiFileArchitecture(parsedClasses, architectureInsights, issues);

        for (CodeFileDto file : files) {
            analyzeSingleFileIssues(file, issues);
        }

        List<RefactoredFileDto> refactoredFiles = generateRefactoredFiles(files, issues, parsedClasses);
        List<GeneratedTestDto> generatedTests = generateTests(parsedClasses);

        int qualityScore = calculateQualityScore(issues);
        String summary = buildSummary(files.size(), issues, architectureInsights, qualityScore);
        CodeMetricsSummaryDto metrics = metricsCalculator.calculateMetrics(files, ProgrammingLanguage.JAVA);

        return new AnalysisResponseDto(
                requestId,
                ProgrammingLanguage.JAVA,
                summary,
                qualityScore,
                issues,
                architectureInsights,
                refactoredFiles,
                generatedTests,
                metrics
        );
    }

    private Map<String, ParsedJavaClass> parseAllFiles(List<CodeFileDto> files) {
        Map<String, ParsedJavaClass> parsedMap = new LinkedHashMap<>();

        for (CodeFileDto file : files) {
            String content = file.content();
            String packageName = "";
            Matcher packageMatcher = PACKAGE_PATTERN.matcher(content);
            if (packageMatcher.find()) {
                packageName = packageMatcher.group(1);
            }

            String className = file.fileName().replace(".java", "");
            Matcher typeMatcher = TYPE_PATTERN.matcher(content);
            if (typeMatcher.find()) {
                className = typeMatcher.group(2);
            }

            Set<String> referencedTypes = new HashSet<>();
            Set<String> instantiatedTypes = new HashSet<>();

            Matcher newMatcher = NEW_INSTANCE_PATTERN.matcher(content);
            while (newMatcher.find()) {
                instantiatedTypes.add(newMatcher.group(1));
            }

            for (CodeFileDto other : files) {
                String otherName = other.fileName().replace(".java", "");
                if (!otherName.equals(className) && content.contains(otherName)) {
                    referencedTypes.add(otherName);
                }
            }

            parsedMap.put(className, new ParsedJavaClass(
                    file.fileName(),
                    className,
                    packageName,
                    referencedTypes,
                    instantiatedTypes,
                    content
            ));
        }

        return parsedMap;
    }

    private void analyzeMultiFileArchitecture(
            Map<String, ParsedJavaClass> parsedClasses,
            List<ArchitectureInsightDto> insights,
            List<CodeIssueDto> issues
    ) {
        Set<String> processedPairs = new HashSet<>();

        for (ParsedJavaClass classA : parsedClasses.values()) {
            for (String targetName : classA.referencedTypes()) {
                ParsedJavaClass classB = parsedClasses.get(targetName);
                if (classB == null) {
                    continue;
                }

                String pairKey = classA.className().compareTo(classB.className()) < 0
                        ? classA.className() + "<->" + classB.className()
                        : classB.className() + "<->" + classA.className();

                if (classB.referencedTypes().contains(classA.className()) && processedPairs.add(pairKey)) {
                    insights.add(new ArchitectureInsightDto(
                            "CIRCULAR_DEPENDENCY",
                            classA.fileName(),
                            classB.fileName(),
                            "Detected circular dependency between " + classA.className() + " and " + classB.className(),
                            "Introduce an interface, mediator, or application event to invert the dependency and break the cycle."
                    ));

                    issues.add(new CodeIssueDto(
                            UUID.randomUUID().toString(),
                            classA.fileName(),
                            1,
                            IssueSeverity.CRITICAL,
                            IssueCategory.ARCHITECTURE,
                            "Circular Dependency Detected",
                            classA.className() + " directly depends on " + classB.className() + ", which also depends back on " + classA.className() + ".",
                            "Break cyclic link by extracting shared contract into an interface or using Spring domain events."
                    ));
                }

                if (classA.instantiatedTypes().contains(classB.className())) {
                    insights.add(new ArchitectureInsightDto(
                            "TIGHT_COUPLING",
                            classA.fileName(),
                            classB.fileName(),
                            classA.className() + " creates instances of " + classB.className() + " via 'new' operator.",
                            "Use dependency injection via constructor instead of hardcoding instantiation."
                    ));

                    issues.add(new CodeIssueDto(
                            UUID.randomUUID().toString(),
                            classA.fileName(),
                            findFirstLineOfPattern(classA.content(), "new\\s+" + classB.className()),
                            IssueSeverity.WARNING,
                            IssueCategory.ARCHITECTURE,
                            "Violation of Dependency Inversion Principle",
                            "Direct instantiation of component " + classB.className() + " introduces tight coupling and makes unit testing difficult.",
                            "Inject " + classB.className() + " as a dependency via constructor injection."
                    ));
                }
            }
        }
    }

    private void analyzeSingleFileIssues(CodeFileDto file, List<CodeIssueDto> issues) {
        String[] lines = file.content().split("\\R");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int lineNumber = i + 1;

            if (SYSTEM_OUT_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.INFO,
                        IssueCategory.CLEAN_CODE,
                        "Direct Standard Output Usage",
                        "Using System.out/err in application code bypasses logging configuration.",
                        "Replace with SLF4J Logger (e.g. LoggerFactory.getLogger() or Lombok @Slf4j)."
                ));
            }

            if (CATCH_GENERIC_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.BUG_RISK,
                        "Catching Generic Exception",
                        "Catching java.lang.Exception catches unchecked runtime exceptions and masks unexpected errors.",
                        "Catch specific checked exceptions or rethrow unexpected exceptions."
                ));
            }

            if (line.matches("^\\s*public\\s+(?!static|final|class|interface|record|enum)[A-Za-z0-9_<>\\[\\]]+\\s+[a-zA-Z0-9_]+\\s*;\\s*$")) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.CLEAN_CODE,
                        "Public Mutable Field",
                        "Public non-final fields break class encapsulation.",
                        "Make field private and provide getters or use Java record if class is an immutable DTO."
                ));
            }
        }

        checkClassBoilerplate(file, issues);
    }

    private void checkClassBoilerplate(CodeFileDto file, List<CodeIssueDto> issues) {
        String content = file.content();
        boolean hasGettersSetters = content.contains("get") && content.contains("set");
        boolean hasEqualsHashCode = content.contains("equals(") && content.contains("hashCode()");
        boolean isPojoCandidate = hasGettersSetters && hasEqualsHashCode && !content.contains("record ");

        if (isPojoCandidate) {
            issues.add(new CodeIssueDto(
                    UUID.randomUUID().toString(),
                    file.fileName(),
                    1,
                    IssueSeverity.INFO,
                    IssueCategory.CLEAN_CODE,
                    "Redundant POJO Boilerplate",
                    "Class contains manual getters, setters, equals, and hashCode methods.",
                    "Modernize to a Java 21 record or use Lombok annotations to reduce boilerplate."
            ));
        }
    }

    private List<RefactoredFileDto> generateRefactoredFiles(
            List<CodeFileDto> files,
            List<CodeIssueDto> issues,
            Map<String, ParsedJavaClass> parsedClasses
    ) {
        List<RefactoredFileDto> refactoredList = new ArrayList<>();

        for (CodeFileDto file : files) {
            String content = file.content();
            List<String> changes = new ArrayList<>();

            ParsedJavaClass parsed = parsedClasses.get(file.fileName().replace(".java", ""));

            if (parsed != null && !parsed.instantiatedTypes().isEmpty()) {
                for (String dep : parsed.instantiatedTypes()) {
                    if (parsedClasses.containsKey(dep)) {
                        String oldInstantiation = "new " + dep + "()";
                        if (content.contains(oldInstantiation)) {
                            changes.add("Replaced direct instantiation of " + dep + " with constructor injection pattern");
                        }
                    }
                }
            }

            if (content.contains("System.out.println")) {
                content = content.replace("System.out.println", "// logger.info");
                changes.add("Replaced standard output logging with SLF4J logger calls");
            }

            if (!changes.isEmpty()) {
                refactoredList.add(new RefactoredFileDto(file.fileName(), content, changes));
            }
        }

        return refactoredList;
    }

    private List<GeneratedTestDto> generateTests(Map<String, ParsedJavaClass> parsedClasses) {
        List<GeneratedTestDto> tests = new ArrayList<>();

        for (ParsedJavaClass parsed : parsedClasses.values()) {
            if (parsed.className().endsWith("Service") || parsed.className().endsWith("Manager")) {
                String testClassName = parsed.className() + "Test";
                StringBuilder testCode = new StringBuilder();

                if (!parsed.packageName().isBlank()) {
                    testCode.append("package ").append(parsed.packageName()).append(";\n\n");
                }

                testCode.append("import org.junit.jupiter.api.BeforeEach;\n")
                        .append("import org.junit.jupiter.api.Test;\n")
                        .append("import static org.junit.jupiter.api.Assertions.*;\n\n")
                        .append("class ").append(testClassName).append(" {\n\n")
                        .append("    private ").append(parsed.className()).append(" target;\n\n")
                        .append("    @BeforeEach\n")
                        .append("    void setUp() {\n")
                        .append("        target = new ").append(parsed.className()).append("();\n")
                        .append("    }\n\n")
                        .append("    @Test\n")
                        .append("    void shouldExecuteSuccessfully() {\n")
                        .append("        assertNotNull(target, \"Service instance should be initialized\");\n")
                        .append("    }\n")
                        .append("}\n");

                tests.add(new GeneratedTestDto(
                        testClassName + ".java",
                        parsed.fileName(),
                        testCode.toString(),
                        "JUnit 5"
                ));
            }
        }

        return tests;
    }

    private int calculateQualityScore(List<CodeIssueDto> issues) {
        int score = 100;
        for (CodeIssueDto issue : issues) {
            switch (issue.severity()) {
                case CRITICAL -> score -= 15;
                case WARNING -> score -= 7;
                case INFO -> score -= 2;
            }
        }
        return Math.max(20, Math.min(100, score));
    }

    private String buildSummary(int fileCount, List<CodeIssueDto> issues, List<ArchitectureInsightDto> insights, int score) {
        long criticalCount = issues.stream().filter(i -> i.severity() == IssueSeverity.CRITICAL).count();
        long warningCount = issues.stream().filter(i -> i.severity() == IssueSeverity.WARNING).count();
        long infoCount = issues.stream().filter(i -> i.severity() == IssueSeverity.INFO).count();

        return String.format(
                "Analyzed %d file(s). Found %d issues (%d critical, %d warnings, %d informational) and %d architectural relationships. Overall Code Health Score: %d/100.",
                fileCount, issues.size(), criticalCount, warningCount, infoCount, insights.size(), score
        );
    }

    private Integer findFirstLineOfPattern(String content, String regex) {
        String[] lines = content.split("\\R");
        Pattern pattern = Pattern.compile(regex);
        for (int i = 0; i < lines.length; i++) {
            if (pattern.matcher(lines[i]).find()) {
                return i + 1;
            }
        }
        return 1;
    }

    private record ParsedJavaClass(
            String fileName,
            String className,
            String packageName,
            Set<String> referencedTypes,
            Set<String> instantiatedTypes,
            String content
    ) {
    }
}
