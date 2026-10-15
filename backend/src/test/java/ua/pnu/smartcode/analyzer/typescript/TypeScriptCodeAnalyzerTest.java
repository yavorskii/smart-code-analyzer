package ua.pnu.smartcode.analyzer.typescript;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.IssueCategory;
import ua.pnu.smartcode.model.IssueSeverity;
import ua.pnu.smartcode.model.ProgrammingLanguage;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TypeScriptCodeAnalyzerTest {

    private TypeScriptCodeAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new TypeScriptCodeAnalyzer();
    }

    @Test
    void shouldSupportTypeScriptLanguage() {
        assertTrue(analyzer.supports(ProgrammingLanguage.TYPESCRIPT));
        assertFalse(analyzer.supports(ProgrammingLanguage.JAVA));
    }

    @Test
    void shouldDetectVarLooseEqualityAndAnyType() {
        String code = """
                export class UserService {
                    processUser(data: any) {
                        var status = "pending";
                        if (status == "pending") {
                            console.log("Status matched");
                        }
                    }
                }
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.TYPESCRIPT,
                AnalysisFocus.CLEAN_CODE,
                List.of(new CodeFileDto("UserService.ts", code))
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertNotNull(response);
        assertEquals(ProgrammingLanguage.TYPESCRIPT, response.language());

        assertTrue(response.issues().stream()
                .anyMatch(i -> "Usage of Deprecated 'var' Keyword".equals(i.title()) && i.severity() == IssueSeverity.CRITICAL));
        assertTrue(response.issues().stream()
                .anyMatch(i -> "Loose Equality Operator".equals(i.title())));
        assertTrue(response.issues().stream()
                .anyMatch(i -> "Unsafe 'any' Type Annotation".equals(i.title())));

        assertFalse(response.refactoredFiles().isEmpty());
        assertTrue(response.refactoredFiles().get(0).refactoredContent().contains("const status"));
        assertTrue(response.refactoredFiles().get(0).refactoredContent().contains("==="));
    }

    @Test
    void shouldDetectCircularModuleImportsInTypeScript() {
        String fileA = """
                import { ComponentB } from './ComponentB';

                export class ComponentA {
                    private b = new ComponentB();
                }
                """;

        String fileB = """
                import { ComponentA } from './ComponentA';

                export class ComponentB {
                    private a = new ComponentA();
                }
                """;

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.TYPESCRIPT,
                AnalysisFocus.ARCHITECTURE,
                List.of(
                        new CodeFileDto("ComponentA.ts", fileA),
                        new CodeFileDto("ComponentB.ts", fileB)
                )
        );

        AnalysisResponseDto response = analyzer.analyze(request);

        assertTrue(response.architectureInsights().stream()
                .anyMatch(i -> "CIRCULAR_DEPENDENCY".equals(i.relationshipType())));
        assertFalse(response.generatedTests().isEmpty());
        assertEquals("Vitest", response.generatedTests().get(0).framework());
    }
}
