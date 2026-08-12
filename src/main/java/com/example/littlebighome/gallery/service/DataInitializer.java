package com.example.littlebighome.gallery.service;

import com.example.littlebighome.gallery.entity.Category;
import com.example.littlebighome.gallery.entity.User;
import com.example.littlebighome.gallery.repository.CategoryRepository;
import com.example.littlebighome.gallery.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // ============================
        // ADMIN
        // ============================

        if (userRepository.findByUsername("admin") == null) {

            User admin = new User();

            admin.setUsername("admin");

            admin.setPassword(
                    passwordEncoder.encode("admin123")
            );

            admin.setRole("ROLE_ADMIN");

            admin.setEnabled(true);

            userRepository.save(admin);
        }

        // ============================
        // CATEGORIES
        // ============================

        List<String> categories = List.of(
                "Living Room",
                "Dining Hall",
                "Bedroom",
                "Kitchen",
                "Hall",
                "Office",
                "Commercial",
                "Luxury Interiors"
        );

        for (String name : categories) {

            String slug =
                    name.toLowerCase()
                            .replaceAll("[^a-z0-9]+", "-")
                            .replaceAll("(^-|-$)", "");

            if (!categoryRepository.existsBySlug(slug)) {

                Category category = new Category();

                category.setName(name);
                category.setSlug(slug);

                categoryRepository.save(category);
            }
        }
    }
}