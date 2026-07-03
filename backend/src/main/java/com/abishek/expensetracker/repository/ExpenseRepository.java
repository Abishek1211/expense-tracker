package com.abishek.expensetracker.repository;

import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    interface CategoryTotalView {
        Category getCategory();

        BigDecimal getTotal();
    }

    @Query("""
            select e.category as category, sum(e.amount) as total
            from Expense e
            where e.date >= :start and e.date < :end
            group by e.category
            order by sum(e.amount) desc
            """)
    List<CategoryTotalView> totalsByCategory(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
