package com.abishek.expensetracker.dto;

import com.abishek.expensetracker.model.Category;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringExpenseResponse(
        Long id,
        BigDecimal amount,
        Category category,
        String note,
        int dayOfMonth,
        LocalDate nextRun,
        boolean active
) {
}
