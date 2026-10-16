package ua.pnu.smartcode.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ua.pnu.smartcode.dto.CodeFileDto;
import ua.pnu.smartcode.dto.GeneratedTestDto;
import ua.pnu.smartcode.dto.TestExecutionRequestDto;
import ua.pnu.smartcode.dto.TestExecutionResponseDto;
import ua.pnu.smartcode.model.ProgrammingLanguage;
import ua.pnu.smartcode.service.TestRunnerService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TestRunnerController.class)
class TestRunnerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TestRunnerService testRunnerService;

    @Test
    void shouldReturnTestExecutionResults() throws Exception {
        TestExecutionResponseDto mockResponse = new TestExecutionResponseDto(
                true,
                ProgrammingLanguage.JAVA,
                1,
                1,
                0,
                0,
                55,
                "JUnit 5",
                "JUnit output",
                "",
                "All tests passed"
        );

        when(testRunnerService.runTests(any(TestExecutionRequestDto.class))).thenReturn(mockResponse);

        TestExecutionRequestDto request = new TestExecutionRequestDto(
                ProgrammingLanguage.JAVA,
                List.of(new CodeFileDto("Main.java", "public class Main {}")),
                List.of(new GeneratedTestDto("MainTest.java", "Main.java", "class MainTest {}", "JUnit 5")),
                null
        );

        mockMvc.perform(post("/api/v1/test/run")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.passedCount").value(1))
                .andExpect(jsonPath("$.failedCount").value(0))
                .andExpect(jsonPath("$.framework").value("JUnit 5"));
    }
}
