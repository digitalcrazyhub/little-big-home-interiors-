package com.example.littlebighome.gallery.config;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // =================================================
                // CSRF
                // =================================================

                .csrf(csrf ->
                        csrf.disable()
                )


                // =================================================
                // AUTHORIZATION
                // =================================================

                .authorizeHttpRequests(auth -> auth

                        // -----------------------------------------
                        // PUBLIC GALLERY GET
                        // -----------------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/gallery",
                                "/api/gallery/**",
                                "/api/categories",
                                "/uploads/gallery/**"
                        ).permitAll()


                        // -----------------------------------------
                        // PUBLIC CONTACT FORM
                        // -----------------------------------------

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/contact"
                        ).permitAll()


                        // -----------------------------------------
                        // AUTHENTICATION
                        // -----------------------------------------

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()


                        // -----------------------------------------
                        // STATIC WEBSITE
                        // -----------------------------------------

                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/page/**",
                                "/assets/**",
                                "/favicon.ico"
                        ).permitAll()


                        // -----------------------------------------
                        // EVERYTHING ELSE = ADMIN
                        // -----------------------------------------

                        .anyRequest()
                        .hasRole("ADMIN")
                )


                // =================================================
                // LOGOUT
                // =================================================

                .logout(logout -> logout

                        .logoutUrl(
                                "/api/auth/logout"
                        )

                        .logoutSuccessHandler(
                                (
                                        request,
                                        response,
                                        authentication
                                ) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_OK
                                    );
                                }
                        )
                );


        return http.build();
    }


    // =====================================================
    // PASSWORD ENCODER
    // =====================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =====================================================
    // AUTHENTICATION MANAGER
    // =====================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration
                .getAuthenticationManager();
    }
}