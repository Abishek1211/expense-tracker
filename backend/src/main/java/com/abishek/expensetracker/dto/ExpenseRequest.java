package com.abishek.expensetracker.dto;

import com.abishek.expensetracker.model.Category;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be greater than zero")
        @Digits(integer = 10, fraction = 2, message = "Amount must have at most 2 decimal places")
        BigDecimal amount,

        @NotNull(message = "Category is required")
        Category category,

        @NotNull(message = "Date is required")
        LocalDate date,

        @Size(max = 500, message = "Note must be at most 500 characters")
        String note
) {
}
