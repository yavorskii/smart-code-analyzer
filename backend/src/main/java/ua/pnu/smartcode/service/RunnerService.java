package ua.pnu.smartcode.service;

import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;

public interface RunnerService {

    ExecutionResponseDto executeCode(ExecutionRequestDto request);
}
