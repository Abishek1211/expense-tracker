package com.abishek.expensetracker.service.impl;

import com.abishek.expensetracker.dto.CategoryTotal;
import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.InsightResponse;
import com.abishek.expensetracker.dto.MonthTotal;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.exception.ExpenseNotFoundException;
import com.abishek.expensetracker.mapper.ExpenseMapper;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.repository.ExpenseSpecifications;
import com.abishek.expensetracker.security.CurrentUserService;
import com.abishek.expensetracker.service.ExpenseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseMapper expenseMapper;
    private final CurrentUserService currentUserService;

    public ExpenseServiceImpl(
            ExpenseRepository expenseRepository,
            ExpenseMapper expenseMapper,
            CurrentUserService currentUserService) {
        this.expenseRepository = expenseRepository;
        this.expenseMapper = expenseMapper;
        this.currentUserService = currentUserService;
    }

    @Override
    public ExpenseResponse create(ExpenseRequest request) {
        User user = currentUserService.requireCurrentUser();
        Expense saved = expenseRepository.save(expenseMapper.toEntity(request, user));
        return expenseMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getById(Long id) {
        return expenseMapper.toResponse(findOwnedExpense(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> list(ExpenseFilters filters, Pageable pageable) {
        return expenseRepository.findAll(buildSpec(filters), pageable).map(expenseMapper::toResponse);
    }

    @Override
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = findOwnedExpense(id);
        expenseMapper.updateEntity(expense, request);
        return expenseMapper.toResponse(expenseRepository.save(expense));
    }

    @Override
    public void delete(Long id) {
        User user = currentUserService.requireCurrentUser();
        if (!expenseRepository.existsByIdAndUserId(id, user.getId())) {
            throw new ExpenseNotFoundException(id);
        }
        expenseRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public MonthlySummaryResponse monthlySummary(int year, int month) {
        User user = currentUserService.requireCurrentUser();
        List<CategoryTotal> byCategory = categoryTotals(user, YearMonth.of(year, month));

        BigDecimal total = byCategory.stream()
                .map(CategoryTotal::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MonthlySummaryResponse(year, month, total, byCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonthTotal> trend(int months) {
        User user = currentUserService.requireCurrentUser();
        int span = Math.clamp(months, 1, 24);
        YearMonth current = YearMonth.now();
        YearMonth first = current.minusMonths(span - 1L);

        Map<YearMonth, BigDecimal> totals = expenseRepository
                .totalsByMonth(user.getId(), first.atDay(1), current.plusMonths(1).atDay(1))
                .stream()
                .collect(Collectors.toMap(
                        view -> YearMonth.of(view.getExpenseYear(), view.getExpenseMonth()),
                        ExpenseRepository.MonthTotalView::getTotal));

        List<MonthTotal> result = new ArrayList<>(span);
        for (YearMonth ym = first; !ym.isAfter(current); ym = ym.plusMonths(1)) {
            result.add(new MonthTotal(
                    ym.getYear(), ym.getMonthValue(), totals.getOrDefault(ym, BigDecimal.ZERO)));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InsightResponse> insights(int year, int month) {
        User user = currentUserService.requireCurrentUser();
        YearMonth ym = YearMonth.of(year, month);
        YearMonth previous = ym.minusMonths(1);

        Map<com.abishek.expensetracker.model.Category, BigDecimal> current =
                toCategoryMap(categoryTotals(user, ym));
        Map<com.abishek.expensetracker.model.Category, BigDecimal> prior =
                toCategoryMap(categoryTotals(user, previous));

        BigDecimal total = sum(current.values());
        BigDecimal priorTotal = sum(prior.values());

        List<InsightResponse> insights = new ArrayList<>();
        if (current.isEmpty()) {
            insights.add(InsightResponse.of("NO_DATA", "No expenses recorded for %s yet."
                    .formatted(monthName(ym))));
            return insights;
        }

        if (priorTotal.signum() > 0) {
            double change = total.subtract(priorTotal)
                    .divide(priorTotal, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;
            String direction = change >= 0 ? "more" : "less";
            insights.add(new InsightResponse(
                    "TOTAL_CHANGE",
                    "You spent %.0f%% %s than in %s.".formatted(Math.abs(change), direction, monthName(previous)),
                    Math.round(change * 10) / 10.0));
        }

        current.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .ifPresent(top -> {
                    double share = top.getValue()
                            .divide(total, 4, RoundingMode.HALF_UP)
                            .doubleValue() * 100;
                    insights.add(InsightResponse.of(
                            "TOP_CATEGORY",
                            "%s was your biggest category at %.0f%% of spending."
                                    .formatted(titleCase(top.getKey().name()), share)));
                });

        current.entrySet().stream()
                .filter(entry -> prior.containsKey(entry.getKey()))
                .map(entry -> Map.entry(entry.getKey(), entry.getValue().subtract(prior.get(entry.getKey()))))
                .filter(entry -> entry.getValue().signum() > 0)
                .max(Map.Entry.comparingByValue())
                .ifPresent(riser -> insights.add(InsightResponse.of(
                        "BIGGEST_INCREASE",
                        "%s rose the most compared to %s."
                                .formatted(titleCase(riser.getKey().name()), monthName(previous)))));

        long elapsedDays = ym.equals(YearMonth.now())
                ? LocalDate.now().getDayOfMonth()
                : ym.lengthOfMonth();
        BigDecimal perDay = total.divide(BigDecimal.valueOf(elapsedDays), 2, RoundingMode.HALF_UP);
        long count = expenseRepository.countByUserIdAndDateGreaterThanEqualAndDateLessThan(
                user.getId(), ym.atDay(1), ym.plusMonths(1).atDay(1));
        insights.add(InsightResponse.of(
                "DAILY_AVERAGE",
                "That's about %s per day across %d transaction%s."
                        .formatted(perDay.toPlainString(), count, count == 1 ? "" : "s")));

        return insights;
    }

    @Override
    @Transactional(readOnly = true)
    public String exportCsv(ExpenseFilters filters) {
        List<Expense> expenses = expenseRepository.findAll(
                buildSpec(filters), Sort.by(Sort.Direction.DESC, "date", "id"));

        StringBuilder csv = new StringBuilder("id,date,category,amount,note,createdAt\n");
        for (Expense expense : expenses) {
            csv.append(expense.getId()).append(',')
                    .append(expense.getDate()).append(',')
                    .append(expense.getCategory()).append(',')
                    .append(expense.getAmount().toPlainString()).append(',')
                    .append(csvEscape(expense.getNote())).append(',')
                    .append(expense.getCreatedAt()).append('\n');
        }
        return csv.toString();
    }

    private Specification<Expense> buildSpec(ExpenseFilters filters) {
        User user = currentUserService.requireCurrentUser();
        List<Specification<Expense>> specs = new ArrayList<>();
        specs.add(ExpenseSpecifications.belongsToUser(user.getId()));
        if (filters.year() != null && filters.month() != null) {
            specs.add(ExpenseSpecifications.inMonth(YearMonth.of(filters.year(), filters.month())));
        }
        if (filters.category() != null) {
            specs.add(ExpenseSpecifications.hasCategory(filters.category()));
        }
        if (filters.q() != null && !filters.q().isBlank()) {
            specs.add(ExpenseSpecifications.noteContains(filters.q()));
        }
        if (filters.from() != null) {
            specs.add(ExpenseSpecifications.onOrAfter(filters.from()));
        }
        if (filters.to() != null) {
            specs.add(ExpenseSpecifications.onOrBefore(filters.to()));
        }
        return Specification.allOf(specs);
    }

    private List<CategoryTotal> categoryTotals(User user, YearMonth yearMonth) {
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.plusMonths(1).atDay(1);
        return expenseRepository.totalsByCategory(user.getId(), start, end).stream()
                .map(view -> new CategoryTotal(view.getCategory(), view.getTotal()))
                .toList();
    }

    private static Map<com.abishek.expensetracker.model.Category, BigDecimal> toCategoryMap(
            List<CategoryTotal> totals) {
        return totals.stream()
                .sorted(Comparator.comparing(CategoryTotal::total).reversed())
                .collect(Collectors.toMap(
                        CategoryTotal::category, CategoryTotal::total,
                        (a, b) -> a, LinkedHashMap::new));
    }

    private static BigDecimal sum(Iterable<BigDecimal> values) {
        BigDecimal total = BigDecimal.ZERO;
        for (BigDecimal value : values) {
            total = total.add(value);
        }
        return total;
    }

    private static String monthName(YearMonth yearMonth) {
        return yearMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }

    private static String titleCase(String value) {
        return value.charAt(0) + value.substring(1).toLowerCase(Locale.ENGLISH);
    }

    private static String csvEscape(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return '"' + value.replace("\"", "\"\"") + '"';
        }
        return value;
    }

    private Expense findOwnedExpense(Long id) {
        User user = currentUserService.requireCurrentUser();
        return expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ExpenseNotFoundException(id));
    }
}
