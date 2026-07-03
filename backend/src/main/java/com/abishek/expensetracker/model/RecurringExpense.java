package com.abishek.expensetracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;

@Entity
@Table(name = "recurring_expenses")
public class RecurringExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(length = 500)
    private String note;

    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    @Column(name = "next_run", nullable = false)
    private LocalDate nextRun;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RecurringExpense() {
        // required by JPA
    }

    public RecurringExpense(User user, BigDecimal amount, Category category, String note, int dayOfMonth,
                            LocalDate nextRun) {
        this.user = user;
        this.amount = amount;
        this.category = category;
        this.note = note;
        this.dayOfMonth = dayOfMonth;
        this.nextRun = nextRun;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /** First occurrence on or after the given date, clamped for short months. */
    public static LocalDate firstOccurrenceOnOrAfter(int dayOfMonth, LocalDate date) {
        YearMonth yearMonth = YearMonth.from(date);
        LocalDate candidate = yearMonth.atDay(Math.min(dayOfMonth, yearMonth.lengthOfMonth()));
        if (candidate.isBefore(date)) {
            YearMonth next = yearMonth.plusMonths(1);
            candidate = next.atDay(Math.min(dayOfMonth, next.lengthOfMonth()));
        }
        return candidate;
    }

    /** Moves nextRun forward one month, honoring the configured day of month. */
    public void advanceNextRun() {
        YearMonth next = YearMonth.from(nextRun).plusMonths(1);
        this.nextRun = next.atDay(Math.min(dayOfMonth, next.lengthOfMonth()));
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public int getDayOfMonth() {
        return dayOfMonth;
    }

    public void setDayOfMonth(int dayOfMonth) {
        this.dayOfMonth = dayOfMonth;
    }

    public LocalDate getNextRun() {
        return nextRun;
    }

    public void setNextRun(LocalDate nextRun) {
        this.nextRun = nextRun;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
