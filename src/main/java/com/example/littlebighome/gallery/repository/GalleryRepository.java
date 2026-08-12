package com.example.littlebighome.gallery.repository;



import com.example.littlebighome.gallery.entity.Gallery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {
    List<Gallery> findAllByOrderByCreatedAtDesc();
}