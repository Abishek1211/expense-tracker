package com.abishek.expensetracker.exception;

public class ExpenseNotFoundException extends RuntimeException {

    public ExpenseNotFoundException(Long id) {
        super("Expense with id %d not found".formatted(id));
    }
}
