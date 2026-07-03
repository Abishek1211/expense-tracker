package com.abishek.expensetracker.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI expenseTrackerOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Expense Tracker API")
                        .description("REST API for tracking personal expenses with monthly category summaries. "
                                + "Register or log in via /api/v1/auth to obtain a JWT, then click Authorize.")
                        .version("v1")
                        .contact(new Contact().name("Abishek").url("https://github.com/Abishek1211")))
                .components(new Components().addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH));
    }
}
