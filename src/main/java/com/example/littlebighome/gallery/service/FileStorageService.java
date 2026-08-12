package com.example.littlebighome.gallery.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    public StoredFile saveFile(MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image.");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
            );
        }

        Path uploadPath = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        Files.createDirectories(uploadPath);

        String originalName = file.getOriginalFilename();

        String extension = getExtension(originalName);

        String uniqueName =
                UUID.randomUUID() + extension;

        Path target =
                uploadPath.resolve(uniqueName).normalize();

        if (!target.startsWith(uploadPath)) {
            throw new SecurityException("Invalid file path.");
        }

        Files.copy(
                file.getInputStream(),
                target,
                StandardCopyOption.REPLACE_EXISTING
        );

        String url = "/uploads/gallery/" + uniqueName;

        return new StoredFile(
                uniqueName,
                url,
                originalName,
                contentType,
                file.getSize()
        );
    }

    private String getExtension(String filename) {

        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException(
                    "File extension is missing."
            );
        }

        String extension =
                filename.substring(
                        filename.lastIndexOf(".")
                ).toLowerCase();

        if (!Set.of(".jpg", ".jpeg", ".png", ".webp")
                .contains(extension)) {

            throw new IllegalArgumentException(
                    "Unsupported image extension."
            );
        }

        return extension;
    }

    public void deleteFile(String filename) {

        if (filename == null || filename.isBlank()) {
            return;
        }

        try {

            Path uploadPath = Paths.get(uploadDir)
                    .toAbsolutePath()
                    .normalize();

            Path filePath =
                    uploadPath.resolve(filename).normalize();

            if (!filePath.startsWith(uploadPath)) {
                return;
            }

            Files.deleteIfExists(filePath);

        } catch (IOException e) {
            throw new RuntimeException(
                    "Unable to delete image file.",
                    e
            );
        }
    }

    public record StoredFile(
            String filename,
            String url,
            String originalFilename,
            String contentType,
            long size
    ) {}
}