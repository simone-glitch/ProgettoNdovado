package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Utente;
import com.webappunical.applicationwebbackhand.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    public AuthController(AuthenticationManager authenticationManager,
                          CustomUserDetailsService customUserDetailsService,
                          UtenteJDBC utenteJDBC) {
        this.authenticationManager    = authenticationManager;
        this.customUserDetailsService = customUserDetailsService;
        this.utenteJDBC               = utenteJDBC;
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
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenziali non valide.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            Utente utente = customUserDetailsService.registraNuovoUtente(
                    request.get("nome"),
                    request.get("cognome"),
                    request.get("email"),
                    request.get("password"),
                    request.get("ruolo")   // GUEST (default) o HOST
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
