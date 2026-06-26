package com.webappunical.applicationwebbackhand.dto;

public class ChatResponse {
    private String risposta;

    public ChatResponse(String risposta) {
        this.risposta = risposta;
    }

    public String getRisposta() {
        return risposta;
    }

    public void setRisposta(String risposta) {
        this.risposta = risposta;
    }
}
