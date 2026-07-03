package com.abishek.expensetracker.repository;

import com.abishek.expensetracker.model.Budget;
import com.abishek.expensetracker.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findAllByUserIdOrderByCategory(Long userId);

    Optional<Budget> findByUserIdAndCategory(Long userId, Category category);
}
