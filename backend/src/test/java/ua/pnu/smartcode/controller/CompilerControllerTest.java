package ua.pnu.smartcode.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.CompilationRequestDto;
import ua.pnu.smartcode.dto.CompilationResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.service.CompilerService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CompilerController.class)
class CompilerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CompilerService compilerService;

    @Test
    void shouldReturnCompilationResult() throws Exception {
        CompilationResponseDto mockResponse = new CompilationResponseDto(
                true,
                ProgrammingLanguage.JAVA,
                "javac 21.0.2",
                45,
                0,
                0,
                List.of(),
                "Build successful"
        );

        when(compilerService.compileCode(any(CompilationRequestDto.class))).thenReturn(mockResponse);

        CompilationRequestDto request = new CompilationRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("Main.java", "public class Main {}"))
        );

        mockMvc.perform(post("/api/v1/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.compilerName").value("javac 21.0.2"))
                .andExpect(jsonPath("$.errorCount").value(0));
    }
}
