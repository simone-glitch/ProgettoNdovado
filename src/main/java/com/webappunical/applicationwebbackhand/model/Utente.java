package com.webappunical.applicationwebbackhand.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class Utente {

    private Integer id;

    @NotBlank(message = "Il nome non può essere vuoto")
    private String nome;

    @NotBlank(message = "Il cognome non può essere vuoto")
    private String cognome;

    @NotBlank(message = "L'email non può essere vuota")
    private String email;

    @NotBlank(message = "La password non può essere vuota")
    @Size(min = 6, message = "La password deve avere almeno 6 caratteri")
    private String password;

    @NotBlank(message = "Il ruolo non può essere vuoto")
    private String ruolo; // ADMIN | HOST | GUEST

    // Opzionale, ma se presente deve essere univoco tra gli utenti.
    private String telefono;

    private boolean banned;

    public Utente() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCognome() { return cognome; }
    public void setCognome(String cognome) { this.cognome = cognome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRuolo() { return ruolo; }
    public void setRuolo(String ruolo) { this.ruolo = ruolo; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public boolean isBanned() { return banned; }
    public void setBanned(boolean banned) { this.banned = banned; }

    public interface UtenteDAO {
        void salva(Utente utente);
        Utente trovaPerEmail(String email);
    }
}
