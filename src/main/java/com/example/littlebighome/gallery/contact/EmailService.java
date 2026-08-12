package com.example.littlebighome.gallery.contact;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${contact.owner-email}")
    private String ownerEmail;

    public EmailService(
            JavaMailSender mailSender
    ) {
        this.mailSender = mailSender;
    }

    /*
     * CUSTOMER EMAIL
     */

    public void sendThankYouEmail(
            ContactLead lead
    ) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(fromEmail);

        message.setTo(
                lead.getEmail()
        );

        message.setSubject(
                "Thank You for Contacting Us"
        );

        message.setText(
                "Dear " +
                        lead.getName() +
                        ",\n\n" +

                        "Thank you for contacting us.\n\n" +

                        "We have received your enquiry " +
                        "and our team will get back to you shortly.\n\n" +

                        "Regards,\n" +
                        "Little Big Home"
        );

        mailSender.send(message);
    }

    /*
     * OWNER EMAIL
     */

    public void sendOwnerLeadEmail(
            ContactLead lead
    ) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(fromEmail);

        message.setTo(ownerEmail);

        message.setSubject(
                "New Website Enquiry - " +
                        lead.getName()
        );

        message.setText(
                "NEW CONTACT FORM ENQUIRY\n\n" +

                        "Name: " +
                        lead.getName() +
                        "\n" +

                        "Email: " +
                        lead.getEmail() +
                        "\n" +

                        "Phone: " +
                        safe(lead.getPhone()) +
                        "\n" +

                        "Project Type: " +
                        safe(lead.getProjectType()) +
                        "\n\n" +

                        "Message:\n" +
                        safe(lead.getMessage()) +
                        "\n\n" +

                        "Lead ID: " +
                        lead.getId()
        );

        mailSender.send(message);
    }

    private String safe(String value) {

        return value == null ||
                value.isBlank()
                ? "-"
                : value;
    }
}