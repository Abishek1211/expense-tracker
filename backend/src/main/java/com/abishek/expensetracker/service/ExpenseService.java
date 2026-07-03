package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpenseService {

    ExpenseResponse create(ExpenseRequest request);

    ExpenseResponse getById(Long id);

    Page<ExpenseResponse> list(Integer year, Integer month, Category category, Pageable pageable);

    ExpenseResponse update(Long id, ExpenseRequest request);

    void delete(Long id);

    MonthlySummaryResponse monthlySummary(int year, int month);
}
