package com.abishek.expensetracker.dto;

public record AuthResponse(String token, String email, String displayName) {
}
