package com.webappunical.applicationwebbackhand.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.File;

/**
 * Avvia automaticamente il frontend Angular (npm start) all'avvio del backend,
 * come comodità in sviluppo.
 *
 * <p>{@code @Profile("!test")}: il runner NON deve partire durante i test
 * ({@code @SpringBootTest}), altrimenti ogni esecuzione della suite aprirebbe
 * una finestra e proverebbe a lanciare Angular. In esecuzione normale il
 * profilo "test" non è attivo, quindi il comportamento resta invariato.</p>
 */
@Component
@Profile("!test")
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
