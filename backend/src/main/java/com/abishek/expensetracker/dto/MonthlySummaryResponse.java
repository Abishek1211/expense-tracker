package com.abishek.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

public record MonthlySummaryResponse(
        int year,
        int month,
        BigDecimal total,
        List<CategoryTotal> byCategory
) {
}
