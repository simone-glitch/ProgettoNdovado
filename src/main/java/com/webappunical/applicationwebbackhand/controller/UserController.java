package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.dto.ChangePasswordDTO;
import com.webappunical.applicationwebbackhand.model.Utente;
import com.webappunical.applicationwebbackhand.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utenti")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserService userService;
    private final UtenteJDBC  utenteJDBC;

    @Autowired
    public UserController(UserService userService, UtenteJDBC utenteJDBC) {
        this.userService = userService;
        this.utenteJDBC  = utenteJDBC;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Utente>> getTutti() {
        List<Utente> utenti = userService.getTuttiUtenti();
        utenti.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(utenti);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(defaultValue = "1")   int    page,
            @RequestParam(defaultValue = "10")  int    size,
            @RequestParam(required = false)     String name,
            @RequestParam(defaultValue = "ALL") String role) {

        List<Map<String, Object>> users = userService.searchUsers(page, size, name, role);
        int total = userService.countUsers(name, role);

        Map<String, Object> response = new HashMap<>();
        response.put("content",     users);
        response.put("currentPage", page);
        response.put("totalItems",  total);
        response.put("totalPages",  (int) Math.ceil((double) total / size));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profilo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfilo(Authentication auth) {
        try {
            return ResponseEntity.ok(userService.getProfilo(auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/profilo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> aggiornaProfilo(Authentication auth,
                                              @RequestBody Map<String, String> request) {
        try {
            Utente aggiornato = userService.aggiornaProfilo(auth.getName(), request);
            Map<String, Object> response = new HashMap<>();
            response.put("message",     "Profilo aggiornato con successo.");
            response.put("userDetails", aggiornato);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/profilo/cambia-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cambiaPassword(Authentication auth,
                                             @Valid @RequestBody ChangePasswordDTO dto) {
        try {
            userService.cambiaPassword(auth.getName(), dto);
            return ResponseEntity.ok("Password cambiata con successo.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/promuovi")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> promuovi(@PathVariable Integer id) {
        try {
            userService.promuoviAdAdmin(id);
            return ResponseEntity.ok("Utente promosso ad ADMIN.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/banna")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> banna(@PathVariable Integer id) {
        try {
            userService.bannaUtente(id);
            return ResponseEntity.ok("Utente bannato.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/sbanna")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sbanna(@PathVariable Integer id) {
        try {
            userService.sbannaUtente(id);
            return ResponseEntity.ok("Utente sbannato.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> elimina(@PathVariable Integer id) {
        try {
            userService.eliminaUtente(id);
            return ResponseEntity.ok("Utente eliminato.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
