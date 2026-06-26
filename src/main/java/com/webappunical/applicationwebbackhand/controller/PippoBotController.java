package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.dto.ChatRequest;
import com.webappunical.applicationwebbackhand.dto.ChatResponse;
import com.webappunical.applicationwebbackhand.model.Utente;
import com.webappunical.applicationwebbackhand.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class PippoBotController {
    private final GeminiService geminiservice;
    private final UtenteJDBC utenteJDBC;

    @Autowired
    public PippoBotController(GeminiService geminiService, UtenteJDBC utenteJDBC) {
        this.geminiservice = geminiService;
        this.utenteJDBC = utenteJDBC;
    }

    @PostMapping("/chiedi")
    public ChatResponse chiedi(@RequestBody ChatRequest message, Authentication authentication) {
        String emailLoggata = authentication.getName();
        Utente utente = utenteJDBC.trovaPerEmail(emailLoggata);
        
        if (utente == null) {
            throw new RuntimeException("Utente non trovato");
        }
        
        Long idSicuro = (long) utente.getId();

        String testoRisposta = geminiservice.chiediAgemini(message.getMessaggio(), idSicuro);
        return new ChatResponse(testoRisposta);
    }
}
