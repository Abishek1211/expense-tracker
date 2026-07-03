package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.exception.ExpenseNotFoundException;
import com.abishek.expensetracker.mapper.ExpenseMapper;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.service.impl.ExpenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceImplTest {

    @Mock
    private ExpenseRepository expenseRepository;

    private ExpenseServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ExpenseServiceImpl(expenseRepository, new ExpenseMapper());
    }

    @Test
    void createSavesAndReturnsResponse() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("42.50"), Category.FOOD, LocalDate.of(2026, 7, 1), "Lunch");
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExpenseResponse response = service.create(request);

        assertThat(response.amount()).isEqualByComparingTo("42.50");
        assertThat(response.category()).isEqualTo(Category.FOOD);
        assertThat(response.note()).isEqualTo("Lunch");
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(expenseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ExpenseNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateModifiesExistingExpense() {
        Expense existing = new Expense(
                new BigDecimal("10.00"), Category.TRANSPORT, LocalDate.of(2026, 6, 15), "Bus");
        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("15.75"), Category.FOOD, LocalDate.of(2026, 6, 16), "Dinner");
        ExpenseResponse response = service.update(1L, request);

        assertThat(response.amount()).isEqualByComparingTo("15.75");
        assertThat(response.category()).isEqualTo(Category.FOOD);
        assertThat(response.date()).isEqualTo(LocalDate.of(2026, 6, 16));
        assertThat(response.note()).isEqualTo("Dinner");
    }

    @Test
    void deleteThrowsWhenMissing() {
        when(expenseRepository.existsById(7L)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOf(ExpenseNotFoundException.class);
        verify(expenseRepository, never()).deleteById(7L);
    }

    @Test
    void deleteRemovesExistingExpense() {
        when(expenseRepository.existsById(3L)).thenReturn(true);

        service.delete(3L);

        verify(expenseRepository).deleteById(3L);
    }

    @Test
    void monthlySummaryAggregatesCategoryTotals() {
        when(expenseRepository.totalsByCategory(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1)))
                .thenReturn(List.of(
                        categoryTotal(Category.FOOD, "120.00"),
                        categoryTotal(Category.TRANSPORT, "45.50")));

        MonthlySummaryResponse summary = service.monthlySummary(2026, 7);

        assertThat(summary.total()).isEqualByComparingTo("165.50");
        assertThat(summary.byCategory()).hasSize(2);
        assertThat(summary.byCategory().getFirst().category()).isEqualTo(Category.FOOD);
    }

    @Test
    void monthlySummaryReturnsZeroForEmptyMonth() {
        when(expenseRepository.totalsByCategory(any(), any())).thenReturn(List.of());

        MonthlySummaryResponse summary = service.monthlySummary(2026, 1);

        assertThat(summary.total()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.byCategory()).isEmpty();
    }

    private ExpenseRepository.CategoryTotalView categoryTotal(Category category, String total) {
        return new ExpenseRepository.CategoryTotalView() {
            @Override
            public Category getCategory() {
                return category;
            }

            @Override
            public BigDecimal getTotal() {
                return new BigDecimal(total);
            }
        };
    }
}
