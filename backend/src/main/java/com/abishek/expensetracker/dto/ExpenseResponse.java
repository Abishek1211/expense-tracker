package com.abishek.expensetracker.dto;

import com.abishek.expensetracker.model.Category;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ExpenseResponse(
        Long id,
        BigDecimal amount,
        Category category,
        LocalDate date,
        String note,
        Instant createdAt
) {
}
