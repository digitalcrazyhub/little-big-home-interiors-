package com.example.littlebighome.gallery.contact;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Collections;

@Configuration
public class GoogleSheetsConfig {

    @Value("${google.credentials.path}")
    private String credentialsPath;

    @Bean
    public Sheets googleSheetsClient() throws Exception {

        HttpTransport transport =
                GoogleNetHttpTransport.newTrustedTransport();

        GoogleCredentials credentials;

        try (FileInputStream inputStream =
                     new FileInputStream(credentialsPath)) {

            credentials =
                    GoogleCredentials
                            .fromStream(inputStream)
                            .createScoped(
                                    Collections.singleton(
                                            SheetsScopes.SPREADSHEETS
                                    )
                            );
        }

        return new Sheets.Builder(
                transport,
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials)
        )
                .setApplicationName("Little Big Home")
                .build();
    }
}