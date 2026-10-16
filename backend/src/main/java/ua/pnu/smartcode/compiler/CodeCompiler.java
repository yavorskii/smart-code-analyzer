package ua.pnu.smartcode.compiler;

import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;

public interface CodeCompiler {

    boolean supports(ProgrammingLanguage language);

    CompilationResponseDto compile(CompilationRequestDto request);
}
