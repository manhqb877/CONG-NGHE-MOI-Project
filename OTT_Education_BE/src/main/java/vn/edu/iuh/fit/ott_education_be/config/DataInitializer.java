package vn.edu.iuh.fit.ott_education_be.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.iuh.fit.ott_education_be.common.Gender;
import vn.edu.iuh.fit.ott_education_be.common.MessageStatus;
import vn.edu.iuh.fit.ott_education_be.common.MessageType;
import vn.edu.iuh.fit.ott_education_be.common.Roles;
import vn.edu.iuh.fit.ott_education_be.common.UserStatus;
import vn.edu.iuh.fit.ott_education_be.model.Group;
import vn.edu.iuh.fit.ott_education_be.model.Message;
import vn.edu.iuh.fit.ott_education_be.model.User;
import vn.edu.iuh.fit.ott_education_be.repository.GroupRepository;
import vn.edu.iuh.fit.ott_education_be.repository.MessageRepository;
import vn.edu.iuh.fit.ott_education_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initializeData() {
        return args -> {
            try {
                // Check if data already exists
                if (userRepository.findByUsername("admin") != null) {
                    log.info("Database already initialized");
                    return;
                }

                log.info("Starting database initialization...");

                // Create sample users
                createSampleUsers();
                
                // Get created users
                User admin = userRepository.findByUsername("admin");
                User teacher1 = userRepository.findByUsername("teacher_john");
                User student1 = userRepository.findByUsername("student_alex");
                User student2 = userRepository.findByUsername("student_emma");

                // Create sample groups
                createSampleGroups(admin, teacher1, student1, student2);

                log.info("Database initialization completed successfully");
            } catch (Exception e) {
                log.error("Error initializing database: {}", e.getMessage());
            }
        };
    }

    private void createSampleUsers() {
        // Admin user
        User admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("Admin123"))
                .email("admin@otteducation.com")
                .phone("0912345678")
                .firstName("Admin")
                .lastName("OTT")
                .birthday(convertToDate(LocalDate.of(1990, 1, 15)))
                .gender(Gender.MALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Admin")
                .build();
        userRepository.save(admin);
        log.info("Created admin user");

        // Teacher users
        User teacher1 = User.builder()
                .username("teacher_john")
                .password(passwordEncoder.encode("Teacher123"))
                .email("john.teacher@otteducation.com")
                .phone("0987654321")
                .firstName("John")
                .lastName("Doe")
                .birthday(convertToDate(LocalDate.of(1985, 5, 20)))
                .gender(Gender.MALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=John+Doe")
                .build();
        userRepository.save(teacher1);
        log.info("Created teacher user: teacher_john");

        User teacher2 = User.builder()
                .username("teacher_sarah")
                .password(passwordEncoder.encode("Teacher123"))
                .email("sarah.teacher@otteducation.com")
                .phone("0978901234")
                .firstName("Sarah")
                .lastName("Johnson")
                .birthday(convertToDate(LocalDate.of(1988, 3, 10)))
                .gender(Gender.FEMALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Sarah+Johnson")
                .build();
        userRepository.save(teacher2);
        log.info("Created teacher user: teacher_sarah");

        // Student users
        User student1 = User.builder()
                .username("student_alex")
                .password(passwordEncoder.encode("Student123"))
                .email("alex.student@otteducation.com")
                .phone("0945678901")
                .firstName("Alex")
                .lastName("Brown")
                .birthday(convertToDate(LocalDate.of(2005, 8, 22)))
                .gender(Gender.MALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Alex+Brown")
                .build();
        userRepository.save(student1);
        log.info("Created student user: student_alex");

        User student2 = User.builder()
                .username("student_emma")
                .password(passwordEncoder.encode("Student123"))
                .email("emma.student@otteducation.com")
                .phone("0934567890")
                .firstName("Emma")
                .lastName("Wilson")
                .birthday(convertToDate(LocalDate.of(2004, 11, 15)))
                .gender(Gender.FEMALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Emma+Wilson")
                .build();
        userRepository.save(student2);
        log.info("Created student user: student_emma");

        User student3 = User.builder()
                .username("student_michael")
                .password(passwordEncoder.encode("Student123"))
                .email("michael.student@otteducation.com")
                .phone("0923456789")
                .firstName("Michael")
                .lastName("Davis")
                .birthday(convertToDate(LocalDate.of(2006, 2, 8)))
                .gender(Gender.MALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Michael+Davis")
                .build();
        userRepository.save(student3);
        log.info("Created student user: student_michael");

        User student4 = User.builder()
                .username("student_olivia")
                .password(passwordEncoder.encode("Student123"))
                .email("olivia.student@otteducation.com")
                .phone("0912389456")
                .firstName("Olivia")
                .lastName("Martinez")
                .birthday(convertToDate(LocalDate.of(2005, 6, 12)))
                .gender(Gender.FEMALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Olivia+Martinez")
                .build();
        userRepository.save(student4);
        log.info("Created student user: student_olivia");

        // Regular users
        User user1 = User.builder()
                .username("user_demo")
                .password(passwordEncoder.encode("Demo123"))
                .email("demo@otteducation.com")
                .phone("0901234567")
                .firstName("Demo")
                .lastName("User")
                .birthday(convertToDate(LocalDate.of(1995, 7, 25)))
                .gender(Gender.MALE)
                .status(UserStatus.ACTIVE)
                .avatar("https://via.placeholder.com/150?text=Demo+User")
                .build();
        userRepository.save(user1);
        log.info("Created demo user: user_demo");
    }

    private void createSampleGroups(User admin, User teacher1, User student1, User student2) {
        // Group 1: Java Programming
        Map<String, Roles> roles1 = new HashMap<>();
        roles1.put(admin.getId(), Roles.ADMIN);
        roles1.put(teacher1.getId(), Roles.ADMIN);
        roles1.put(student1.getId(), Roles.MEMBER);
        roles1.put(student2.getId(), Roles.MEMBER);

        Group group1 = Group.builder()
                .name("Java Programming")
                .createId(teacher1.getId())
                .memberIds(Arrays.asList(admin.getId(), teacher1.getId(), student1.getId(), student2.getId()))
                .roles(roles1)
                .avatarGroup("https://via.placeholder.com/150?text=Java")
                .isActive(true)
                .build();
        groupRepository.save(group1);
        log.info("Created group: Java Programming");

        // Create sample messages for Java Programming group
        Message msg1 = Message.builder()
                .senderId(teacher1.getId())
                .senderName(teacher1.getFirstName())
                .senderAvatar(teacher1.getAvatar())
                .groupId(group1.getId())
                .content("Chào các bạn! Đây là buổi học Java ngày hôm nay.")
                .type(MessageType.TEXT)
                .status(MessageStatus.DELIVERED)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();
        messageRepository.save(msg1);

        Message msg2 = Message.builder()
                .senderId(student1.getId())
                .senderName(student1.getFirstName())
                .senderAvatar(student1.getAvatar())
                .groupId(group1.getId())
                .content("Chào thầy! Em sẵn sàng rồi ạ")
                .type(MessageType.TEXT)
                .status(MessageStatus.DELIVERED)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();
        messageRepository.save(msg2);

        Message msg3 = Message.builder()
                .senderId(student2.getId())
                .senderName(student2.getFirstName())
                .senderAvatar(student2.getAvatar())
                .groupId(group1.getId())
                .content("Em cũng sẵn sàng ạ!")
                .type(MessageType.TEXT)
                .status(MessageStatus.DELIVERED)
                .createdAt(LocalDateTime.now().minusMinutes(30))
                .build();
        messageRepository.save(msg3);

        // Group 2: English Conversation
        Map<String, Roles> roles2 = new HashMap<>();
        roles2.put(admin.getId(), Roles.ADMIN);
        roles2.put(student1.getId(), Roles.MEMBER);
        roles2.put(student2.getId(), Roles.MEMBER);

        Group group2 = Group.builder()
                .name("English Conversation")
                .createId(admin.getId())
                .memberIds(Arrays.asList(admin.getId(), student1.getId(), student2.getId()))
                .roles(roles2)
                .avatarGroup("https://via.placeholder.com/150?text=English")
                .isActive(true)
                .build();
        groupRepository.save(group2);
        log.info("Created group: English Conversation");

        // Create sample messages for English group
        Message msg4 = Message.builder()
                .senderId(student1.getId())
                .senderName(student1.getFirstName())
                .senderAvatar(student1.getAvatar())
                .groupId(group2.getId())
                .content("Hi everyone! How are you today?")
                .type(MessageType.TEXT)
                .status(MessageStatus.DELIVERED)
                .createdAt(LocalDateTime.now().minusHours(3))
                .build();
        messageRepository.save(msg4);

        // Group 3: Mathematics Advanced
        Map<String, Roles> roles3 = new HashMap<>();
        roles3.put(admin.getId(), Roles.ADMIN);
        roles3.put(student1.getId(), Roles.MEMBER);

        Group group3 = Group.builder()
                .name("Mathematics Advanced")
                .createId(admin.getId())
                .memberIds(Arrays.asList(admin.getId(), student1.getId()))
                .roles(roles3)
                .avatarGroup("https://via.placeholder.com/150?text=Math")
                .isActive(true)
                .build();
        groupRepository.save(group3);
        log.info("Created group: Mathematics Advanced");
    }

    private Date convertToDate(LocalDate localDate) {
        return Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }
}
