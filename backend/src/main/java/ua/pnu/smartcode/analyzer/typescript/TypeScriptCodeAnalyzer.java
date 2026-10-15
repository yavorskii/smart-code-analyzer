package ua.pnu.smartcode.analyzer.typescript;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.analyzer.javascript.AbstractEcmaScriptAnalyzer;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CodeIssueDto;
import ua.pnu.smartcode.model.IssueCategory;
import ua.pnu.smartcode.model.IssueSeverity;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class TypeScriptCodeAnalyzer extends AbstractEcmaScriptAnalyzer {

    private static final Pattern ANY_TYPE_PATTERN = Pattern.compile("(:\\s*any\\b|as\\s+any\\b|<any>)");
    private static final Pattern NON_NULL_ASSERTION_PATTERN = Pattern.compile("[a-zA-Z0-9_]+\\s*![.;\\[\\]]");

    @Override
    protected ProgrammingLanguage getTargetLanguage() {
        return ProgrammingLanguage.TYPESCRIPT;
    }

    @Override
    protected String getTestFrameworkName() {
        return "Vitest";
    }

    @Override
    protected String getFileExtension() {
        return ".ts";
    }

    @Override
    protected void analyzeLanguageSpecificIssues(CodeFileDto file, List<CodeIssueDto> issues) {
        String[] lines = file.content().split("\\R");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int lineNumber = i + 1;
            String trimmed = line.trim();

            if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue;
            }

            if (ANY_TYPE_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.WARNING,
                        IssueCategory.CLEAN_CODE,
                        "Unsafe 'any' Type Annotation",
                        "Using the 'any' type disables the TypeScript compiler's static type checker for this variable.",
                        "Specify an explicit interface/type or use 'unknown' with type narrowing guards."
                ));
            }

            if (NON_NULL_ASSERTION_PATTERN.matcher(line).find()) {
                issues.add(new CodeIssueDto(
                        UUID.randomUUID().toString(),
                        file.fileName(),
                        lineNumber,
                        IssueSeverity.INFO,
                        IssueCategory.BUG_RISK,
                        "Non-Null Assertion Operator (!)",
                        "Non-null assertion suppresses TypeScript compiler null checks without providing runtime null safety.",
                        "Use optional chaining (?.) or an explicit if-check."
                ));
            }
        }
    }
}
