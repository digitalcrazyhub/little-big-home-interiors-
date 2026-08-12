package com.example.littlebighome.gallery.contact;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactLeadController {

    private final ContactLeadService contactLeadService;

    public ContactLeadController(
            ContactLeadService contactLeadService
    ) {
        this.contactLeadService = contactLeadService;
    }

    @PostMapping
    public ResponseEntity<?> submitContact(
            @RequestBody ContactLeadRequest request
    ) {

        try {

            ContactLead savedLead =
                    contactLeadService.submitLead(request);

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put("success", true);
            response.put(
                    "message",
                    "Your enquiry has been submitted successfully."
            );
            response.put("leadId", savedLead.getId());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity
                    .badRequest()
                    .body(response);

        } catch (Exception e) {

            e.printStackTrace();

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put("success", false);
            response.put(
                    "message",
                    "Unable to submit your enquiry. Please try again."
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }
}