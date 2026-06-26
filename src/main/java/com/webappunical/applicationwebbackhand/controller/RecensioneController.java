package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dto.RecensioneDTO;
import com.webappunical.applicationwebbackhand.model.Recensione;
import com.webappunical.applicationwebbackhand.service.RecensioneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recensioni")
@CrossOrigin(origins = "http://localhost:4200")
public class RecensioneController {

    private final RecensioneService recensioneService;

    @Autowired
    public RecensioneController(RecensioneService recensioneService) {
        this.recensioneService = recensioneService;
    }

    @GetMapping("/hotel/{idHotel}")
    public ResponseEntity<List<Recensione>> getPerHotel(@PathVariable Integer idHotel) {
        return ResponseEntity.ok(recensioneService.getRecensioniHotel(idHotel));
    }

    @GetMapping("/mie")
    @PreAuthorize("hasAnyRole('GUEST','ADMIN')")
    public ResponseEntity<?> getMie(Authentication auth) {
        return ResponseEntity.ok(recensioneService.getRecensioniUtente(auth.getName()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('GUEST','ADMIN')")
    public ResponseEntity<?> aggiungi(@RequestBody RecensioneDTO dto, Authentication auth) {
        try {
            Recensione recensione = new Recensione();
            recensione.setTitolo(dto.getTitolo());
            recensione.setTesto(dto.getTesto());
            recensione.setVoto(dto.getVoto());
            recensione.setIdHotel(dto.getIdHotel());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(recensioneService.aggiungi(recensione, auth.getName()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> elimina(@PathVariable Integer id, Authentication auth) {
        try {
            recensioneService.elimina(id, auth.getName());
            return ResponseEntity.ok("Recensione eliminata.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
