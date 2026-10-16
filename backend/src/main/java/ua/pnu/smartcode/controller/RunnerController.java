package ua.pnu.smartcode.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.service.RunnerService;

@Slf4j
@RestController
@RequestMapping("/api/v1/run")
@RequiredArgsConstructor
public class RunnerController {

    private final RunnerService runnerService;

    @PostMapping
    public ResponseEntity<ExecutionResponseDto> run(@Valid @RequestBody ExecutionRequestDto request) {
        log.info("Received execution request for language {}", request.language());
        ExecutionResponseDto response = runnerService.executeCode(request);
        return ResponseEntity.ok(response);
    }
}
