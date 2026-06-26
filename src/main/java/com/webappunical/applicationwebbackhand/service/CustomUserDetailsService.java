package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UtenteJDBC      utenteJDBC;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public CustomUserDetailsService(UtenteJDBC utenteJDBC, PasswordEncoder passwordEncoder) {
        this.utenteJDBC      = utenteJDBC;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) {
            throw new UsernameNotFoundException("Utente non trovato con email: " + email);
        }
        if (utente.isBanned()) {
            throw new UsernameNotFoundException("Account bannato. Contatta l'amministratore.");
        }
        return new User(
                utente.getEmail(),
                utente.getPassword(),
                Collections.singletonList(() -> "ROLE_" + utente.getRuolo())
        );
    }

    @Transactional
    public Utente registraNuovoUtente(String nome, String cognome, String email, String password, String ruolo) {
        if (nome == null || nome.trim().isEmpty() || cognome == null || cognome.trim().isEmpty()
                || email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome, cognome ed email sono obbligatori.");
        }
        if (utenteJDBC.trovaPerEmail(email) != null) {
            throw new IllegalArgumentException("Email già registrata.");
        }
        if (password == null || !password.matches("^(?=.*[0-9])(?=.*[A-Z]).{8,}$")) {
            throw new IllegalArgumentException(
                    "La password deve avere almeno 8 caratteri, una lettera maiuscola e un numero.");
        }
        // Solo GUEST e HOST sono ruoli validi per la registrazione pubblica
        String ruoloFinale = ("HOST".equalsIgnoreCase(ruolo)) ? "HOST" : "GUEST";

        Utente nuovo = new Utente();
        nuovo.setNome(nome.trim());
        nuovo.setCognome(cognome.trim());
        nuovo.setEmail(email.trim());
        nuovo.setPassword(passwordEncoder.encode(password));
        nuovo.setRuolo(ruoloFinale);
        utenteJDBC.salva(nuovo);
        return utenteJDBC.trovaPerEmail(email);
    }
}
