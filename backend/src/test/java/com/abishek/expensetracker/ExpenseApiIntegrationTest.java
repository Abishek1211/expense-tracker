package com.abishek.expensetracker;

import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.model.Category;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExpenseApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private static Long createdId;

    private static final String BASE = "/api/v1/expenses";

    @Test
    @Order(1)
    void createReturns201WithLocationHeader() {
        Map<String, Object> request = Map.of(
                "amount", 25.99,
                "category", "FOOD",
                "date", "2026-07-01",
                "note", "Groceries");

        ResponseEntity<ExpenseResponse> response =
                restTemplate.postForEntity(BASE, request, ExpenseResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().category()).isEqualTo(Category.FOOD);
        createdId = response.getBody().id();
    }

    @Test
    @Order(2)
    void createRejectsInvalidPayloadWith400AndFieldErrors() throws Exception {
        Map<String, Object> request = Map.of(
                "amount", -5,
                "date", "2026-07-01");

        ResponseEntity<String> response = restTemplate.postForEntity(BASE, request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("status").asInt()).isEqualTo(400);
        assertThat(body.get("path").asText()).isEqualTo(BASE);
        assertThat(body.get("fieldErrors").has("amount")).isTrue();
        assertThat(body.get("fieldErrors").has("category")).isTrue();
    }

    @Test
    @Order(3)
    void listReturnsPagedResult() throws Exception {
        ResponseEntity<String> response =
                restTemplate.getForEntity(BASE + "?year=2026&month=7&page=0&size=10", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("content").isArray()).isTrue();
        assertThat(body.get("content").size()).isGreaterThanOrEqualTo(1);
        assertThat(body.get("page").get("totalElements").asLong()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @Order(4)
    void updateModifiesExpense() {
        Map<String, Object> request = Map.of(
                "amount", 30.00,
                "category", "SHOPPING",
                "date", "2026-07-02",
                "note", "Updated note");

        ResponseEntity<ExpenseResponse> response = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.PUT, new HttpEntity<>(request), ExpenseResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().category()).isEqualTo(Category.SHOPPING);
        assertThat(response.getBody().note()).isEqualTo("Updated note");
    }

    @Test
    @Order(5)
    void summaryGroupsTotalsByCategory() throws Exception {
        ResponseEntity<String> response =
                restTemplate.getForEntity(BASE + "/summary?year=2026&month=7", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("year").asInt()).isEqualTo(2026);
        assertThat(body.get("month").asInt()).isEqualTo(7);
        assertThat(body.get("byCategory").isArray()).isTrue();
        assertThat(body.get("total").decimalValue()).isPositive();
    }

    @Test
    @Order(6)
    void deleteReturns204ThenGetReturns404() throws Exception {
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.DELETE, HttpEntity.EMPTY, Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> getResponse =
                restTemplate.getForEntity(BASE + "/" + createdId, String.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        JsonNode body = objectMapper.readTree(getResponse.getBody());
        assertThat(body.get("status").asInt()).isEqualTo(404);
        assertThat(body.get("error").asText()).isEqualTo("Not Found");
    }
}
