package ua.pnu.smartcode.analyzer.javascript;

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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import ua.pnu.smartcode.dto.CodeMetricsSummaryDto;
import ua.pnu.smartcode.metrics.CodeMetricsCalculator;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public abstract class AbstractEcmaScriptAnalyzer implements LanguageAnalyzer {

    protected final CodeMetricsCalculator metricsCalculator;

    protected AbstractEcmaScriptAnalyzer() {
        this(new CodeMetricsCalculator());
    }

    protected AbstractEcmaScriptAnalyzer(CodeMetricsCalculator metricsCalculator) {
        this.metricsCalculator = metricsCalculator;
    }

    private static final Pattern CLASS_PATTERN = Pattern.compile("\\bclass\\s+([A-Za-z0-9_]+)");
    private static final Pattern IMPORT_FROM_PATTERN = Pattern.compile("import\\s+.*?from\\s+['\"](.*?)['\"]");
    private static final Pattern REQUIRE_PATTERN = Pattern.compile("require\\s*\\(\\s*['\"](.*?)['\"]\\s*\\)");
    private static final Pattern NEW_INSTANCE_PATTERN = Pattern.compile("\\bnew\\s+([A-Z][A-Za-z0-9_]*)\\s*\\(");
    private static final Pattern VAR_PATTERN = Pattern.compile("\\bvar\\s+([a-zA-Z0-9_]+)");
    private static final Pattern LOOSE_EQ_PATTERN = Pattern.compile("([^=!<>])(==|!=)([^=])");
    private static final Pattern CONSOLE_PATTERN = Pattern.compile("\\bconsole\\.(log|debug|info|warn|error)\\s*\\(");
    private static final Pattern EVAL_PATTERN = Pattern.compile("\\b(eval\\s*\\(|new\\s+Function\\s*\\()");

    protected abstract ProgrammingLanguage getTargetLanguage();

    protected abstract String getTestFrameworkName();

    protected abstract String getFileExtension();

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == getTargetLanguage();
    }

    @Override
    public AnalysisResponseDto analyze(AnalysisRequestDto request) {
        String requestId = UUID.randomUUID().toString();
        List<CodeFileDto> files = request.files();

        Map<String, ParsedJsModule> parsedModules = parseAllFiles(files);

        List<CodeIssueDto> issues = new ArrayList<>();
        List<ArchitectureInsightDto> architectureInsights = new ArrayList<>();

        analyzeArchitecture(parsedModules, architectureInsights, issues);

        for (CodeFileDto file : files) {
            analyzeSingleFile(file, issues);
            analyzeLanguageSpecificIssues(file, issues);
        }

        List<RefactoredFileDto> refactoredFiles = generateRefactoredFiles(files, issues, parsedModules);
        List<GeneratedTestDto> generatedTests = generateTests(parsedModules);

        int qualityScore = calculateQualityScore(issues);
        String summary = buildSummary(files.size(), issues, architectureInsights, qualityScore);
        CodeMetricsSummaryDto metrics = metricsCalculator.calculateMetrics(files, getTargetLanguage());

        return new AnalysisResponseDto(
                requestId,
                getTargetLanguage(),
                summary,
                qualityScore,
                issues,
                architectureInsights,
                refactoredFiles,
                generatedTests,
                metrics
        );
    }

    protected void analyzeLanguageSpecificIssues(CodeFileDto file, List<CodeIssueDto> issues) {
        // Hook for subclasses (e.g. TypeScript type checks)
    }

    private Map<String, ParsedJsModule> parseAllFiles(List<CodeFileDto> files) {
        Map<String, ParsedJsModule> map = new LinkedHashMap<>();

        for (CodeFileDto file : files) {
            String moduleName = cleanFileName(file.fileName());
            String content = file.content();

            Set<String> importedModules = new HashSet<>();
            Set<String> declaredClasses = new HashSet<>();
            Set<String> instantiatedClasses = new HashSet<>();

            Matcher classMatcher = CLASS_PATTERN.matcher(content);
            while (classMatcher.find()) {
                declaredClasses.add(classMatcher.group(1));
            }

            Matcher importMatcher = IMPORT_FROM_PATTERN.matcher(content);
            while (importMatcher.find()) {
                importedModules.add(extractModuleName(importMatcher.group(1)));
            }

            Matcher reqMatcher = REQUIRE_PATTERN.matcher(content);
            while (reqMatcher.find()) {
                importedModules.add(extractModuleName(reqMatcher.group(1)));
            }

            Matcher newMatcher = NEW_INSTANCE_PATTERN.matcher(content);
            while (newMatcher.find()) {
                instantiatedClasses.add(newMatcher.group(1));
            }

            for (CodeFileDto other : files) {
                String otherName = cleanFileName(other.fileName());
                if (!otherName.equals(moduleName) && content.contains(otherName)) {
                    importedModules.add(otherName);
                }
            }

            map.put(moduleName, new ParsedJsModule(
                    file.fileName(),
                    moduleName,
                    declaredClasses,
                    importedModules,
                    instantiatedClasses,
                    content
            ));
        }

        return map;
    }

    private void analyzeArchitecture(
            Map<String, ParsedJsModule> modules,
            List<ArchitectureInsightDto> insights,
            List<CodeIssueDto> issues
    ) {
        Set<String> processedPairs = new HashSet<>();

        for (ParsedJsModule modA : modules.values()) {
            for (String dep : modA.importedModules()) {
                ParsedJsModule modB = modules.get(dep);
                if (modB == null) {
                    continue;
                }

                String pairKey = modA.moduleName().compareTo(modB.moduleName()) < 0
                        ? modA.moduleName() + "<->" + modB.moduleName()
                        : modB.moduleName() + "<->" + modA.moduleName();

                if (modB.importedModules().contains(modA.moduleName()) && processedPairs.add(pairKey)) {
                    insights.add(new ArchitectureInsightDto(
                            "CIRCULAR_DEPENDENCY",
                            modA.fileName(),
                            modB.fileName(),
                            "Circular module dependency between " + modA.moduleName() + " and " + modB.moduleName(),
                            "Break circular dependency using Dependency Inversion, shared interfaces, or an Event Bus."
                    ));

                    issues.add(new CodeIssueDto(
                            UUID.randomUUID().toString(),
                            modA.fileName(),
                            1,
                            IssueSeverity.CRITICAL,
                            IssueCategory.ARCHITECTURE,
                            "Circular Dependency Detected",
                            "Module '" + modA.moduleName() + "' and '" + modB.moduleName() + "' depend on each other, which can lead to undefined import values at runtime.",
                            "Refactor shared models or invert dependency via function parameters / constructor injection."
                    ));
                }

                for (String clsB : modB.declaredClasses()) {
                    if (modA.instantiatedClasses().contains(clsB)) {
                        insights.add(new ArchitectureInsightDto(
                                "TIGHT_COUPLING",
                                modA.fileName(),
                                modB.fileName(),
                                modA.moduleName() + " directly creates instance of " + clsB + " via 'new' operator.",
                                "Inject " + clsB + " instance as a dependency rather than creating it directly."
                        ));

                        issues.add(new CodeIssueDto(
                                UUID.randomUUID().toString(),
                                modA.fileName(),
                                findFirstLine(modA.content(), "new\\s+" + clsB),
                                IssueSeverity.WARNING,
                                IssueCategory.ARCHITECTURE,
                                "Violation of Dependency Inversion Principle",
                                "Direct instantiation of component " + clsB + " tightly couples modules and hinders unit testing.",
                                "Pass " + clsB + " via constructor parameter."
                        ));
                    }
                }
            }
        }
    }

    private void analyzeSingleFile(CodeFileDto file, List<CodeIssueDto> issues) {
        String[] lines = file.content().split("\\R");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int lineNumber = i + 1;
            String trimmed = line.trim();

            if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue;
            }

            // 'var' usage
            if (VAR_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.CRITICAL,
                        IssueCategory.CLEAN_CODE,
                        "Usage of Deprecated 'var' Keyword",
                        "Variables declared with 'var' have function scope, undergo hoisting, and can lead to subtle bugs.",
                        "Replace 'var' with block-scoped 'const' or 'let'."
                ));
            }

            // Loose equality
            if (LOOSE_EQ_PATTERN.matcher(line).find() && !line.contains("===") && !line.contains("!==")) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.BUG_RISK,
                        "Loose Equality Operator",
                        "Loose equality ('==' or '!=') performs implicit type coercion, leading to unexpected truthiness bugs.",
                        "Use strict equality ('===' or '!==')."
                ));
            }

            // Console output
            if (CONSOLE_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.INFO,
                        IssueCategory.CLEAN_CODE,
                        "Direct Console Logging",
                        "console.log statements left in production code can clutter browser logs or leak sensitive state.",
                        "Use a configurable logging utility or telemetry framework."
                ));
            }

            // Dangerous eval
            if (EVAL_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.CRITICAL,
                        IssueCategory.SECURITY,
                        "Dangerous Dynamic Code Execution (eval)",
                        "Using eval() or new Function() allows arbitrary code execution and poses severe security injection vulnerabilities.",
                        "Refactor logic using structured data parsing (e.g. JSON.parse)."
                ));
            }
        }
    }

    private List<RefactoredFileDto> generateRefactoredFiles(
            List<CodeFileDto> files,
            List<CodeIssueDto> issues,
            Map<String, ParsedJsModule> parsedModules
    ) {
        List<RefactoredFileDto> refactoredList = new ArrayList<>();

        for (CodeFileDto file : files) {
            String content = file.content();
            List<String> changes = new ArrayList<>();

            if (content.contains("var ")) {
                content = content.replaceAll("\\bvar\\b", "const");
                changes.add("Replaced legacy 'var' declarations with block-scoped 'const'");
            }

            if (content.contains(" == ")) {
                content = content.replace(" == ", " === ");
                changes.add("Upgraded loose equality '==' to strict '==='");
            }

            if (content.contains(" != ")) {
                content = content.replace(" != ", " !== ");
                changes.add("Upgraded loose inequality '!=' to strict '!=='");
            }

            if (content.contains("console.log(")) {
                content = content.replaceAll("console\\.log\\((.*?)\\);?", "// [Logger] $1;");
                changes.add("Replaced console.log statements with structured logger comment placeholders");
            }

            if (!changes.isEmpty()) {
                refactoredList.add(new RefactoredFileDto(file.fileName(), content, changes));
            }
        }

        return refactoredList;
    }

    private List<GeneratedTestDto> generateTests(Map<String, ParsedJsModule> modules) {
        List<GeneratedTestDto> tests = new ArrayList<>();

        for (ParsedJsModule module : modules.values()) {
            if (!module.declaredClasses().isEmpty() || module.moduleName().toLowerCase().contains("service")) {
                String testFileName = module.moduleName() + ".test" + getFileExtension();
                StringBuilder testCode = new StringBuilder();

                testCode.append("import { describe, it, beforeEach } from 'node:test';\n")
                        .append("import assert from 'node:assert';\n");

                if (!module.declaredClasses().isEmpty()) {
                    String mainClass = module.declaredClasses().iterator().next();
                    testCode.append("import { ").append(mainClass).append(" } from './").append(module.moduleName()).append("';\n\n");
                    testCode.append("describe('").append(mainClass).append("', () => {\n");
                    testCode.append("  let service;\n\n");
                    testCode.append("  beforeEach(() => {\n");
                    testCode.append("    service = new ").append(mainClass).append("();\n");
                    testCode.append("  });\n\n");
                    testCode.append("  it('should be successfully instantiated', () => {\n");
                    testCode.append("    assert.ok(service);\n");
                    testCode.append("  });\n");
                    testCode.append("});\n");
                } else {
                    testCode.append("\ndescribe('").append(module.moduleName()).append(" Suite', () => {\n");
                    testCode.append("  it('should run module smoke test', () => {\n");
                    testCode.append("    assert.strictEqual(true, true);\n");
                    testCode.append("  });\n");
                    testCode.append("});\n");
                }

                tests.add(new GeneratedTestDto(
                        testFileName,
                        module.fileName(),
                        testCode.toString(),
                        getTestFrameworkName()
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
                "Analyzed %d %s file(s). Found %d issues (%d critical, %d warnings, %d informational) and %d architectural relationships. Overall Code Health Score: %d/100.",
                fileCount, getTargetLanguage().getDisplayName(), issues.size(), criticalCount, warningCount, infoCount, insights.size(), score
        );
    }

    private String cleanFileName(String fileName) {
        return fileName.replace(".ts", "").replace(".tsx", "").replace(".js", "").replace(".jsx", "");
    }

    private String extractModuleName(String importPath) {
        String clean = importPath.trim();
        int slash = clean.lastIndexOf('/');
        if (slash >= 0) {
            clean = clean.substring(slash + 1);
        }
        return clean.replace(".js", "").replace(".ts", "");
    }

    private Integer findFirstLine(String content, String regex) {
        String[] lines = content.split("\\R");
        Pattern pattern = Pattern.compile(regex);
        for (int i = 0; i < lines.length; i++) {
            if (pattern.matcher(lines[i]).find()) {
                return i + 1;
            }
        }
        return 1;
    }

    private record ParsedJsModule(
            String fileName,
            String moduleName,
            Set<String> declaredClasses,
            Set<String> importedModules,
            Set<String> instantiatedClasses,
            String content
    ) {
    }
}
