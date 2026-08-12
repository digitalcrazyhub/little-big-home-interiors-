package com.example.littlebighome.gallery.contact;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactLeadService {

    private final ContactLeadRepository repository;
    private final EmailService emailService;
    private final GoogleSheetsService googleSheetsService;

    public ContactLeadService(
            ContactLeadRepository repository,
            EmailService emailService,
            GoogleSheetsService googleSheetsService
    ) {
        this.repository = repository;
        this.emailService = emailService;
        this.googleSheetsService = googleSheetsService;
    }

    @Transactional
    public ContactLead submitLead(
            ContactLeadRequest request
    ) {

        validate(request);

        ContactLead lead = new ContactLead();

        lead.setName(
                request.getName().trim()
        );

        lead.setEmail(
                request.getEmail().trim()
        );

        lead.setPhone(
                clean(request.getPhone())
        );

        lead.setProjectType(
                clean(request.getType())
        );

        lead.setMessage(
                clean(request.getMessage())
        );

        /*
         * ================================================
         * 1. SAVE TO MYSQL
         * ================================================
         */

        ContactLead savedLead =
                repository.save(lead);

        System.out.println(
                "CONTACT LEAD SAVED TO MYSQL: " +
                        savedLead.getId()
        );

        /*
         * ================================================
         * 2. CUSTOMER EMAIL
         * ================================================
         */

        try {

            emailService.sendThankYouEmail(
                    savedLead
            );

            System.out.println(
                    "CUSTOMER EMAIL SENT"
            );

        } catch (Exception e) {

            System.err.println(
                    "CUSTOMER EMAIL FAILED: " +
                            e.getMessage()
            );
        }

        /*
         * ================================================
         * 3. OWNER EMAIL
         * ================================================
         */

        try {

            emailService.sendOwnerLeadEmail(
                    savedLead
            );

            System.out.println(
                    "OWNER EMAIL SENT"
            );

        } catch (Exception e) {

            System.err.println(
                    "OWNER EMAIL FAILED: " +
                            e.getMessage()
            );
        }

        /*
         * ================================================
         * 4. GOOGLE SHEETS
         * ================================================
         */

        try {

            googleSheetsService.addLead(
                    savedLead
            );

            System.out.println(
                    "GOOGLE SHEET UPDATED"
            );

        } catch (Exception e) {

            System.err.println(
                    "GOOGLE SHEET FAILED: " +
                            e.getMessage()
            );
        }

        return savedLead;
    }

    private void validate(
            ContactLeadRequest request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Invalid request."
            );
        }

        if (isBlank(request.getName())) {
            throw new IllegalArgumentException(
                    "Please enter your name."
            );
        }

        if (isBlank(request.getEmail())) {
            throw new IllegalArgumentException(
                    "Please enter your email address."
            );
        }

        String email =
                request.getEmail().trim();

        if (!email.matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
        )) {
            throw new IllegalArgumentException(
                    "Please enter a valid email address."
            );
        }

        if (request.getName().trim().length() > 100) {
            throw new IllegalArgumentException(
                    "Name is too long."
            );
        }

        if (email.length() > 255) {
            throw new IllegalArgumentException(
                    "Email address is too long."
            );
        }

        if (request.getPhone() != null &&
                request.getPhone().length() > 10) {

            throw new IllegalArgumentException(
                    "Phone number is too long."
            );
        }

        if (request.getType() != null &&
                request.getType().length() > 100) {

            throw new IllegalArgumentException(
                    "Project type is too long."
            );
        }
    }

    private boolean isBlank(String value) {

        return value == null ||
                value.trim().isEmpty();
    }

    private String clean(String value) {

        if (value == null) {
            return null;
        }

        String cleaned =
                value.trim();

        return cleaned.isEmpty()
                ? null
                : cleaned;
    }
}