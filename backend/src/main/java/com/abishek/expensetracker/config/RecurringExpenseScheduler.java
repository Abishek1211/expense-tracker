package com.abishek.expensetracker.config;

import com.abishek.expensetracker.service.RecurringExpenseService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurringExpenseScheduler {

    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseScheduler(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    // On startup too, so occurrences missed while the service slept (Render
    // free tier spins down) are caught up as soon as it wakes.
    @Order(10)
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        recurringExpenseService.materializeDue();
    }

    @Scheduled(cron = "0 15 0 * * *")
    public void daily() {
        recurringExpenseService.materializeDue();
    }
}
