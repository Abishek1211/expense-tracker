package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.RecurringExpenseRequest;
import com.abishek.expensetracker.dto.RecurringExpenseResponse;

import java.util.List;

public interface RecurringExpenseService {

    List<RecurringExpenseResponse> list();

    RecurringExpenseResponse create(RecurringExpenseRequest request);

    RecurringExpenseResponse update(Long id, RecurringExpenseRequest request);

    void delete(Long id);

    /** Creates expenses for all due recurring definitions (catch-up included). */
    int materializeDue();
}
