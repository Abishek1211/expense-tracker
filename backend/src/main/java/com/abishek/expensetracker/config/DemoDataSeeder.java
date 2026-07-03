package com.abishek.expensetracker.config;

import com.abishek.expensetracker.model.Budget;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.model.RecurringExpense;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.BudgetRepository;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.repository.RecurringExpenseRepository;
import com.abishek.expensetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Seeds a demo account with six months of realistic data so visitors can try
 * the app without registering. Runs on startup; expenses are regenerated each
 * time so the dashboard always shows recent months. Disable with
 * app.demo.enabled=false.
 */
@Component
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataSeeder {

    public static final String DEMO_EMAIL = "demo@expensetracker.app";
    public static final String DEMO_PASSWORD = "demo-password-123";

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private record SeedItem(Category category, String note, int min, int max, double perMonth) {
    }

    private static final List<SeedItem> SEED_ITEMS = List.of(
            new SeedItem(Category.FOOD, "Groceries", 400, 1200, 4),
            new SeedItem(Category.FOOD, "Lunch out", 150, 450, 5),
            new SeedItem(Category.FOOD, "Coffee", 80, 250, 6),
            new SeedItem(Category.TRANSPORT, "Metro card top-up", 200, 500, 2),
            new SeedItem(Category.TRANSPORT, "Cab ride", 150, 600, 3),
            new SeedItem(Category.UTILITIES, "Electricity bill", 900, 1800, 1),
            new SeedItem(Category.UTILITIES, "Mobile recharge", 299, 599, 1),
            new SeedItem(Category.ENTERTAINMENT, "Movie night", 300, 800, 1.5),
            new SeedItem(Category.ENTERTAINMENT, "Gaming", 200, 700, 1),
            new SeedItem(Category.HEALTH, "Pharmacy", 150, 700, 1.5),
            new SeedItem(Category.SHOPPING, "Online shopping", 500, 3500, 2),
            new SeedItem(Category.OTHER, "Miscellaneous", 100, 900, 1.5));

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            BudgetRepository budgetRepository,
            RecurringExpenseRepository recurringExpenseRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.budgetRepository = budgetRepository;
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Order(1)
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        User demo = userRepository.findByEmailIgnoreCase(DEMO_EMAIL)
                .orElseGet(() -> userRepository.save(
                        new User(DEMO_EMAIL, passwordEncoder.encode(DEMO_PASSWORD), "Demo User")));

        // Regenerate expenses so the demo dashboard always covers recent months.
        expenseRepository.deleteByUserId(demo.getId());

        Random random = new Random(demo.getId() + YearMonth.now().hashCode());
        LocalDate today = LocalDate.now();
        YearMonth current = YearMonth.now();

        for (int back = 5; back >= 0; back--) {
            YearMonth ym = current.minusMonths(back);
            int lastDay = ym.equals(current) ? today.getDayOfMonth() : ym.lengthOfMonth();

            // Rent lands on the 1st of every month.
            expenseRepository.save(new Expense(
                    new BigDecimal(15000), Category.HOUSING, ym.atDay(1), "Rent", demo));

            for (SeedItem item : SEED_ITEMS) {
                int occurrences = (int) Math.floor(item.perMonth())
                        + (random.nextDouble() < item.perMonth() % 1 ? 1 : 0);
                for (int i = 0; i < occurrences; i++) {
                    int day = 1 + random.nextInt(lastDay);
                    int amount = item.min() + random.nextInt(item.max() - item.min() + 1);
                    expenseRepository.save(new Expense(
                            new BigDecimal(amount), item.category(), ym.atDay(day), item.note(), demo));
                }
            }
        }

        seedBudgets(demo);
        seedRecurring(demo, today);
        log.info("Demo account ready: {} (see SECURITY.md for the password)", DEMO_EMAIL);
    }

    private void seedBudgets(User demo) {
        Map<Category, Integer> budgets = Map.of(
                Category.FOOD, 8000,
                Category.TRANSPORT, 3000,
                Category.ENTERTAINMENT, 2500,
                Category.SHOPPING, 6000,
                Category.UTILITIES, 3000,
                Category.HOUSING, 16000);
        budgets.forEach((category, amount) -> {
            Budget budget = budgetRepository.findByUserIdAndCategory(demo.getId(), category)
                    .orElseGet(() -> new Budget(demo, category, new BigDecimal(amount)));
            budget.setAmount(new BigDecimal(amount));
            budgetRepository.save(budget);
        });
    }

    private void seedRecurring(User demo, LocalDate today) {
        if (!recurringExpenseRepository.findAllByUserIdOrderByDayOfMonth(demo.getId()).isEmpty()) {
            return;
        }
        // nextRun is in the future — the seeded history above already covers
        // past months, so the materializer must not double-create them.
        recurringExpenseRepository.save(new RecurringExpense(
                demo, new BigDecimal(15000), Category.HOUSING, "Rent", 1,
                RecurringExpense.firstOccurrenceOnOrAfter(1, today.plusDays(1))));
        recurringExpenseRepository.save(new RecurringExpense(
                demo, new BigDecimal("649"), Category.ENTERTAINMENT, "Streaming subscription", 5,
                RecurringExpense.firstOccurrenceOnOrAfter(5, today.plusDays(1))));
    }
}
