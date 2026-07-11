package com.resumerank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ResumeRankApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResumeRankApplication.class, args);
    }
}
