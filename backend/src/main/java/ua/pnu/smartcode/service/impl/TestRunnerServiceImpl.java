package ua.pnu.smartcode.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.exception.UnsupportedLanguageException;
import ua.pnu.smartcode.service.TestRunnerService;
import ua.pnu.smartcode.tester.TestRunner;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TestRunnerServiceImpl implements TestRunnerService {

    private final List<TestRunner> testRunners;

    @Override
    public TestExecutionResponseDto runTests(TestExecutionRequestDto request) {
        log.info("Running {} tests for language {}", request.tests().size(), request.language());

        TestRunner runner = testRunners.stream()
                .filter(r -> r.supports(request.language()))
                .findFirst()
                .orElseThrow(() -> new UnsupportedLanguageException(request.language()));

        return runner.runTests(request);
    }
}
