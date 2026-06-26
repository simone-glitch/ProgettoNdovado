package com.webappunical.applicationwebbackhand.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
public class FrontendRunner implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(FrontendRunner.class);

    @Override
    public void run(ApplicationArguments args) {
        try {
            String projectDir = System.getProperty("user.dir");
            File frontendDir = new File(projectDir, "frontend");

            new ProcessBuilder("cmd", "/c", "start", "cmd", "/k", "npm start")
                    .directory(frontendDir)
                    .start();

            logger.info("Frontend Angular avviato in una finestra separata su http://localhost:4200");
        } catch (Exception e) {
            logger.warn("Impossibile avviare il frontend automaticamente: {}", e.getMessage());
        }
    }
}
