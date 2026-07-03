package com.abishek.expensetracker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InsightResponse(
        String type,
        String message,
        /** Signed percentage vs the previous month, when applicable. */
        Double changePercent
) {

    public static InsightResponse of(String type, String message) {
        return new InsightResponse(type, message, null);
    }
}
