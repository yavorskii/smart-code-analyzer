package ua.pnu.smartcode.analyzer.javascript;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CodeIssueDto;
import ua.pnu.smartcode.model.IssueCategory;
import ua.pnu.smartcode.model.IssueSeverity;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;
import java.util.UUID;

@Component
public class JavaScriptCodeAnalyzer extends AbstractEcmaScriptAnalyzer {

    @Override
    protected ProgrammingLanguage getTargetLanguage() {
        return ProgrammingLanguage.JAVASCRIPT;
    }

    @Override
    protected String getTestFrameworkName() {
        return "Jest";
    }

    @Override
    protected String getFileExtension() {
        return ".js";
    }

    @Override
    protected void analyzeLanguageSpecificIssues(CodeFileDto file, List<CodeIssueDto> issues) {
        String content = file.content();
        if (!content.contains("'use strict'") && !content.contains("\"use strict\"") && !content.contains("import ") && !content.contains("export ")) {
            issues.add(new CodeIssueDto(
                    UUID.randomUUID().toString(),
                    file.fileName(),
                    1,
                    IssueSeverity.INFO,
                    IssueCategory.CLEAN_CODE,
                    "Missing Strict Mode Directive",
                    "Script does not enable strict mode ('use strict'). Strict mode catches silent errors and prevents accidental globals.",
                    "Add 'use strict'; at the top of the file or migrate to ES modules."
            ));
        }
    }
}
