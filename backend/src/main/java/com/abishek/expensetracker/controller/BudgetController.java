package com.abishek.expensetracker.controller;

import com.abishek.expensetracker.dto.BudgetRequest;
import com.abishek.expensetracker.dto.BudgetResponse;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@Tag(name = "Budgets", description = "Monthly budget limits per category")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    @Operation(summary = "List the current user's category budgets")
    public List<BudgetResponse> list() {
        return budgetService.list();
    }

    @PutMapping("/{category}")
    @Operation(summary = "Create or update the budget for a category")
    public BudgetResponse upsert(@PathVariable Category category, @Valid @RequestBody BudgetRequest request) {
        return budgetService.upsert(category, request);
    }

    @DeleteMapping("/{category}")
    @Operation(summary = "Remove the budget for a category")
    public ResponseEntity<Void> delete(@PathVariable Category category) {
        budgetService.delete(category);
        return ResponseEntity.noContent().build();
    }
}
