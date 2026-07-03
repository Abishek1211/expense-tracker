package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.exception.ExpenseNotFoundException;
import com.abishek.expensetracker.mapper.ExpenseMapper;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.security.CurrentUserService;
import com.abishek.expensetracker.service.impl.ExpenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceImplTest {

    private static final long USER_ID = 42L;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CurrentUserService currentUserService;

    private User user;
    private ExpenseServiceImpl service;

    @BeforeEach
    void setUp() {
        user = new User("abi@example.com", "hash", "Abi");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        when(currentUserService.requireCurrentUser()).thenReturn(user);
        service = new ExpenseServiceImpl(expenseRepository, new ExpenseMapper(), currentUserService);
    }

    @Test
    void createSavesExpenseForCurrentUser() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("42.50"), Category.FOOD, LocalDate.of(2026, 7, 1), "Lunch");
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExpenseResponse response = service.create(request);

        assertThat(response.amount()).isEqualByComparingTo("42.50");
        assertThat(response.category()).isEqualTo(Category.FOOD);
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    void getByIdThrowsWhenNotOwnedOrMissing() {
        when(expenseRepository.findByIdAndUserId(99L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ExpenseNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateModifiesOwnedExpense() {
        Expense existing = new Expense(
                new BigDecimal("10.00"), Category.TRANSPORT, LocalDate.of(2026, 6, 15), "Bus", user);
        when(expenseRepository.findByIdAndUserId(1L, USER_ID)).thenReturn(Optional.of(existing));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("15.75"), Category.FOOD, LocalDate.of(2026, 6, 16), "Dinner");
        ExpenseResponse response = service.update(1L, request);

        assertThat(response.amount()).isEqualByComparingTo("15.75");
        assertThat(response.category()).isEqualTo(Category.FOOD);
        assertThat(response.note()).isEqualTo("Dinner");
    }

    @Test
    void deleteThrowsWhenNotOwnedOrMissing() {
        when(expenseRepository.existsByIdAndUserId(7L, USER_ID)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOf(ExpenseNotFoundException.class);
        verify(expenseRepository, never()).deleteById(7L);
    }

    @Test
    void deleteRemovesOwnedExpense() {
        when(expenseRepository.existsByIdAndUserId(3L, USER_ID)).thenReturn(true);

        service.delete(3L);

        verify(expenseRepository).deleteById(3L);
    }

    @Test
    void monthlySummaryAggregatesCurrentUsersTotals() {
        when(expenseRepository.totalsByCategory(
                USER_ID, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1)))
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
        when(expenseRepository.totalsByCategory(eq(USER_ID), any(), any())).thenReturn(List.of());

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
