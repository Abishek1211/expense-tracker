package com.abishek.expensetracker.security;

import com.abishek.expensetracker.dto.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory sliding-window rate limit for the auth endpoints, to slow
 * down credential stuffing. Per-instance only — put a real limiter (gateway,
 * Redis) in front for anything beyond a portfolio deployment.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_MILLIS = 60_000;
    private static final int MAX_TRACKED_IPS = 10_000;

    private final Map<String, Deque<Long>> requestsByIp = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public AuthRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/auth/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        String ip = clientIp(request);

        if (requestsByIp.size() > MAX_TRACKED_IPS) {
            requestsByIp.clear();
        }
        Deque<Long> timestamps = requestsByIp.computeIfAbsent(ip, key -> new ArrayDeque<>());

        boolean limited;
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MILLIS) {
                timestamps.pollFirst();
            }
            limited = timestamps.size() >= MAX_REQUESTS;
            if (!limited) {
                timestamps.addLast(now);
            }
        }

        if (limited) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiError body = ApiError.of(429, "Too Many Requests",
                    "Too many attempts — try again in a minute", request.getRequestURI());
            objectMapper.writeValue(response.getWriter(), body);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
