package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.BudgetRequest;
import com.abishek.expensetracker.dto.BudgetResponse;
import com.abishek.expensetracker.model.Budget;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.BudgetRepository;
import com.abishek.expensetracker.security.CurrentUserService;
import com.abishek.expensetracker.service.impl.BudgetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceImplTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private BudgetServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("abi@example.com", "hash", "Abi");
        ReflectionTestUtils.setField(user, "id", 42L);
        when(currentUserService.requireCurrentUser()).thenReturn(user);
    }

    @Test
    void upsertCreatesBudgetWhenMissing() {
        when(budgetRepository.findByUserIdAndCategory(42L, Category.FOOD)).thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BudgetResponse response = service.upsert(Category.FOOD, new BudgetRequest(new BigDecimal("8000")));

        assertThat(response.category()).isEqualTo(Category.FOOD);
        assertThat(response.amount()).isEqualByComparingTo("8000");
    }

    @Test
    void upsertUpdatesExistingBudget() {
        Budget existing = new Budget(user, Category.FOOD, new BigDecimal("5000"));
        when(budgetRepository.findByUserIdAndCategory(42L, Category.FOOD)).thenReturn(Optional.of(existing));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BudgetResponse response = service.upsert(Category.FOOD, new BudgetRequest(new BigDecimal("9500")));

        assertThat(response.amount()).isEqualByComparingTo("9500");
        assertThat(existing.getAmount()).isEqualByComparingTo("9500");
    }

    @Test
    void deleteIsIdempotentWhenBudgetMissing() {
        when(budgetRepository.findByUserIdAndCategory(42L, Category.OTHER)).thenReturn(Optional.empty());

        service.delete(Category.OTHER); // must not throw

        verify(budgetRepository).findByUserIdAndCategory(42L, Category.OTHER);
    }
}
