package com.abishek.expensetracker.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs one line per request (method, path, status, duration) so failures are
 * visible in Render's Logs tab without needing to reproduce them locally.
 * Registered as the outermost filter so the logged status reflects whatever
 * later filters (rate limiting, auth) or handlers ultimately decided.
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("com.abishek.expensetracker.access");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            int status = response.getStatus();
            String line = "{} {} -> {} ({} ms)";
            Object[] args = {request.getMethod(), request.getRequestURI(), status, durationMs};

            // Render's own health-check polling would otherwise spam the log at INFO.
            boolean isHealthCheck = "/actuator/health".equals(request.getRequestURI());

            if (status >= 500) {
                log.error(line, args);
            } else if (status >= 400) {
                log.warn(line, args);
            } else if (!isHealthCheck) {
                log.info(line, args);
            } else {
                log.debug(line, args);
            }
        }
    }
}
