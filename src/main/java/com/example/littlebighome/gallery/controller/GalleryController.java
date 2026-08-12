package com.example.littlebighome.gallery.controller;

import com.example.littlebighome.gallery.entity.Category;
import com.example.littlebighome.gallery.entity.Gallery;
import com.example.littlebighome.gallery.repository.CategoryRepository;
import com.example.littlebighome.gallery.repository.GalleryRepository;
import com.example.littlebighome.gallery.service.FileStorageService;
import com.example.littlebighome.gallery.service.FileStorageService.StoredFile;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    private final GalleryRepository galleryRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    public GalleryController(
            GalleryRepository galleryRepository,
            CategoryRepository categoryRepository,
            FileStorageService fileStorageService) {

        this.galleryRepository = galleryRepository;
        this.categoryRepository = categoryRepository;
        this.fileStorageService = fileStorageService;
    }

    // ==============================
    // GET ALL
    // ==============================

    @GetMapping
    public ResponseEntity<List<Gallery>> getAllGallery() {

        return ResponseEntity.ok(
                galleryRepository.findAllByOrderByCreatedAtDesc()
        );
    }

    // ==============================
    // CREATE
    // ==============================

    @PostMapping
    public ResponseEntity<?> createGallery(

            @RequestParam("file") MultipartFile file,

            @RequestParam("title") String title,

            @RequestParam("description") String description,

            @RequestParam("categoryId") Long categoryId) {

        try {

            validateText(title, description);

            Category category =
                    categoryRepository.findById(categoryId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Invalid category."
                                    )
                            );

            StoredFile stored =
                    fileStorageService.saveFile(file);

            Gallery gallery = new Gallery();

            gallery.setTitle(title.trim());
            gallery.setDescription(description.trim());
            gallery.setCategory(category);

            gallery.setImageName(stored.filename());
            gallery.setImageUrl(stored.url());

            gallery.setOriginalFilename(
                    stored.originalFilename()
            );

            gallery.setFileType(
                    stored.contentType()
            );

            gallery.setFileSize(
                    stored.size()
            );

            gallery.setCreatedAt(
                    LocalDateTime.now()
            );

            Gallery saved =
                    galleryRepository.save(gallery);

            return ResponseEntity.ok(saved);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiMessage(
                                    false,
                                    e.getMessage()
                            )
                    );
        }
    }

    // ==============================
    // UPDATE
    // ==============================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGallery(

            @PathVariable Long id,

            @RequestParam("title") String title,

            @RequestParam("description") String description,

            @RequestParam("categoryId") Long categoryId,

            @RequestParam(value = "file", required = false)
            MultipartFile file) {

        try {

            validateText(title, description);

            Gallery gallery =
                    galleryRepository.findById(id)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Gallery item not found."
                                    )
                            );

            Category category =
                    categoryRepository.findById(categoryId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Invalid category."
                                    )
                            );

            gallery.setTitle(title.trim());
            gallery.setDescription(description.trim());
            gallery.setCategory(category);

            // Replace image only when a new file is selected
            if (file != null && !file.isEmpty()) {

                String oldFile =
                        gallery.getImageName();

                StoredFile stored =
                        fileStorageService.saveFile(file);

                gallery.setImageName(
                        stored.filename()
                );

                gallery.setImageUrl(
                        stored.url()
                );

                gallery.setOriginalFilename(
                        stored.originalFilename()
                );

                gallery.setFileType(
                        stored.contentType()
                );

                gallery.setFileSize(
                        stored.size()
                );

                if (oldFile != null) {
                    fileStorageService.deleteFile(oldFile);
                }
            }

            Gallery updated =
                    galleryRepository.save(gallery);

            return ResponseEntity.ok(updated);

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiMessage(
                                    false,
                                    e.getMessage()
                            )
                    );
        }
    }

    // ==============================
    // DELETE
    // ==============================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGallery(
            @PathVariable Long id) {

        return galleryRepository
                .findById(id)
                .map(gallery -> {

                    fileStorageService.deleteFile(
                            gallery.getImageName()
                    );

                    galleryRepository.delete(gallery);

                    return ResponseEntity.ok(
                            new ApiMessage(
                                    true,
                                    "Image deleted successfully."
                            )
                    );

                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    private void validateText(
            String title,
            String description) {

        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Title is required."
            );
        }

        if (description == null ||
                description.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Description is required."
            );
        }
    }

    public record ApiMessage(
            boolean success,
            String message
    ) {}
}