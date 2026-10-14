package ua.pnu.smartcode.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.pnu.smartcode.dto.AnalysisHistoryItemDto;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.service.AnalysisService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analyze")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Code Analysis", description = "Endpoints for multi-file static code analysis, architecture review and audit history")
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping
    @Operation(summary = "Analyze code files", description = "Performs multi-file architectural and quality analysis on submitted code files and saves result to database")
    public ResponseEntity<AnalysisResponseDto> analyze(@Valid @RequestBody AnalysisRequestDto request) {
        AnalysisResponseDto response = analysisService.analyzeCode(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    @Operation(summary = "Get analysis history", description = "Returns a chronological list of previously conducted code audits")
    public ResponseEntity<List<AnalysisHistoryItemDto>> getHistory() {
        return ResponseEntity.ok(analysisService.getHistory());
    }

    @GetMapping("/history/{id}")
    @Operation(summary = "Get analysis by ID", description = "Retrieves full report of a specific past code analysis")
    public ResponseEntity<AnalysisResponseDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(analysisService.getById(id));
    }

    @DeleteMapping("/history/{id}")
    @Operation(summary = "Delete analysis record", description = "Removes a specific analysis report from history")
    public ResponseEntity<Void> deleteById(@PathVariable UUID id) {
        analysisService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
