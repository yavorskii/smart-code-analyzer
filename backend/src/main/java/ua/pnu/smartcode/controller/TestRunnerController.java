package ua.pnu.smartcode.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.service.TestRunnerService;

@Slf4j
@RestController
@RequestMapping("/api/v1/test/run")
@RequiredArgsConstructor
public class TestRunnerController {

    private final TestRunnerService testRunnerService;

    @PostMapping
    public ResponseEntity<TestExecutionResponseDto> runTests(@Valid @RequestBody TestExecutionRequestDto request) {
        log.info("Received request to run {} tests for language {}", request.tests().size(), request.language());
        TestExecutionResponseDto response = testRunnerService.runTests(request);
        return ResponseEntity.ok(response);
    }
}
