package com.abishek.expensetracker.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI expenseTrackerOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Expense Tracker API")
                .description("REST API for tracking personal expenses with monthly category summaries")
                .version("v1")
                .contact(new Contact().name("Abishek").url("https://github.com/Abishek1211")));
    }
}
