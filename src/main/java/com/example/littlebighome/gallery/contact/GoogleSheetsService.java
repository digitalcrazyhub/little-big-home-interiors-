package com.example.littlebighome.gallery.contact;

import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class GoogleSheetsService {

    private final Sheets sheetsClient;

    @Value("${google.sheets.spreadsheet-id}")
    private String spreadsheetId;

    @Value("${google.sheets.sheet-name}")
    private String sheet1;

    public GoogleSheetsService(
            Sheets sheetsClient
    ) {
        this.sheetsClient = sheetsClient;
    }

    public void addLead(
            ContactLead lead
    ) throws Exception {

        List<Object> row = Arrays.asList(
                lead.getId(),
                safe(lead.getName()),
                safe(lead.getEmail()),
                safe(lead.getPhone()),
                safe(lead.getProjectType()),
                safe(lead.getMessage()),
                lead.getCreatedAt() != null
                        ? lead.getCreatedAt().toString()
                        : ""
        );

        ValueRange body =
                new ValueRange()
                        .setValues(
                                List.of(row)
                        );

        sheetsClient
                .spreadsheets()
                .values()
                .append(
                        spreadsheetId,
                        "Sheet1!A:G",
                        body
                )
                .setValueInputOption(
                        "USER_ENTERED"
                )
                .setInsertDataOption(
                        "INSERT_ROWS"
                )
                .execute();

        System.out.println(
                "Google Sheet updated successfully."
        );
    }

    private String safe(String value) {

        if (value == null ||
                value.isBlank()) {

            return "";
        }

        return value;
    }
}