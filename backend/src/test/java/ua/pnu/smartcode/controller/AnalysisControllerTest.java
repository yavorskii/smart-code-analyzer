package ua.pnu.smartcode.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ua.pnu.smartcode.dto.AnalysisHistoryItemDto;
import ua.pnu.smartcode.dto.AnalysisRequestDto;
import ua.pnu.smartcode.dto.AnalysisResponseDto;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.model.AnalysisFocus;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.service.AnalysisService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalysisController.class)
class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnalysisService analysisService;

    @Test
    void shouldReturnAnalysisResponseWhenRequestIsValid() throws Exception {
        AnalysisResponseDto mockResponse = new AnalysisResponseDto(
                "req-123",
                ProgrammingLanguage.JAVA,
                "Analysis complete",
                95,
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );

        when(analysisService.analyzeCode(any(AnalysisRequestDto.class))).thenReturn(mockResponse);

        AnalysisRequestDto request = new AnalysisRequestDto(
                ProgrammingLanguage.JAVA,
                AnalysisFocus.CLEAN_CODE,
                List.of(new CodeFileDto("Main.java", "public class Main {}"))
        );

        mockMvc.perform(post("/api/v1/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("req-123"))
                .andExpect(jsonPath("$.qualityScore").value(95));
    }

    @Test
    void shouldReturnBadRequestWhenFilesListIsEmpty() throws Exception {
        String invalidJson = """
                {
                    "language": "JAVA",
                    "focus": "CLEAN_CODE",
                    "files": []
                }
                """;

        mockMvc.perform(post("/api/v1/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void shouldReturnHistoryList() throws Exception {
        UUID recordId = UUID.randomUUID();
        AnalysisHistoryItemDto item = new AnalysisHistoryItemDto(
                recordId,
                ProgrammingLanguage.JAVA,
                AnalysisFocus.ARCHITECTURE,
                88,
                "Sample summary",
                2,
                3,
                1,
                1,
                1,
                1,
                Instant.now()
        );

        when(analysisService.getHistory()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/analyze/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(recordId.toString()))
                .andExpect(jsonPath("$[0].qualityScore").value(88));
    }

    @Test
    void shouldDeleteHistoryItem() throws Exception {
        UUID recordId = UUID.randomUUID();
        doNothing().when(analysisService).deleteById(recordId);

        mockMvc.perform(delete("/api/v1/analyze/history/" + recordId))
                .andExpect(status().isNoContent());
    }
}
