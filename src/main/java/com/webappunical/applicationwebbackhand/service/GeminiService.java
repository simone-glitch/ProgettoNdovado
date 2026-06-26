package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.MessaggioChatDAO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apikey;

    private final MessaggioChatDAO messaggioChatDAO;
    private final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    @Autowired
    public GeminiService(MessaggioChatDAO messaggioChatDAO) {
        this.messaggioChatDAO = messaggioChatDAO;
    }

    public String chiediAgemini(String domandaUtente, Long idUtente) {
        Map<String, Object> infoUtente = messaggioChatDAO.getAnagrafica(idUtente);
        List<Map<String, Object>> storicoChat = messaggioChatDAO.getUltimiMessaggi(idUtente);

        String username = (infoUtente != null && infoUtente.get("username") != null)
                ? infoUtente.get("username").toString()
                : "Utente Sconosciuto";
        String chat = formattaListaPerPrompt("Cronologia messaggi:", storicoChat);

        String istruzioni = String.format(
                "Tu sei PippoBot, l'assistente virtuale della piattaforma Ndovado per prenotazioni hotel. " +
                "L'utente si chiama %s.\n\n%s",
                username, chat
        );

        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", domandaUtente)))),
                "system_instruction", Map.of("parts", List.of(Map.of("text", istruzioni)))
        );

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> rispostaApi = restTemplate.postForObject(API_URL + apikey, requestBody, Map.class);
            return estraiTestoDallaMappa(rispostaApi);
        } catch (Exception e) {
            logger.error("Errore nella comunicazione con l'IA", e);
            return "Errore nella comunicazione con l'IA: " + e.getMessage();
        }
    }

    private String estraiTestoDallaMappa(Map<String, Object> risposta) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) risposta.get("candidates");
            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return parts.get(0).get("text").toString();
        } catch (Exception e) {
            return "Errore: impossibile leggere il testo dalla risposta di Google.";
        }
    }

    private String formattaListaPerPrompt(String titolo, List<Map<String, Object>> lista) {
        if (lista == null || lista.isEmpty()) {
            return titolo + " Nessun dato disponibile.";
        }
        StringBuilder sb = new StringBuilder(titolo + "\n");
        for (Map<String, Object> item : lista) {
            sb.append("- ");
            item.forEach((key, value) -> sb.append(String.format("%s: %s, ", key, value)));
            sb.setLength(sb.length() - 2);
            sb.append("\n");
        }
        return sb.toString();
    }
}
