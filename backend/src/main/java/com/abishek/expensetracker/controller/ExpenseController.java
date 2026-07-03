package com.abishek.expensetracker.controller;

import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.InsightResponse;
import com.abishek.expensetracker.dto.MonthTotal;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.service.ExpenseService;
import com.abishek.expensetracker.service.ExpenseService.ExpenseFilters;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expenses", description = "CRUD operations, summaries, trends, and insights for expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    @Operation(summary = "List expenses with optional month, category, text, and date-range filters")
    public Page<ExpenseResponse> list(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return expenseService.list(new ExpenseFilters(year, month, category, q, from, to), pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single expense by id")
    public ExpenseResponse getById(@PathVariable Long id) {
        return expenseService.getById(id);
    }

    @PostMapping
    @Operation(summary = "Create a new expense")
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody ExpenseRequest request) {
        ExpenseResponse created = expenseService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing expense")
    public ExpenseResponse update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return expenseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an expense")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    @Operation(summary = "Monthly totals grouped by category")
    public MonthlySummaryResponse summary(@RequestParam int year, @RequestParam int month) {
        return expenseService.monthlySummary(year, month);
    }

    @GetMapping("/trend")
    @Operation(summary = "Monthly spending totals for the last N months (default 6)")
    public List<MonthTotal> trend(@RequestParam(defaultValue = "6") int months) {
        return expenseService.trend(months);
    }

    @GetMapping("/insights")
    @Operation(summary = "Human-readable spending insights for a month vs the previous one")
    public List<InsightResponse> insights(@RequestParam int year, @RequestParam int month) {
        return expenseService.insights(year, month);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @Operation(summary = "Export the filtered expenses as CSV")
    public ResponseEntity<String> export(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String csv = expenseService.exportCsv(new ExpenseFilters(year, month, category, q, from, to));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"expenses.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
