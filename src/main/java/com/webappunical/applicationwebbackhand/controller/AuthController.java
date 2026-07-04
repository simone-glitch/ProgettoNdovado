package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Utente;
import com.webappunical.applicationwebbackhand.service.CustomUserDetailsService;
import com.webappunical.applicationwebbackhand.service.EmailService;
import com.webappunical.applicationwebbackhand.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthenticationManager     authenticationManager;
    private final CustomUserDetailsService  customUserDetailsService;
    private final UtenteJDBC               utenteJDBC;
    private final PasswordResetService     passwordResetService;
    private final EmailService             emailService;
    private final PasswordEncoder          passwordEncoder;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager,
                          CustomUserDetailsService customUserDetailsService,
                          UtenteJDBC utenteJDBC,
                          PasswordResetService passwordResetService,
                          EmailService emailService,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.customUserDetailsService = customUserDetailsService;
        this.utenteJDBC            = utenteJDBC;
        this.passwordResetService  = passwordResetService;
        this.emailService          = emailService;
        this.passwordEncoder       = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email    = request.get("email");
            String password = request.get("password");

            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
            SecurityContextHolder.getContext().setAuthentication(auth);

            Utente utente = utenteJDBC.trovaPerEmail(email);
            utente.setPassword(null);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login effettuato con successo!");
            response.put("userDetails", utente);
            return ResponseEntity.ok(response);
        } catch (LockedException e) {
            // Account bannato/sospeso: messaggio dedicato, distinto dalle credenziali errate.
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Il tuo account è stato temporaneamente sospeso. Contatta l'amministratore.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenziali non valide.");
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email obbligatoria.");
        }
        // Risponde sempre 200 per non rivelare se l'email è registrata
        Utente utente = utenteJDBC.trovaPerEmail(email.trim().toLowerCase());
        if (utente != null) {
            try {
                String token = passwordResetService.generaToken(email.trim().toLowerCase());
                emailService.inviaResetPassword(email.trim().toLowerCase(), utente.getNome(), token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Errore durante l'invio dell'email. Riprova più tardi.");
            }
        }
        return ResponseEntity.ok("Se l'email è registrata, riceverai a breve il link per reimpostare la password.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token       = request.get("token");
        String nuovaPassword = request.get("password");

        if (token == null || token.isBlank() || nuovaPassword == null || nuovaPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Token e nuova password sono obbligatori.");
        }
        if (nuovaPassword.length() < 6) {
            return ResponseEntity.badRequest().body("La password deve essere di almeno 6 caratteri.");
        }

        String email = passwordResetService.getEmailDaToken(token);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.GONE).body("Il link è scaduto o non valido. Richiedi un nuovo reset.");
        }

        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) {
            return ResponseEntity.badRequest().body("Utente non trovato.");
        }

        utenteJDBC.aggiornaPassword(utente.getId(), passwordEncoder.encode(nuovaPassword));
        passwordResetService.invalidaToken(token);

        return ResponseEntity.ok("Password aggiornata con successo. Puoi ora effettuare il login.");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            Utente utente = customUserDetailsService.registraNuovoUtente(
                    request.get("nome"),
                    request.get("cognome"),
                    request.get("email"),
                    request.get("password"),
                    request.get("ruolo"),   // GUEST (default) o HOST
                    request.get("telefono") // opzionale, univoco se valorizzato
            );
            utente.setPassword(null);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registrazione completata con successo!");
            response.put("userDetails", utente);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
