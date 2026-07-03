package com.abishek.expensetracker.repository;

import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.YearMonth;

public final class ExpenseSpecifications {

    private ExpenseSpecifications() {
    }

    public static Specification<Expense> belongsToUser(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Expense> hasCategory(Category category) {
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    public static Specification<Expense> inMonth(YearMonth yearMonth) {
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.plusMonths(1).atDay(1);
        return (root, query, cb) -> cb.and(
                cb.greaterThanOrEqualTo(root.get("date"), start),
                cb.lessThan(root.get("date"), end)
        );
    }

    public static Specification<Expense> noteContains(String text) {
        String pattern = "%" + text.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("note")), pattern);
    }

    public static Specification<Expense> onOrAfter(LocalDate date) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("date"), date);
    }

    public static Specification<Expense> onOrBefore(LocalDate date) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("date"), date);
    }
}
