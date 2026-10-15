package ua.pnu.smartcode.analyzer.python;

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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PythonCodeAnalyzer implements LanguageAnalyzer {

    private static final Pattern CLASS_PATTERN = Pattern.compile("^\\s*class\\s+([A-Za-z0-9_]+)", Pattern.MULTILINE);
    private static final Pattern DEF_PATTERN = Pattern.compile("^\\s*def\\s+([A-Za-z0-9_]+)\\s*\\(([^)]*)\\)", Pattern.MULTILINE);
    private static final Pattern IMPORT_FROM_PATTERN = Pattern.compile("^\\s*from\\s+([A-Za-z0-9_.]+)\\s+import\\s+(.+)", Pattern.MULTILINE);
    private static final Pattern IMPORT_MODULE_PATTERN = Pattern.compile("^\\s*import\\s+([A-Za-z0-9_., ]+)", Pattern.MULTILINE);
    private static final Pattern PRINT_PATTERN = Pattern.compile("\\bprint\\s*\\(");
    private static final Pattern BARE_EXCEPT_PATTERN = Pattern.compile("^\\s*except(\\s*:|\\s+Exception\\s*:)", Pattern.MULTILINE);
    private static final Pattern GLOBAL_PATTERN = Pattern.compile("^\\s*global\\s+([A-Za-z0-9_]+)", Pattern.MULTILINE);
    private static final Pattern MUTABLE_DEFAULT_PATTERN = Pattern.compile("=\\s*(\\[\\]|\\{\\})");
    private static final Pattern CAMEL_CASE_FUNC_PATTERN = Pattern.compile("^[a-z]+[A-Z][a-zA-Z0-9]*$");

    @Override
    public boolean supports(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.PYTHON;
    }

    @Override
    public AnalysisResponseDto analyze(AnalysisRequestDto request) {
        String requestId = UUID.randomUUID().toString();
        List<CodeFileDto> files = request.files();

        Map<String, ParsedPythonModule> parsedModules = parseAllFiles(files);

        List<CodeIssueDto> issues = new ArrayList<>();
        List<ArchitectureInsightDto> architectureInsights = new ArrayList<>();

        analyzeArchitecture(parsedModules, architectureInsights, issues);

        for (CodeFileDto file : files) {
            analyzeSingleFile(file, issues);
        }

        List<RefactoredFileDto> refactoredFiles = generateRefactoredFiles(files, issues, parsedModules);
        List<GeneratedTestDto> generatedTests = generateTests(parsedModules);

        int qualityScore = calculateQualityScore(issues);
        String summary = buildSummary(files.size(), issues, architectureInsights, qualityScore);

        return new AnalysisResponseDto(
                requestId,
                ProgrammingLanguage.PYTHON,
                summary,
                qualityScore,
                issues,
                architectureInsights,
                refactoredFiles,
                generatedTests
        );
    }

    private Map<String, ParsedPythonModule> parseAllFiles(List<CodeFileDto> files) {
        Map<String, ParsedPythonModule> map = new LinkedHashMap<>();

        for (CodeFileDto file : files) {
            String moduleName = file.fileName().replace(".py", "");
            String content = file.content();

            Set<String> importedModules = new HashSet<>();
            Set<String> declaredClasses = new HashSet<>();
            Set<String> instantiatedClasses = new HashSet<>();

            Matcher classMatcher = CLASS_PATTERN.matcher(content);
            while (classMatcher.find()) {
                declaredClasses.add(classMatcher.group(1));
            }

            Matcher fromMatcher = IMPORT_FROM_PATTERN.matcher(content);
            while (fromMatcher.find()) {
                String fromMod = fromMatcher.group(1);
                importedModules.add(fromMod.replace(".", ""));
            }

            Matcher importMatcher = IMPORT_MODULE_PATTERN.matcher(content);
            while (importMatcher.find()) {
                String[] mods = importMatcher.group(1).split(",");
                for (String m : mods) {
                    importedModules.add(m.trim().replace(".", ""));
                }
            }

            for (CodeFileDto other : files) {
                String otherModule = other.fileName().replace(".py", "");
                if (!otherModule.equals(moduleName) && content.contains(otherModule)) {
                    importedModules.add(otherModule);
                }
            }

            // Pattern for class instantiation: e.g. PaymentService()
            Pattern instPattern = Pattern.compile("\\b([A-Z][A-Za-z0-9_]*)\\s*\\(");
            Matcher instMatcher = instPattern.matcher(content);
            while (instMatcher.find()) {
                instantiatedClasses.add(instMatcher.group(1));
            }

            map.put(moduleName, new ParsedPythonModule(
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
            Map<String, ParsedPythonModule> modules,
            List<ArchitectureInsightDto> insights,
            List<CodeIssueDto> issues
    ) {
        Set<String> processedPairs = new HashSet<>();

        for (ParsedPythonModule modA : modules.values()) {
            for (String dep : modA.importedModules()) {
                ParsedPythonModule modB = modules.get(dep);
                if (modB == null) {
                    continue;
                }

                String pairKey = modA.moduleName().compareTo(modB.moduleName()) < 0
                        ? modA.moduleName() + "<->" + modB.moduleName()
                        : modB.moduleName() + "<->" + modA.moduleName();

                if (modB.importedModules().contains(modA.moduleName()) && processedPairs.add(pairKey)) {
                    insights.add(new ArchitectureInsightDto(
                            "CIRCULAR_IMPORT",
                            modA.fileName(),
                            modB.fileName(),
                            "Circular import detected between " + modA.moduleName() + " and " + modB.moduleName(),
                            "Break circular import cycle by decoupling components, using dependency injection, or moving shared logic to a separate module."
                    ));

                    issues.add(new CodeIssueDto(
                            UUID.randomUUID().toString(),
                            modA.fileName(),
                            1,
                            IssueSeverity.CRITICAL,
                            IssueCategory.ARCHITECTURE,
                            "Circular Import Detected",
                            "Module '" + modA.moduleName() + "' imports '" + modB.moduleName() + "', which mutually imports '" + modA.moduleName() + "'. This causes ImportError or partial initialization in Python.",
                            "Extract shared abstractions or pass dependencies into functions/constructors."
                    ));
                }

                // Check tight coupling
                for (String clsB : modB.declaredClasses()) {
                    if (modA.instantiatedClasses().contains(clsB)) {
                        insights.add(new ArchitectureInsightDto(
                            "TIGHT_COUPLING",
                            modA.fileName(),
                            modB.fileName(),
                            modA.moduleName() + " directly instantiates " + clsB + " from " + modB.moduleName(),
                            "Inject " + clsB + " instance as a dependency rather than creating it internally."
                        ));

                        issues.add(new CodeIssueDto(
                            UUID.randomUUID().toString(),
                            modA.fileName(),
                            findFirstLine(modA.content(), clsB + "\\s*\\("),
                            IssueSeverity.WARNING,
                            IssueCategory.ARCHITECTURE,
                            "Tight Coupling with " + clsB,
                            "Direct instantiation of class '" + clsB + "' makes testing and substitution difficult.",
                            "Use dependency injection via __init__ parameter."
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

            // Wildcard import
            if (line.matches("^\\s*from\\s+[A-Za-z0-9_.]+\\s+import\\s+\\*.*")) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.CLEAN_CODE,
                        "Wildcard Import (PEP 8)",
                        "Wildcard import 'from ... import *' pollutes the current namespace and hides dependencies.",
                        "Specify explicit imports or import the module directly."
                ));
            }

            // Bare except
            if (BARE_EXCEPT_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.BUG_RISK,
                        "Catching Generic or Bare Exception",
                        "Catching bare except or Exception masks syntax errors, system exits (KeyboardInterrupt), and unexpected bugs.",
                        "Catch specific exception types (e.g. ValueError, KeyError) or re-raise."
                ));
            }

            // Print statement in business code
            if (PRINT_PATTERN.matcher(line).find() && !line.trim().startsWith("#")) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.INFO,
                        IssueCategory.CLEAN_CODE,
                        "Direct Standard Output Print",
                        "Using print() bypasses Python logging configuration and log levels.",
                        "Use standard library 'logging.getLogger(__name__)' with appropriate log levels."
                ));
            }

            // Global keyword
            if (GLOBAL_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.CLEAN_CODE,
                        "Global Variable Mutation",
                        "Using the 'global' keyword introduces mutable global state and breaks module encapsulation.",
                        "Pass state explicitly via function arguments or encapsulate in a class."
                ));
            }

            // Mutable default argument
            if (line.trim().startsWith("def ") && MUTABLE_DEFAULT_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.CRITICAL,
                        IssueCategory.BUG_RISK,
                        "Mutable Default Argument",
                        "Default argument is initialized to a mutable object ([] or {}). In Python, default arguments are evaluated once at function definition, leading to shared state bugs.",
                        "Set default value to None (e.g. param=None) and initialize inside function body."
                ));
            }

            // PEP 8 naming for functions
            Matcher defMatcher = DEF_PATTERN.matcher(line);
            if (defMatcher.find()) {
                String funcName = defMatcher.group(1);
                if (!funcName.startsWith("__") && CAMEL_CASE_FUNC_PATTERN.matcher(funcName).matches()) {
                    issues.add(new CodeIssueDto(
                            UUID.randomUUID().toString(),
                            file.fileName(),
                            lineNumber,
                            IssueSeverity.INFO,
                            IssueCategory.CLEAN_CODE,
                            "Function Name Violates PEP 8",
                            "Function '" + funcName + "' uses camelCase instead of snake_case.",
                            "Rename function to snake_case in accordance with PEP 8."
                    ));
                }
            }
        }
    }

    private List<RefactoredFileDto> generateRefactoredFiles(
            List<CodeFileDto> files,
            List<CodeIssueDto> issues,
            Map<String, ParsedPythonModule> parsedModules
    ) {
        List<RefactoredFileDto> refactoredList = new ArrayList<>();

        for (CodeFileDto file : files) {
            String content = file.content();
            List<String> changes = new ArrayList<>();

            if (content.contains("print(")) {
                content = "import logging\n\nlogger = logging.getLogger(__name__)\n\n" + content;
                content = content.replaceAll("print\\((.*?)\\)", "logger.info($1)");
                changes.add("Replaced print statements with standard Python logging calls");
            }

            if (MUTABLE_DEFAULT_PATTERN.matcher(content).find()) {
                content = content.replaceAll("=\\s*\\[\\]", "= None");
                content = content.replaceAll("=\\s*\\{\\}", "= None");
                changes.add("Replaced mutable default arguments ([] or {}) with None pattern");
            }

            if (!changes.isEmpty()) {
                refactoredList.add(new RefactoredFileDto(file.fileName(), content, changes));
            }
        }

        return refactoredList;
    }

    private List<GeneratedTestDto> generateTests(Map<String, ParsedPythonModule> modules) {
        List<GeneratedTestDto> tests = new ArrayList<>();

        for (ParsedPythonModule module : modules.values()) {
            if (!module.declaredClasses().isEmpty() || module.moduleName().contains("service")) {
                String testFileName = "test_" + module.moduleName() + ".py";
                StringBuilder testCode = new StringBuilder();

                testCode.append("import pytest\n");
                testCode.append("from ").append(module.moduleName()).append(" import ");

                if (!module.declaredClasses().isEmpty()) {
                    testCode.append(String.join(", ", module.declaredClasses())).append("\n\n");
                    for (String cls : module.declaredClasses()) {
                        testCode.append("class Test").append(cls).append(":\n\n");
                        testCode.append("    @pytest.fixture\n");
                        testCode.append("    def target(self):\n");
                        testCode.append("        return ").append(cls).append("()\n\n");
                        testCode.append("    def test_initialization(self, target):\n");
                        testCode.append("        assert target is not None\n\n");
                    }
                } else {
                    testCode.append("*\n\n");
                    testCode.append("def test_module_smoke():\n");
                    testCode.append("    assert True\n");
                }

                tests.add(new GeneratedTestDto(
                        testFileName,
                        module.fileName(),
                        testCode.toString(),
                        "pytest"
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
                "Analyzed %d Python file(s). Found %d issues (%d critical, %d warnings, %d informational) and %d architectural relationships. Overall Code Health Score: %d/100.",
                fileCount, issues.size(), criticalCount, warningCount, infoCount, insights.size(), score
        );
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

    private record ParsedPythonModule(
            String fileName,
            String moduleName,
            Set<String> declaredClasses,
            Set<String> importedModules,
            Set<String> instantiatedClasses,
            String content
    ) {
    }
}
