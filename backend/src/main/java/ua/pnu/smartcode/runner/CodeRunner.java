package ua.pnu.smartcode.runner;

import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

public interface CodeRunner {
    boolean supports(ProgrammingLanguage language);
    ExecutionResponseDto run(ExecutionRequestDto request);
}
