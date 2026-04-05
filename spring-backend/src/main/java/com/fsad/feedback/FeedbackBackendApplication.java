package com.fsad.feedback;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableMongoAuditing
public class FeedbackBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FeedbackBackendApplication.class, args);
    }
}
