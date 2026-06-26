package com.webappunical.applicationwebbackhand.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserProfileDTO {

    @NotBlank(message = "Il nome non può essere vuoto")
    @Size(min = 2, max = 100, message = "Il nome deve avere tra 2 e 100 caratteri")
    private String nome;

    @NotBlank(message = "Il cognome non può essere vuoto")
    @Size(min = 2, max = 100, message = "Il cognome deve avere tra 2 e 100 caratteri")
    private String cognome;

    @NotBlank(message = "L'email non può essere vuota")
    @Email(message = "Formato email non valido")
    @Size(max = 100, message = "L'email non può superare i 100 caratteri")
    private String email;

    // Getters and Setters
    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCognome() {
        return cognome;
    }

    public void setCognome(String cognome) {
        this.cognome = cognome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
