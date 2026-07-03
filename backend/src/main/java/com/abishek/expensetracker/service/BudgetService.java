package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.BudgetRequest;
import com.abishek.expensetracker.dto.BudgetResponse;
import com.abishek.expensetracker.model.Category;

import java.util.List;

public interface BudgetService {

    List<BudgetResponse> list();

    BudgetResponse upsert(Category category, BudgetRequest request);

    void delete(Category category);
}
