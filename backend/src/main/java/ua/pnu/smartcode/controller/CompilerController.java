package ua.pnu.smartcode.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.service.CompilerService;

@Slf4j
@RestController
@RequestMapping("/api/v1/compile")
@RequiredArgsConstructor
public class CompilerController {

    private final CompilerService compilerService;

    @PostMapping
    public ResponseEntity<CompilationResponseDto> compile(@Valid @RequestBody CompilationRequestDto request) {
        log.info("Received compilation request for language {}", request.language());
        CompilationResponseDto response = compilerService.compileCode(request);
        return ResponseEntity.ok(response);
    }
}
