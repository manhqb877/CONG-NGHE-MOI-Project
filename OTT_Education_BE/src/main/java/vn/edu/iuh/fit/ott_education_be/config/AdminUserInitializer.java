package vn.edu.iuh.fit.ott_education_be.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.iuh.fit.ott_education_be.common.UserActiveStatus;
import vn.edu.iuh.fit.ott_education_be.common.UserStatus;
import vn.edu.iuh.fit.ott_education_be.model.User;
import vn.edu.iuh.fit.ott_education_be.repository.UserRepository;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if admin user already exists
        User existingAdmin = userRepository.findByUsername("admin");
        if (existingAdmin == null) {
            log.info("Creating admin user...");

            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("Admin123@"))
                    .role("ADMIN")
                    .firstName("Admin")
                    .lastName("System")
                    .email("admin@otteducation.com")
                    .phone("0000000000")
                    .status(UserStatus.ACTIVE)
                    .activeStatus(UserActiveStatus.ONLINE)
                    .avatar("https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff")
                    .createdAt(LocalDateTime.now())
                    .updateAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);
            log.info("✅ Admin user created successfully! Username: admin, Password: Admin123@");
        } else {
            log.info("Admin user already exists. Skipping creation.");
        }
    }
}
