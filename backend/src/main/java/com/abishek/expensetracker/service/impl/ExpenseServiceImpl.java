package com.abishek.expensetracker.service.impl;

import com.abishek.expensetracker.dto.CategoryTotal;
import com.abishek.expensetracker.dto.ExpenseRequest;
import com.abishek.expensetracker.dto.ExpenseResponse;
import com.abishek.expensetracker.dto.MonthlySummaryResponse;
import com.abishek.expensetracker.exception.ExpenseNotFoundException;
import com.abishek.expensetracker.mapper.ExpenseMapper;
import com.abishek.expensetracker.model.Category;
import com.abishek.expensetracker.model.Expense;
import com.abishek.expensetracker.repository.ExpenseRepository;
import com.abishek.expensetracker.repository.ExpenseSpecifications;
import com.abishek.expensetracker.service.ExpenseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseMapper expenseMapper;

    public ExpenseServiceImpl(ExpenseRepository expenseRepository, ExpenseMapper expenseMapper) {
        this.expenseRepository = expenseRepository;
        this.expenseMapper = expenseMapper;
    }

    @Override
    public ExpenseResponse create(ExpenseRequest request) {
        Expense saved = expenseRepository.save(expenseMapper.toEntity(request));
        return expenseMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getById(Long id) {
        return expenseMapper.toResponse(findExpense(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> list(Integer year, Integer month, Category category, Pageable pageable) {
        List<Specification<Expense>> specs = new ArrayList<>();
        if (year != null && month != null) {
            specs.add(ExpenseSpecifications.inMonth(YearMonth.of(year, month)));
        }
        if (category != null) {
            specs.add(ExpenseSpecifications.hasCategory(category));
        }
        return expenseRepository.findAll(Specification.allOf(specs), pageable)
                .map(expenseMapper::toResponse);
    }

    @Override
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = findExpense(id);
        expenseMapper.updateEntity(expense, request);
        return expenseMapper.toResponse(expenseRepository.save(expense));
    }

    @Override
    public void delete(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ExpenseNotFoundException(id);
        }
        expenseRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public MonthlySummaryResponse monthlySummary(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.plusMonths(1).atDay(1);

        List<CategoryTotal> byCategory = expenseRepository.totalsByCategory(start, end).stream()
                .map(view -> new CategoryTotal(view.getCategory(), view.getTotal()))
                .toList();

        BigDecimal total = byCategory.stream()
                .map(CategoryTotal::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MonthlySummaryResponse(year, month, total, byCategory);
    }

    private Expense findExpense(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ExpenseNotFoundException(id));
    }
}
