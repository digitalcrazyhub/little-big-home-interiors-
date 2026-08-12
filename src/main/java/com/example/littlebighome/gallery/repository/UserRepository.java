package com.example.littlebighome.gallery.repository;


import com.example.littlebighome.gallery.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}