package com.abishek.expensetracker.security;

import com.abishek.expensetracker.exception.GoogleAuthException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Validates Google ID tokens (issued by Google Identity Services on the frontend)
 * against Google's published signing keys, expected issuer, and this app's OAuth client id.
 */
@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final String GOOGLE_ISSUER = "https://accounts.google.com";

    private final String clientId;
    private volatile JwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean isConfigured() {
        return !clientId.isEmpty();
    }

    public Jwt verify(String idToken) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Google sign-in is not configured: set the GOOGLE_CLIENT_ID environment variable");
        }
        try {
            return decoder().decode(idToken);
        } catch (JwtException ex) {
            throw new GoogleAuthException("Google sign-in failed: the ID token is invalid or expired");
        }
    }

    private JwtDecoder decoder() {
        JwtDecoder result = decoder;
        if (result == null) {
            synchronized (this) {
                result = decoder;
                if (result == null) {
                    result = buildDecoder();
                    decoder = result;
                }
            }
        }
        return result;
    }

    private JwtDecoder buildDecoder() {
        NimbusJwtDecoder nimbusDecoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS_URI)
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .build();
        OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<List<String>>(
                JwtClaimNames.AUD, aud -> aud != null && aud.contains(clientId));
        nimbusDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(GOOGLE_ISSUER), audienceValidator));
        return nimbusDecoder;
    }
}
