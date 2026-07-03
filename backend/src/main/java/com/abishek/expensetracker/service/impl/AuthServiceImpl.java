package com.abishek.expensetracker.service.impl;

import com.abishek.expensetracker.dto.AuthResponse;
import com.abishek.expensetracker.dto.GoogleLoginRequest;
import com.abishek.expensetracker.dto.LoginRequest;
import com.abishek.expensetracker.dto.RegisterRequest;
import com.abishek.expensetracker.exception.EmailAlreadyRegisteredException;
import com.abishek.expensetracker.exception.GoogleAuthException;
import com.abishek.expensetracker.exception.InvalidCredentialsException;
import com.abishek.expensetracker.model.User;
import com.abishek.expensetracker.repository.UserRepository;
import com.abishek.expensetracker.security.GoogleTokenVerifier;
import com.abishek.expensetracker.security.JwtService;
import com.abishek.expensetracker.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;

    public AuthServiceImpl(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            GoogleTokenVerifier googleTokenVerifier) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
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
        // Google-only accounts have no local password to check against.
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return toAuthResponse(user);
    }

    @Override
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        Jwt idToken = googleTokenVerifier.verify(request.idToken());
        String email = idToken.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new GoogleAuthException("Google sign-in failed: the Google account has no email address");
        }
        if (!Boolean.TRUE.equals(idToken.getClaimAsBoolean("email_verified"))) {
            throw new GoogleAuthException("Google sign-in failed: the Google account email is not verified");
        }
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> userRepository.save(
                        User.googleUser(normalizedEmail, displayNameFrom(idToken, normalizedEmail))));
        return toAuthResponse(user);
    }

    private String displayNameFrom(Jwt idToken, String email) {
        String name = idToken.getClaimAsString("name");
        if (name == null || name.isBlank()) {
            name = email.substring(0, email.indexOf('@'));
        }
        name = name.trim();
        return name.length() > 100 ? name.substring(0, 100) : name;
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail(), user.getDisplayName());
    }
}
