package com.abishek.expensetracker.service;

import com.abishek.expensetracker.dto.AuthResponse;
import com.abishek.expensetracker.dto.LoginRequest;
import com.abishek.expensetracker.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
