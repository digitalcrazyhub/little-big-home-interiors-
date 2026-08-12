package com.example.littlebighome.gallery.controller;

import com.example.littlebighome.gallery.dto.AuthResponse;
import com.example.littlebighome.gallery.dto.LoginRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;

    private final SecurityContextRepository
            securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(
            AuthenticationManager authenticationManager) {

        this.authenticationManager =
                authenticationManager;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        try {

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.getUsername(),
                                    request.getPassword()
                            )
                    );

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);

            SecurityContextHolder.setContext(context);

            securityContextRepository.saveContext(
                    context,
                    httpRequest,
                    httpResponse
            );

            return ResponseEntity.ok(
                    new AuthResponse(
                            true,
                            authentication.getName(),
                            "ADMIN"
                    )
            );

        } catch (Exception e) {

            return ResponseEntity
                    .status(401)
                    .body(
                            new AuthResponse(
                                    false,
                                    null,
                                    null
                            )
                    );
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication != null &&
                authentication.isAuthenticated() &&
                !"anonymousUser".equals(
                        authentication.getPrincipal()
                )) {

            return ResponseEntity.ok(
                    new AuthResponse(
                            true,
                            authentication.getName(),
                            "ADMIN"
                    )
            );
        }

        return ResponseEntity
                .status(401)
                .body(
                        new AuthResponse(
                                false,
                                null,
                                null
                        )
                );
    }
}