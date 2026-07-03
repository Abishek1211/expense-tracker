package com.abishek.expensetracker.service;

import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.model.RecurringExpense;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.repository.RecurringExpenseRepository;
import com.abishek.expensetracker.security.CurrentUserService;
import com.abishek.expensetracker.service.impl.RecurringExpenseServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecurringExpenseServiceImplTest {

    @Mock
    private RecurringExpenseRepository recurringExpenseRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private RecurringExpenseServiceImpl service;

    @Test
    void firstOccurrenceClampsShortMonths() {
        // Day 31 in February resolves to the last day of February.
        LocalDate result = RecurringExpense.firstOccurrenceOnOrAfter(31, LocalDate.of(2026, 2, 10));
        assertThat(result).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void firstOccurrenceRollsToNextMonthWhenDayHasPassed() {
        LocalDate result = RecurringExpense.firstOccurrenceOnOrAfter(5, LocalDate.of(2026, 7, 10));
        assertThat(result).isEqualTo(LocalDate.of(2026, 8, 5));
    }

    @Test
    void materializeCreatesExpenseAndAdvancesNextRun() {
        User user = new User("abi@example.com", "hash", "Abi");
        // Day 1 keeps the expected count date-independent: the 1st of the
        // current month has always passed, so exactly 3 occurrences are due.
        RecurringExpense recurring = new RecurringExpense(
                user, new BigDecimal("649.00"), Category.ENTERTAINMENT, "Streaming", 1,
                LocalDate.now().minusMonths(2).withDayOfMonth(1));
        when(recurringExpenseRepository.findAllByActiveTrueAndNextRunLessThanEqual(any()))
                .thenReturn(List.of(recurring));

        int created = service.materializeDue();

        assertThat(created).isEqualTo(3); // two missed months + current month
        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository, times(3)).save(captor.capture());
        assertThat(captor.getAllValues())
                .allSatisfy(expense -> assertThat(expense.getAmount()).isEqualByComparingTo("649.00"));
        assertThat(recurring.getNextRun()).isAfter(LocalDate.now());
    }
}
