package ua.pnu.smartcode.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.exception.UnsupportedLanguageException;
import ua.pnu.smartcode.runner.CodeRunner;
import ua.pnu.smartcode.service.RunnerService;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RunnerServiceImpl implements RunnerService {

    private final List<CodeRunner> runners;

    @Override
    public ExecutionResponseDto executeCode(ExecutionRequestDto request) {
        log.info("Executing code with {} files for language {}", request.files().size(), request.language());

        CodeRunner runner = runners.stream()
                .filter(r -> r.supports(request.language()))
                .findFirst()
                .orElseThrow(() -> new UnsupportedLanguageException(request.language()));

        return runner.run(request);
    }
}
