package com.abishek.expensetracker.controller;

import com.abishek.expensetracker.dto.RecurringExpenseRequest;
import com.abishek.expensetracker.dto.RecurringExpenseResponse;
import com.abishek.expensetracker.service.RecurringExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recurring")
@Tag(name = "Recurring expenses", description = "Monthly recurring expense definitions (rent, subscriptions, …)")
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseController(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    @GetMapping
    @Operation(summary = "List the current user's recurring expenses")
    public List<RecurringExpenseResponse> list() {
        return recurringExpenseService.list();
    }

    @PostMapping
    @Operation(summary = "Create a recurring expense definition")
    public ResponseEntity<RecurringExpenseResponse> create(
            @Valid @RequestBody RecurringExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recurringExpenseService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a recurring expense definition")
    public RecurringExpenseResponse update(
            @PathVariable Long id, @Valid @RequestBody RecurringExpenseRequest request) {
        return recurringExpenseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a recurring expense definition")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recurringExpenseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
