package ua.pnu.smartcode.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua.pnu.smartcode.compiler.CodeCompiler;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.exception.UnsupportedLanguageException;
import ua.pnu.smartcode.service.CompilerService;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompilerServiceImpl implements CompilerService {

    private final List<CodeCompiler> compilers;

    @Override
    public CompilationResponseDto compileCode(CompilationRequestDto request) {
        log.info("Compiling {} files for language {}", request.files().size(), request.language());

        CodeCompiler compiler = compilers.stream()
                .filter(c -> c.supports(request.language()))
                .findFirst()
                .orElseThrow(() -> new UnsupportedLanguageException(request.language()));

        return compiler.compile(request);
    }
}
