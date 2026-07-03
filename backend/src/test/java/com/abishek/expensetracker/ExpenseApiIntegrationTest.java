package com.abishek.expensetracker;

import com.abishek.expensetracker.dto.AuthResponse;
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
import org.springframework.http.HttpHeaders;
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

    private static String token;
    private static Long createdId;

    private static final String BASE = "/api/v1/expenses";
    private static final String AUTH = "/api/v1/auth";

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private <T> HttpEntity<T> authorized(T body) {
        return new HttpEntity<>(body, authHeaders());
    }

    @Test
    @Order(1)
    void expensesRequireAuthentication() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(BASE, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("status").asInt()).isEqualTo(401);
    }

    @Test
    @Order(2)
    void registerReturns201WithToken() {
        Map<String, Object> request = Map.of(
                "email", "abi@example.com",
                "password", "super-secret-1",
                "displayName", "Abi");

        ResponseEntity<AuthResponse> response =
                restTemplate.postForEntity(AUTH + "/register", request, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isNotBlank();
        assertThat(response.getBody().email()).isEqualTo("abi@example.com");
    }

    @Test
    @Order(3)
    void duplicateRegistrationReturns409() {
        Map<String, Object> request = Map.of(
                "email", "abi@example.com",
                "password", "super-secret-1",
                "displayName", "Abi");

        ResponseEntity<String> response =
                restTemplate.postForEntity(AUTH + "/register", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @Order(4)
    void loginReturnsToken() {
        Map<String, Object> request = Map.of("email", "abi@example.com", "password", "super-secret-1");

        ResponseEntity<AuthResponse> response =
                restTemplate.postForEntity(AUTH + "/login", request, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        token = response.getBody().token();
    }

    @Test
    @Order(5)
    void wrongPasswordReturns401() {
        Map<String, Object> request = Map.of("email", "abi@example.com", "password", "wrong-password");

        ResponseEntity<String> response =
                restTemplate.postForEntity(AUTH + "/login", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(6)
    void createReturns201WithLocationHeader() {
        Map<String, Object> request = Map.of(
                "amount", 25.99,
                "category", "FOOD",
                "date", "2026-07-01",
                "note", "Groceries");

        ResponseEntity<ExpenseResponse> response =
                restTemplate.postForEntity(BASE, authorized(request), ExpenseResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().category()).isEqualTo(Category.FOOD);
        createdId = response.getBody().id();
    }

    @Test
    @Order(7)
    void createRejectsInvalidPayloadWith400AndFieldErrors() throws Exception {
        Map<String, Object> request = Map.of(
                "amount", -5,
                "date", "2026-07-01");

        ResponseEntity<String> response =
                restTemplate.postForEntity(BASE, authorized(request), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("status").asInt()).isEqualTo(400);
        assertThat(body.get("path").asText()).isEqualTo(BASE);
        assertThat(body.get("fieldErrors").has("amount")).isTrue();
        assertThat(body.get("fieldErrors").has("category")).isTrue();
    }

    @Test
    @Order(8)
    void listReturnsPagedResult() throws Exception {
        ResponseEntity<String> response = restTemplate.exchange(
                BASE + "?year=2026&month=7&page=0&size=10",
                HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("content").isArray()).isTrue();
        assertThat(body.get("content").size()).isGreaterThanOrEqualTo(1);
        assertThat(body.get("page").get("totalElements").asLong()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @Order(9)
    void otherUsersCannotSeeOrTouchTheExpense() throws Exception {
        Map<String, Object> register = Map.of(
                "email", "intruder@example.com",
                "password", "super-secret-2",
                "displayName", "Intruder");
        ResponseEntity<AuthResponse> registered =
                restTemplate.postForEntity(AUTH + "/register", register, AuthResponse.class);
        assertThat(registered.getBody()).isNotNull();

        HttpHeaders intruderHeaders = new HttpHeaders();
        intruderHeaders.setBearerAuth(registered.getBody().token());

        ResponseEntity<String> get = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.GET, new HttpEntity<>(intruderHeaders), String.class);
        assertThat(get.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<String> list = restTemplate.exchange(
                BASE, HttpMethod.GET, new HttpEntity<>(intruderHeaders), String.class);
        JsonNode body = objectMapper.readTree(list.getBody());
        assertThat(body.get("page").get("totalElements").asLong()).isZero();

        ResponseEntity<Void> delete = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.DELETE, new HttpEntity<>(intruderHeaders), Void.class);
        assertThat(delete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Order(10)
    void updateModifiesExpense() {
        Map<String, Object> request = Map.of(
                "amount", 30.00,
                "category", "SHOPPING",
                "date", "2026-07-02",
                "note", "Updated note");

        ResponseEntity<ExpenseResponse> response = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.PUT, authorized(request), ExpenseResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().category()).isEqualTo(Category.SHOPPING);
        assertThat(response.getBody().note()).isEqualTo("Updated note");
    }

    @Test
    @Order(11)
    void summaryGroupsTotalsByCategory() throws Exception {
        ResponseEntity<String> response = restTemplate.exchange(
                BASE + "/summary?year=2026&month=7",
                HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("year").asInt()).isEqualTo(2026);
        assertThat(body.get("month").asInt()).isEqualTo(7);
        assertThat(body.get("byCategory").isArray()).isTrue();
        assertThat(body.get("total").decimalValue()).isPositive();
    }

    @Test
    @Order(12)
    void deleteReturns204ThenGetReturns404() throws Exception {
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.DELETE, new HttpEntity<>(authHeaders()), Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> getResponse = restTemplate.exchange(
                BASE + "/" + createdId, HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        JsonNode body = objectMapper.readTree(getResponse.getBody());
        assertThat(body.get("status").asInt()).isEqualTo(404);
        assertThat(body.get("error").asText()).isEqualTo("Not Found");
    }

    @Test
    @Order(13)
    void budgetsCanBeUpsertedListedAndDeleted() throws Exception {
        ResponseEntity<String> upsert = restTemplate.exchange(
                "/api/v1/budgets/FOOD", HttpMethod.PUT,
                authorized(Map.of("amount", 8000)), String.class);
        assertThat(upsert.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> list = restTemplate.exchange(
                "/api/v1/budgets", HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
        JsonNode budgets = objectMapper.readTree(list.getBody());
        assertThat(budgets.isArray()).isTrue();
        assertThat(budgets.size()).isEqualTo(1);
        assertThat(budgets.get(0).get("category").asText()).isEqualTo("FOOD");

        ResponseEntity<Void> delete = restTemplate.exchange(
                "/api/v1/budgets/FOOD", HttpMethod.DELETE, new HttpEntity<>(authHeaders()), Void.class);
        assertThat(delete.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Order(14)
    void trendReturnsRequestedNumberOfMonths() throws Exception {
        ResponseEntity<String> response = restTemplate.exchange(
                BASE + "/trend?months=6", HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.isArray()).isTrue();
        assertThat(body.size()).isEqualTo(6);
    }

    @Test
    @Order(15)
    void exportReturnsCsvAttachment() {
        ResponseEntity<String> response = restTemplate.exchange(
                BASE + "/export", HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).hasToString("text/csv");
        assertThat(response.getBody()).startsWith("id,date,category,amount,note,createdAt");
    }

    @Test
    @Order(16)
    void recurringExpenseCanBeCreatedAndListed() throws Exception {
        Map<String, Object> request = Map.of(
                "amount", 649,
                "category", "ENTERTAINMENT",
                "note", "Streaming subscription",
                "dayOfMonth", 5);

        ResponseEntity<String> create =
                restTemplate.postForEntity("/api/v1/recurring", authorized(request), String.class);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode created = objectMapper.readTree(create.getBody());
        assertThat(created.get("nextRun").asText()).isNotBlank();
        assertThat(created.get("active").asBoolean()).isTrue();

        ResponseEntity<String> list = restTemplate.exchange(
                "/api/v1/recurring", HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
        JsonNode items = objectMapper.readTree(list.getBody());
        assertThat(items.size()).isEqualTo(1);
    }
}
