package com.abishek.expensetracker.mapper;

import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.model.Expense;
import org.springframework.stereotype.Component;

@Component
public class ExpenseMapper {

    public Expense toEntity(ExpenseRequest request) {
        return new Expense(request.amount(), request.category(), request.date(), request.note());
    }

    public void updateEntity(Expense expense, ExpenseRequest request) {
        expense.setAmount(request.amount());
        expense.setCategory(request.category());
        expense.setDate(request.date());
        expense.setNote(request.note());
    }

    public ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getCategory(),
                expense.getDate(),
                expense.getNote(),
                expense.getCreatedAt()
        );
    }
}
