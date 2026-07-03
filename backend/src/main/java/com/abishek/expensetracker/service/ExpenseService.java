package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.InsightResponse;
import com.abishek.expensetracker.dto.MonthTotal;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseService {

    ExpenseResponse create(ExpenseRequest request);

    ExpenseResponse getById(Long id);

    Page<ExpenseResponse> list(ExpenseFilters filters, Pageable pageable);

    ExpenseResponse update(Long id, ExpenseRequest request);

    void delete(Long id);

    MonthlySummaryResponse monthlySummary(int year, int month);

    /** Totals for the last {@code months} months, oldest first, missing months filled with zero. */
    List<MonthTotal> trend(int months);

    List<InsightResponse> insights(int year, int month);

    /** CSV of all expenses matching the filters, newest first. */
    String exportCsv(ExpenseFilters filters);

    record ExpenseFilters(
            Integer year, Integer month, Category category, String q, LocalDate from, LocalDate to) {
    }
}
