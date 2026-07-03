package com.abishek.expensetracker.service.impl;

import com.abishek.expensetracker.dto.BudgetRequest;
import com.abishek.expensetracker.dto.BudgetResponse;
import com.abishek.expensetracker.model.Budget;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.BudgetRepository;
import com.abishek.expensetracker.security.CurrentUserService;
import com.abishek.expensetracker.service.BudgetService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final CurrentUserService currentUserService;

    public BudgetServiceImpl(BudgetRepository budgetRepository, CurrentUserService currentUserService) {
        this.budgetRepository = budgetRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> list() {
        User user = currentUserService.requireCurrentUser();
        return budgetRepository.findAllByUserIdOrderByCategory(user.getId()).stream()
                .map(budget -> new BudgetResponse(budget.getCategory(), budget.getAmount()))
                .toList();
    }

    @Override
    public BudgetResponse upsert(Category category, BudgetRequest request) {
        User user = currentUserService.requireCurrentUser();
        Budget budget = budgetRepository.findByUserIdAndCategory(user.getId(), category)
                .orElseGet(() -> new Budget(user, category, request.amount()));
        budget.setAmount(request.amount());
        Budget saved = budgetRepository.save(budget);
        return new BudgetResponse(saved.getCategory(), saved.getAmount());
    }

    @Override
    public void delete(Category category) {
        User user = currentUserService.requireCurrentUser();
        budgetRepository.findByUserIdAndCategory(user.getId(), category)
                .ifPresent(budgetRepository::delete);
    }
}
