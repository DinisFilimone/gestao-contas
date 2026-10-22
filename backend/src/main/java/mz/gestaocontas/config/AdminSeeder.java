package mz.gestaocontas.config;

import mz.gestaocontas.domain.Role;
import mz.gestaocontas.domain.User;
import mz.gestaocontas.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Cria o utilizador ADMIN inicial no primeiro arranque (se ainda nao existir). */
@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       @Value("${app.admin.username}") String adminUsername,
                       @Value("${app.admin.password}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(adminUsername)) {
            userRepository.save(new User(adminUsername, passwordEncoder.encode(adminPassword), Role.ADMIN));
            log.warn("Utilizador ADMIN '{}' criado. Altere a password por variavel de ambiente fora de desenvolvimento.",
                    adminUsername);
        }
    }
}
