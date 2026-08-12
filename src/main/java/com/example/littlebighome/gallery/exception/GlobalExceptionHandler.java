package com.example.littlebighome.gallery.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("{\"success\":false,\"message\":\"File too large. Maximum image size is 5 MB.\"}");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException exc) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("{\"success\":false,\"message\":\"" + exc.getMessage() + "\"}");
    }
}