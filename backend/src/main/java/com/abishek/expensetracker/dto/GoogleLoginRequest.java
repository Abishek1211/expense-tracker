package com.abishek.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(@NotBlank(message = "ID token is required") String idToken) {
}
