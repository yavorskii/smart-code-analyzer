package ua.pnu.smartcode.metrics;

import org.springframework.stereotype.Component;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CodeMetricsSummaryDto;
import ua.pnu.smartcode.dto.FileMetricsDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CodeMetricsCalculator {

    private static final Pattern C_STYLE_DECISION_PATTERN = Pattern.compile(
            "\\b(if|else\\s+if|for|while|do|case|catch)\\b|(&&|\\|\\|)|(\\?)"
    );

    private static final Pattern PYTHON_DECISION_PATTERN = Pattern.compile(
            "\\b(if|elif|for|while|except)\\b|\\b(and|or)\\b"
    );

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\\b[A-Za-z_][A-Za-z0-9_]*\\b");

    public CodeMetricsSummaryDto calculateMetrics(List<CodeFileDto> files, ProgrammingLanguage language) {
        if (files == null || files.isEmpty()) {
            return new CodeMetricsSummaryDto(
                    0, 0, 0, 0.0, 0, 0, 0, 100, "A", List.of()
            );
        }

        List<FileMetricsDto> fileMetricsList = new ArrayList<>();
        int totalLines = 0;
        int totalSourceLines = 0;
        int totalCommentLines = 0;
        int totalCc = 0;
        int maxCc = 0;
        int totalCognitive = 0;
        int totalMi = 0;

        for (CodeFileDto file : files) {
            FileMetricsDto fm = calculateFileMetrics(file, language);
            fileMetricsList.add(fm);

            totalLines += fm.totalLines();
            totalSourceLines += fm.sourceLines();
            totalCommentLines += fm.commentLines();
            totalCc += fm.cyclomaticComplexity();
            maxCc = Math.max(maxCc, fm.cyclomaticComplexity());
            totalCognitive += fm.cognitiveComplexity();
            totalMi += fm.maintainabilityIndex();
        }

        double avgCommentRatio = totalLines > 0
                ? Math.round(((double) totalCommentLines / totalLines * 100.0) * 10.0) / 10.0
                : 0.0;

        int avgCc = Math.round((float) totalCc / files.size());
        int overallMi = Math.round((float) totalMi / files.size());
        String overallRating = determineMaintainabilityRating(overallMi);

        return new CodeMetricsSummaryDto(
                totalLines,
                totalSourceLines,
                totalCommentLines,
                avgCommentRatio,
                avgCc,
                maxCc,
                totalCognitive,
                overallMi,
                overallRating,
                fileMetricsList
        );
    }

    public FileMetricsDto calculateFileMetrics(CodeFileDto file, ProgrammingLanguage language) {
        String content = file.content();
        String[] lines = content.split("\\R", -1);
        int totalLines = lines.length;

        int sourceLines = 0;
        int commentLines = 0;
        boolean inBlockComment = false;
        boolean isPython = language == ProgrammingLanguage.PYTHON;

        for (String rawLine : lines) {
            String trimmed = rawLine.trim();

            if (trimmed.isEmpty()) {
                continue;
            }

            if (isPython) {
                if (trimmed.startsWith("#")) {
                    commentLines++;
                    continue;
                }
                if (trimmed.startsWith("\"\"\"") || trimmed.startsWith("'''")) {
                    commentLines++;
                    if ((trimmed.endsWith("\"\"\"") || trimmed.endsWith("'''")) && trimmed.length() > 3) {
                        continue;
                    }
                    inBlockComment = !inBlockComment;
                    continue;
                }
                if (inBlockComment) {
                    commentLines++;
                    if (trimmed.contains("\"\"\"") || trimmed.contains("'''")) {
                        inBlockComment = false;
                    }
                    continue;
                }
                sourceLines++;
            } else {
                if (inBlockComment) {
                    commentLines++;
                    if (trimmed.contains("*/")) {
                        inBlockComment = false;
                    }
                    continue;
                }
                if (trimmed.startsWith("/*")) {
                    commentLines++;
                    if (!trimmed.contains("*/")) {
                        inBlockComment = true;
                    }
                    continue;
                }
                if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
                    commentLines++;
                    continue;
                }
                sourceLines++;
            }
        }

        double commentRatio = totalLines > 0
                ? Math.round(((double) commentLines / totalLines * 100.0) * 10.0) / 10.0
                : 0.0;

        int cyclomaticComplexity = calculateCyclomaticComplexity(content, isPython);
        int cognitiveComplexity = calculateCognitiveComplexity(lines, isPython);
        int maintainabilityIndex = calculateMaintainabilityIndex(content, sourceLines, cyclomaticComplexity);

        String complexityRating = determineComplexityRating(cyclomaticComplexity);
        String maintainabilityRating = determineMaintainabilityRating(maintainabilityIndex);

        return new FileMetricsDto(
                file.fileName(),
                totalLines,
                sourceLines,
                commentLines,
                commentRatio,
                cyclomaticComplexity,
                cognitiveComplexity,
                maintainabilityIndex,
                complexityRating,
                maintainabilityRating
        );
    }

    private int calculateCyclomaticComplexity(String content, boolean isPython) {
        int complexity = 1;
        Pattern pattern = isPython ? PYTHON_DECISION_PATTERN : C_STYLE_DECISION_PATTERN;
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            complexity++;
        }
        return complexity;
    }

    private int calculateCognitiveComplexity(String[] lines, boolean isPython) {
        int cognitive = 0;
        int nesting = 0;

        Pattern structurePattern = isPython
                ? Pattern.compile("^\\s*(if|elif|for|while|except)\\b")
                : Pattern.compile("\\b(if|else\\s+if|for|while|catch)\\b");

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("//") || line.startsWith("#") || line.startsWith("*")) {
                continue;
            }

            if (isPython) {
                int indent = 0;
                while (indent < rawLine.length() && (rawLine.charAt(indent) == ' ' || rawLine.charAt(indent) == '\t')) {
                    indent += (rawLine.charAt(indent) == '\t' ? 4 : 1);
                }
                nesting = Math.max(0, indent / 4);

                if (structurePattern.matcher(line).find()) {
                    cognitive += (1 + nesting);
                }
                if (line.contains(" and ") || line.contains(" or ")) {
                    cognitive++;
                }
            } else {
                if (structurePattern.matcher(line).find()) {
                    cognitive += (1 + nesting);
                }
                if (line.contains("&&") || line.contains("||")) {
                    cognitive++;
                }
                if (line.contains("?")) {
                    cognitive++;
                }

                for (char c : line.toCharArray()) {
                    if (c == '{') {
                        nesting++;
                    } else if (c == '}') {
                        nesting = Math.max(0, nesting - 1);
                    }
                }
            }
        }

        return Math.max(1, cognitive);
    }

    private int calculateMaintainabilityIndex(String content, int sourceLines, int cyclomaticComplexity) {
        int loc = Math.max(1, sourceLines);

        Set<String> uniqueTokens = new HashSet<>();
        Matcher matcher = TOKEN_PATTERN.matcher(content);
        while (matcher.find()) {
            uniqueTokens.add(matcher.group());
        }
        int distinctTokens = Math.max(2, uniqueTokens.size());

        // Approximate Halstead Volume
        double halsteadVolume = Math.max(1.0, loc * 4.2 * Math.log(distinctTokens));

        // Classic SEI Maintainability Index formula normalized to 0-100 scale
        double rawMi = 171.0
                - 5.2 * Math.log(halsteadVolume)
                - 0.23 * cyclomaticComplexity
                - 16.2 * Math.log(loc);

        int normalizedMi = (int) Math.round((rawMi / 171.0) * 100.0);
        return Math.max(0, Math.min(100, normalizedMi));
    }

    private String determineComplexityRating(int cc) {
        if (cc <= 10) return "LOW";
        if (cc <= 20) return "MODERATE";
        if (cc <= 35) return "HIGH";
        return "VERY_HIGH";
    }

    private String determineMaintainabilityRating(int mi) {
        if (mi >= 85) return "A";
        if (mi >= 65) return "B";
        if (mi >= 50) return "C";
        return "D";
    }
}
