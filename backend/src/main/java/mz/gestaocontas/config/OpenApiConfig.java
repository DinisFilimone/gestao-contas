package mz.gestaocontas.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/** Documentacao Swagger com o botao "Authorize" para colar o token JWT. */
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Gestao de Contas Bancarias", version = "1.0",
                description = "API REST: contas, transferencias e extracto, com JWT (ADMIN e CLIENTE)"),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
