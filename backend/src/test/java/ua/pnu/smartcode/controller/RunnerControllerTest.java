package ua.pnu.smartcode.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.ExecutionRequestDto;
import ua.pnu.smartcode.dto.ExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.service.RunnerService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RunnerController.class)
class RunnerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RunnerService runnerService;

    @Test
    void shouldReturnExecutionResult() throws Exception {
        ExecutionResponseDto mockResponse = new ExecutionResponseDto(
                true,
                ProgrammingLanguage.JAVA,
                0,
                "Hello World!\n",
                "",
                120,
                "java -cp out OrderService",
                false
        );

        when(runnerService.executeCode(any(ExecutionRequestDto.class))).thenReturn(mockResponse);

        ExecutionRequestDto request = new ExecutionRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("OrderService.java", "public class OrderService {}")),
                "OrderService.java",
                null
        );

        mockMvc.perform(post("/api/v1/run")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.exitCode").value(0))
                .andExpect(jsonPath("$.stdout").value("Hello World!\n"))
                .andExpect(jsonPath("$.timedOut").value(false));
    }
}
