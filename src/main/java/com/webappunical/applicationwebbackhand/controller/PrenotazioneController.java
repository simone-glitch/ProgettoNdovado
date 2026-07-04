package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dto.PrenotazioneDTO;
import com.webappunical.applicationwebbackhand.model.Prenotazione;
import com.webappunical.applicationwebbackhand.service.PrenotazioneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/prenotazioni")
@CrossOrigin(origins = "http://localhost:4200")
public class PrenotazioneController {

    private final PrenotazioneService prenotazioneService;

    @Autowired
    public PrenotazioneController(PrenotazioneService prenotazioneService) {
        this.prenotazioneService = prenotazioneService;
    }

    @GetMapping("/camera/{idCamera}/occupazioni")
    public ResponseEntity<?> getOccupazioniCamera(@PathVariable Integer idCamera) {
        return ResponseEntity.ok(prenotazioneService.getOccupazioniCamera(idCamera));
    }

    @GetMapping("/puoi-recensire/{idHotel}")
    @PreAuthorize("hasRole('GUEST')")
    public ResponseEntity<?> puoiRecensire(@PathVariable Integer idHotel, Authentication auth) {
        return ResponseEntity.ok(prenotazioneService.puoiRecensire(auth.getName(), idHotel));
    }

    @GetMapping("/mie")
    @PreAuthorize("hasAnyRole('GUEST','HOST','ADMIN')")
    public ResponseEntity<?> getMie(Authentication auth) {
        try {
            return ResponseEntity.ok(prenotazioneService.getPrenotazioniUtente(auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/hotel/{idHotel}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> getPerHotel(@PathVariable Integer idHotel) {
        return ResponseEntity.ok(prenotazioneService.getPrenotazioniHotel(idHotel));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTutte() {
        return ResponseEntity.ok(prenotazioneService.getTutte());
    }

    // Solo i GUEST prenotano: host e admin, per prenotare, devono accedere con un
    // profilo guest. La UI lo comunica esplicitamente.
    @PostMapping
    @PreAuthorize("hasRole('GUEST')")
    public ResponseEntity<?> crea(@RequestBody PrenotazioneDTO dto, Authentication auth) {
        try {
            Prenotazione prenotazione = new Prenotazione();
            prenotazione.setDataCheckin(LocalDate.parse(dto.getDataCheckin()));
            prenotazione.setDataCheckout(LocalDate.parse(dto.getDataCheckout()));
            prenotazione.setNumOspiti(dto.getNumOspiti());
            prenotazione.setIdCamera(dto.getIdCamera());

            Prenotazione creata = prenotazioneService.crea(prenotazione, auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(creata);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/stato")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> aggiornaStato(@PathVariable Integer id,
                                            @RequestBody Map<String, String> body,
                                            Authentication auth) {
        try {
            String nuovoStato = body.get("stato");
            prenotazioneService.aggiornaStato(id, nuovoStato, auth.getName());
            return ResponseEntity.ok("Stato aggiornato a: " + nuovoStato);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> elimina(@PathVariable Integer id, Authentication auth) {
        try {
            prenotazioneService.elimina(id, auth.getName());
            return ResponseEntity.ok("Prenotazione eliminata.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
