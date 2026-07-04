package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dto.AvviaChatDTO;
import com.webappunical.applicationwebbackhand.dto.NuovoMessaggioDTO;
import com.webappunical.applicationwebbackhand.model.Conversazione;
import com.webappunical.applicationwebbackhand.model.MessaggioConversazione;
import com.webappunical.applicationwebbackhand.service.MessaggisticaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Messaggistica privata ospite-host. Tutti gli endpoint richiedono
 * l'autenticazione: un utente vede e usa solo le proprie conversazioni.
 */
@RestController
@RequestMapping("/api/conversazioni")
@CrossOrigin(origins = "http://localhost:4200")
public class MessaggisticaController {

    private final MessaggisticaService messaggisticaService;

    @Autowired
    public MessaggisticaController(MessaggisticaService messaggisticaService) {
        this.messaggisticaService = messaggisticaService;
    }

    @GetMapping
    public ResponseEntity<List<Conversazione>> getConversazioni(Authentication auth) {
        return ResponseEntity.ok(messaggisticaService.getConversazioni(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<?> avvia(@RequestBody AvviaChatDTO dto, Authentication auth) {
        try {
            Conversazione c = messaggisticaService.avviaConversazione(auth.getName(), dto.getIdHotel());
            return ResponseEntity.status(HttpStatus.CREATED).body(c);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/assistenza")
    public ResponseEntity<?> avviaAssistenza(Authentication auth) {
        try {
            Conversazione c = messaggisticaService.avviaAssistenza(auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(c);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/archivia")
    public ResponseEntity<?> archivia(@PathVariable Integer id,
                                      @RequestParam boolean archiviata,
                                      Authentication auth) {
        try {
            return ResponseEntity.ok(messaggisticaService.archivia(id, auth.getName(), archiviata));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/messaggi/{idMessaggio}/segnala")
    public ResponseEntity<?> segnala(@PathVariable Integer idMessaggio, Authentication auth) {
        try {
            Conversazione c = messaggisticaService.segnalaMessaggio(idMessaggio, auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(c);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}/messaggi")
    public ResponseEntity<?> getMessaggi(@PathVariable Integer id, Authentication auth) {
        try {
            List<MessaggioConversazione> messaggi = messaggisticaService.getMessaggi(id, auth.getName());
            return ResponseEntity.ok(messaggi);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/messaggi")
    public ResponseEntity<?> invia(@PathVariable Integer id,
                                   @RequestBody NuovoMessaggioDTO dto,
                                   Authentication auth) {
        try {
            MessaggioConversazione m = messaggisticaService.inviaMessaggio(id, auth.getName(), dto.getTesto());
            return ResponseEntity.status(HttpStatus.CREATED).body(m);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
