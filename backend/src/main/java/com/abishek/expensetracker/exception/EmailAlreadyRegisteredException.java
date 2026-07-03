package com.abishek.expensetracker.exception;

public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String email) {
        super("An account with email %s already exists".formatted(email));
    }
}
