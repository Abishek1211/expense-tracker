package com.abishek.expensetracker.dto;

import com.abishek.expensetracker.model.Category;

import java.math.BigDecimal;

public record CategoryTotal(Category category, BigDecimal total) {
}
