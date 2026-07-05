package com.webappunical.applicationwebbackhand;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Profilo "test" attivo: esclude FrontendRunner (@Profile("!test")), così la
// suite non avvia Angular in una finestra separata a ogni esecuzione.
@SpringBootTest
@ActiveProfiles("test")
class ApplicationWebBackhandApplicationTests {

    @Test
    void contextLoads() {
    }

}
