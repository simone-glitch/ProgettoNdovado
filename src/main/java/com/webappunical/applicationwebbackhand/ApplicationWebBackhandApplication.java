package com.webappunical.applicationwebbackhand;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ApplicationWebBackhandApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApplicationWebBackhandApplication.class, args);
    }

}
