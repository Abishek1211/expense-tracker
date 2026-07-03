package com.abishek.expensetracker.service.impl;

import com.abishek.expensetracker.dto.RecurringExpenseRequest;
import com.abishek.expensetracker.dto.RecurringExpenseResponse;
import com.abishek.expensetracker.exception.ExpenseNotFoundException;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.model.RecurringExpense;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.repository.RecurringExpenseRepository;
import com.abishek.expensetracker.security.CurrentUserService;
import com.abishek.expensetracker.service.RecurringExpenseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RecurringExpenseServiceImpl implements RecurringExpenseService {

    private static final Logger log = LoggerFactory.getLogger(RecurringExpenseServiceImpl.class);

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ExpenseRepository expenseRepository;
    private final CurrentUserService currentUserService;

    public RecurringExpenseServiceImpl(
            RecurringExpenseRepository recurringExpenseRepository,
            ExpenseRepository expenseRepository,
            CurrentUserService currentUserService) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.expenseRepository = expenseRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpenseResponse> list() {
        User user = currentUserService.requireCurrentUser();
        return recurringExpenseRepository.findAllByUserIdOrderByDayOfMonth(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public RecurringExpenseResponse create(RecurringExpenseRequest request) {
        User user = currentUserService.requireCurrentUser();
        LocalDate nextRun = RecurringExpense.firstOccurrenceOnOrAfter(request.dayOfMonth(), LocalDate.now());
        RecurringExpense recurring = new RecurringExpense(
                user, request.amount(), request.category(), request.note(), request.dayOfMonth(), nextRun);
        if (request.active() != null) {
            recurring.setActive(request.active());
        }
        return toResponse(recurringExpenseRepository.save(recurring));
    }

    @Override
    public RecurringExpenseResponse update(Long id, RecurringExpenseRequest request) {
        User user = currentUserService.requireCurrentUser();
        RecurringExpense recurring = recurringExpenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ExpenseNotFoundException(id));
        recurring.setAmount(request.amount());
        recurring.setCategory(request.category());
        recurring.setNote(request.note());
        if (recurring.getDayOfMonth() != request.dayOfMonth()) {
            recurring.setDayOfMonth(request.dayOfMonth());
            recurring.setNextRun(
                    RecurringExpense.firstOccurrenceOnOrAfter(request.dayOfMonth(), LocalDate.now()));
        }
        if (request.active() != null) {
            recurring.setActive(request.active());
        }
        return toResponse(recurringExpenseRepository.save(recurring));
    }

    @Override
    public void delete(Long id) {
        User user = currentUserService.requireCurrentUser();
        RecurringExpense recurring = recurringExpenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ExpenseNotFoundException(id));
        recurringExpenseRepository.delete(recurring);
    }

    @Override
    public int materializeDue() {
        LocalDate today = LocalDate.now();
        List<RecurringExpense> due =
                recurringExpenseRepository.findAllByActiveTrueAndNextRunLessThanEqual(today);
        int created = 0;
        for (RecurringExpense recurring : due) {
            // Catch-up loop: creates every missed occurrence (e.g. after downtime).
            while (!recurring.getNextRun().isAfter(today)) {
                expenseRepository.save(new Expense(
                        recurring.getAmount(),
                        recurring.getCategory(),
                        recurring.getNextRun(),
                        recurring.getNote(),
                        recurring.getUser()));
                recurring.advanceNextRun();
                created++;
            }
            recurringExpenseRepository.save(recurring);
        }
        if (created > 0) {
            log.info("Materialized {} recurring expense occurrence(s)", created);
        }
        return created;
    }

    private RecurringExpenseResponse toResponse(RecurringExpense recurring) {
        return new RecurringExpenseResponse(
                recurring.getId(),
                recurring.getAmount(),
                recurring.getCategory(),
                recurring.getNote(),
                recurring.getDayOfMonth(),
                recurring.getNextRun(),
                recurring.isActive());
    }
}
