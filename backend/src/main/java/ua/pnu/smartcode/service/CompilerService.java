package ua.pnu.smartcode.service;

import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;

public interface CompilerService {

    CompilationResponseDto compileCode(CompilationRequestDto request);
}
