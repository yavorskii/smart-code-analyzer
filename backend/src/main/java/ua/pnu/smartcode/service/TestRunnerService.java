package ua.pnu.smartcode.service;

import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;

public interface TestRunnerService {

    TestExecutionResponseDto runTests(TestExecutionRequestDto request);
}
