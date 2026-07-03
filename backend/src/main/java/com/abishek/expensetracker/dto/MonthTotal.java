package com.abishek.expensetracker.dto;

import java.math.BigDecimal;

public record MonthTotal(int year, int month, BigDecimal total) {
}
