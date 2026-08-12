package com.example.littlebighome.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private boolean authenticated;
    private String username;
    private String role;
}