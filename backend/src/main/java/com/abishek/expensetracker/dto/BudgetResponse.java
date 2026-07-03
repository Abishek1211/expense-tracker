package com.abishek.expensetracker.dto;

import com.abishek.expensetracker.model.Category;

import java.math.BigDecimal;

public record BudgetResponse(Category category, BigDecimal amount) {
}
