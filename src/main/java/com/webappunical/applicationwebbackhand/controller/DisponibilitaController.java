package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dto.BloccoHotelDTO;
import com.webappunical.applicationwebbackhand.model.BloccoHotel;
import com.webappunical.applicationwebbackhand.service.DisponibilitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Blocchi di disponibilità di una struttura. La lettura è pubblica (serve al
 * calendario di prenotazione, che è visibile a tutti); creare/eliminare blocchi
 * è riservato all'host proprietario (o admin).
 */
@RestController
@RequestMapping("/api/hotel")
@CrossOrigin(origins = "http://localhost:4200")
public class DisponibilitaController {

    private final DisponibilitaService disponibilitaService;

    @Autowired
    public DisponibilitaController(DisponibilitaService disponibilitaService) {
        this.disponibilitaService = disponibilitaService;
    }

    @GetMapping("/{idHotel}/blocchi")
    public ResponseEntity<List<BloccoHotel>> getBlocchi(@PathVariable Integer idHotel) {
        return ResponseEntity.ok(disponibilitaService.getBlocchi(idHotel));
    }

    @PostMapping("/{idHotel}/blocchi")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> aggiungiBlocco(@PathVariable Integer idHotel,
                                            @RequestBody BloccoHotelDTO dto,
                                            Authentication auth) {
        try {
            BloccoHotel creato = disponibilitaService.aggiungiBlocco(
                    idHotel, dto.getDataInizio(), dto.getDataFine(), dto.getMotivo(), auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(creato);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/blocchi/{idBlocco}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> rimuoviBlocco(@PathVariable Integer idBlocco, Authentication auth) {
        try {
            disponibilitaService.rimuoviBlocco(idBlocco, auth.getName());
            return ResponseEntity.ok("Blocco rimosso.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
