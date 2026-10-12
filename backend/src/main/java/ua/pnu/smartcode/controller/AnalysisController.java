package ua.pnu.smartcode.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.service.AnalysisService;

@RestController
@RequestMapping("/api/v1/analyze")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Code Analysis", description = "Endpoints for multi-file static code analysis and architecture review")
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping
    @Operation(summary = "Analyze code files", description = "Performs multi-file architectural and quality analysis on submitted code files")
    public ResponseEntity<AnalysisResponseDto> analyze(@Valid @RequestBody AnalysisRequestDto request) {
        AnalysisResponseDto response = analysisService.analyzeCode(request);
        return ResponseEntity.ok(response);
    }
}
