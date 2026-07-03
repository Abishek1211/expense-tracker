package com.abishek.expensetracker.service.impl;

import com.abishek.expensetracker.dto.AuthResponse;
import com.abishek.expensetracker.dto.LoginRequest;
import com.abishek.expensetracker.dto.RegisterRequest;
import com.abishek.expensetracker.exception.EmailAlreadyRegisteredException;
import com.abishek.expensetracker.exception.InvalidCredentialsException;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.UserRepository;
import com.abishek.expensetracker.security.JwtService;
import com.abishek.expensetracker.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthServiceImpl(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyRegisteredException(email);
        }
        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName().trim());
        userRepository.save(user);
        return toAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail(), user.getDisplayName());
    }
}
