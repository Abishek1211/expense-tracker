package com.abishek.expensetracker.service;

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
import com.abishek.expensetracker.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService = new JwtService("test-only-jwt-secret-0123456789abcdef", 60);

    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(userRepository, passwordEncoder, jwtService, googleTokenVerifier);
    }

    @Test
    void registerCreatesUserWithHashedPasswordAndReturnsToken() {
        when(userRepository.existsByEmailIgnoreCase("abi@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response =
                service.register(new RegisterRequest("Abi@Example.com", "secret-password", "Abi"));

        assertThat(response.email()).isEqualTo("abi@example.com");
        assertThat(response.displayName()).isEqualTo("Abi");
        assertThat(jwtService.extractSubject(response.token())).contains("abi@example.com");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase("abi@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
                service.register(new RegisterRequest("abi@example.com", "secret-password", "Abi")))
                .isInstanceOf(EmailAlreadyRegisteredException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsTokenForValidCredentials() {
        User user = new User("abi@example.com", passwordEncoder.encode("secret-password"), "Abi");
        when(userRepository.findByEmailIgnoreCase("abi@example.com")).thenReturn(Optional.of(user));

        AuthResponse response = service.login(new LoginRequest("abi@example.com", "secret-password"));

        assertThat(jwtService.extractSubject(response.token())).contains("abi@example.com");
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = new User("abi@example.com", passwordEncoder.encode("secret-password"), "Abi");
        when(userRepository.findByEmailIgnoreCase("abi@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.login(new LoginRequest("abi@example.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRejectsUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("ghost@example.com", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRejectsPasswordForGoogleOnlyAccount() {
        User user = User.googleUser("abi@example.com", "Abi");
        when(userRepository.findByEmailIgnoreCase("abi@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.login(new LoginRequest("abi@example.com", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void googleLoginCreatesUserOnFirstSignIn() {
        when(googleTokenVerifier.verify("google-token")).thenReturn(googleIdToken(
                Map.of("email", "Abi@Gmail.com", "email_verified", true, "name", "Abi R")));
        when(userRepository.findByEmailIgnoreCase("abi@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = service.loginWithGoogle(new GoogleLoginRequest("google-token"));

        assertThat(response.email()).isEqualTo("abi@gmail.com");
        assertThat(response.displayName()).isEqualTo("Abi R");
        assertThat(jwtService.extractSubject(response.token())).contains("abi@gmail.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void googleLoginReusesExistingAccountWithMatchingEmail() {
        User existing = new User("abi@gmail.com", passwordEncoder.encode("secret-password"), "Abi");
        when(googleTokenVerifier.verify("google-token")).thenReturn(googleIdToken(
                Map.of("email", "abi@gmail.com", "email_verified", true, "name", "Abi R")));
        when(userRepository.findByEmailIgnoreCase("abi@gmail.com")).thenReturn(Optional.of(existing));

        AuthResponse response = service.loginWithGoogle(new GoogleLoginRequest("google-token"));

        assertThat(response.displayName()).isEqualTo("Abi");
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLoginRejectsUnverifiedEmail() {
        when(googleTokenVerifier.verify("google-token")).thenReturn(googleIdToken(
                Map.of("email", "abi@gmail.com", "email_verified", false)));

        assertThatThrownBy(() -> service.loginWithGoogle(new GoogleLoginRequest("google-token")))
                .isInstanceOf(GoogleAuthException.class);
        verify(userRepository, never()).save(any());
    }

    private Jwt googleIdToken(Map<String, Object> claims) {
        Jwt.Builder builder = Jwt.withTokenValue("google-token").header("alg", "RS256");
        claims.forEach(builder::claim);
        return builder.build();
    }
}
