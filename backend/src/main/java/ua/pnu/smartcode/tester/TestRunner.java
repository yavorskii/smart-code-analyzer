package ua.pnu.smartcode.tester;

import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

public interface TestRunner {
    boolean supports(ProgrammingLanguage language);
    TestExecutionResponseDto runTests(TestExecutionRequestDto request);
}
