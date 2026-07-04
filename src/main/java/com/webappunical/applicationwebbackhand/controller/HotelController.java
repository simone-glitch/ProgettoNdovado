package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.ServizioDAO;
import com.webappunical.applicationwebbackhand.dto.HotelDTO;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.Servizio;
import com.webappunical.applicationwebbackhand.model.StatoHotel;
import com.webappunical.applicationwebbackhand.service.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hotel")
@CrossOrigin(origins = "http://localhost:4200")
public class HotelController {

    private final HotelService   hotelService;
    private final ServizioDAO    servizioDAO;

    @Autowired
    public HotelController(HotelService hotelService, ServizioDAO servizioDAO) {
        this.hotelService = hotelService;
        this.servizioDAO  = servizioDAO;
    }

    // ----------------------------------------------------------------
    // Endpoint pubblici (ricerca e dettaglio)
    // ----------------------------------------------------------------

    @GetMapping
    public ResponseEntity<List<Hotel>> cerca(
            @RequestParam(required = false) String  citta,
            @RequestParam(required = false) Integer stelle,
            @RequestParam(required = false) Double  prezzoMax,
            @RequestParam(required = false) Integer numOspiti) {
        return ResponseEntity.ok(hotelService.cerca(citta, stelle, prezzoMax, numOspiti));
    }

    @GetMapping("/tutti")
    public ResponseEntity<List<Hotel>> getTutti() {
        return ResponseEntity.ok(hotelService.getTutti());
    }

    // Vista di moderazione ADMIN: tutte le strutture (tranne le bozze altrui),
    // con l'indicazione del proprietario. Riservata all'ADMIN.
    @GetMapping("/gestione")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Hotel>> getPerGestione() {
        return ResponseEntity.ok(hotelService.getTuttiPerAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDettaglio(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(hotelService.getDettaglio(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/servizi")
    public ResponseEntity<List<Servizio>> getServizi() {
        return ResponseEntity.ok(servizioDAO.trovaTutti());
    }

    // ----------------------------------------------------------------
    // Endpoint per HOST autenticato
    // ----------------------------------------------------------------

    @GetMapping("/miei")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<List<Hotel>> getMiei(Authentication auth) {
        return ResponseEntity.ok(hotelService.getHotelDelHost(auth.getName()));
    }

    // ----------------------------------------------------------------
    // Transizioni di stato (ciclo di vita della struttura)
    // La legalità della transizione è validata nel service in base a
    // stato corrente + ruolo; qui il @PreAuthorize è il gate grossolano.
    // ----------------------------------------------------------------

    /** HOST proprietario: invia la bozza (o una rifiutata) in revisione. */
    @PutMapping("/{id}/invia-revisione")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> inviaInRevisione(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.IN_REVISIONE, auth);
    }

    /** HOST proprietario: mette in pausa una struttura pubblicata. */
    @PutMapping("/{id}/disattiva")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> disattiva(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.NON_ATTIVO, auth);
    }

    /** HOST proprietario: riattiva una struttura messa in pausa (NON_ATTIVO → PUBBLICATO). */
    @PutMapping("/{id}/attiva")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> attiva(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.PUBBLICATO, auth);
    }

    /** ADMIN: approva una struttura in revisione (IN_REVISIONE → PUBBLICATO). */
    @PutMapping("/{id}/approva")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approva(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.PUBBLICATO, auth);
    }

    /** ADMIN: respinge una struttura in revisione. */
    @PutMapping("/{id}/rifiuta")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rifiuta(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.RIFIUTATO, auth);
    }

    /** ADMIN: sospende una struttura (moderazione). */
    @PutMapping("/{id}/sospendi")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sospendi(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.SOSPESO, auth);
    }

    /** ADMIN: revoca la sospensione (SOSPESO → PUBBLICATO). */
    @PutMapping("/{id}/riattiva")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> riattiva(@PathVariable Integer id, Authentication auth) {
        return transizione(id, StatoHotel.PUBBLICATO, auth);
    }

    // Helper condiviso: mappa le eccezioni del service sugli status HTTP corretti.
    private ResponseEntity<?> transizione(Integer id, StatoHotel target, Authentication auth) {
        try {
            return ResponseEntity.ok(hotelService.cambiaStato(id, target.name(), auth.getName()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> crea(@RequestBody HotelDTO dto, Authentication auth) {
        try {
            Hotel hotel = dtoToHotel(dto);
            Hotel creato = hotelService.crea(hotel, auth.getName());
            if (dto.getIdServizi() != null && !dto.getIdServizi().isEmpty()) {
                hotelService.aggiornaServizi(creato.getId(), dto.getIdServizi(), auth.getName());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(creato);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> aggiorna(@PathVariable Integer id,
                                       @RequestBody HotelDTO dto,
                                       Authentication auth) {
        try {
            Hotel hotel = dtoToHotel(dto);
            hotel.setId(id);
            Hotel aggiornato = hotelService.aggiorna(hotel, auth.getName());
            if (dto.getIdServizi() != null) {
                hotelService.aggiornaServizi(id, dto.getIdServizi(), auth.getName());
            }
            return ResponseEntity.ok(aggiornato);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> elimina(@PathVariable Integer id, Authentication auth) {
        try {
            hotelService.elimina(id, auth.getName());
            return ResponseEntity.ok("Hotel eliminato con successo.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/servizi")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> aggiornaServizi(@PathVariable Integer id,
                                              @RequestBody List<Integer> idServizi,
                                              Authentication auth) {
        try {
            hotelService.aggiornaServizi(id, idServizi, auth.getName());
            return ResponseEntity.ok("Servizi aggiornati.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/foto")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> aggiungiFoto(@PathVariable Integer id,
                                           @RequestBody Map<String, String> body,
                                           Authentication auth) {
        try {
            hotelService.aggiungiFoto(id, body.get("urlFoto"), body.get("didascalia"), auth.getName());
            return ResponseEntity.ok("Foto aggiunta.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // Sostituisce l'intera galleria dell'hotel (usato dal wizard: invia la lista
    // completa delle foto — data URL base64 o URL esterni — dopo il salvataggio).
    @PutMapping("/{id}/foto")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> sostituisciFoto(@PathVariable Integer id,
                                              @RequestBody List<String> foto,
                                              Authentication auth) {
        try {
            hotelService.sostituisciFoto(id, foto, auth.getName());
            return ResponseEntity.ok("Foto aggiornate.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/foto/{idFoto}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> eliminaFoto(@PathVariable Integer id,
                                          @PathVariable Integer idFoto,
                                          Authentication auth) {
        try {
            hotelService.eliminaFoto(idFoto, id, auth.getName());
            return ResponseEntity.ok("Foto eliminata.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    private Hotel dtoToHotel(HotelDTO dto) {
        Hotel h = new Hotel();
        h.setNome(dto.getNome());
        h.setDescrizione(dto.getDescrizione());
        h.setCitta(dto.getCitta());
        h.setIndirizzo(dto.getIndirizzo());
        h.setStelle(dto.getStelle());
        h.setLatitudine(dto.getLatitudine());
        h.setLongitudine(dto.getLongitudine());
        // Lo stato NON si imposta qui: creazione → BOZZA (forzato nel service),
        // update → invariato. Le transizioni passano dagli endpoint dedicati.
        h.setCheckIn(dto.getCheckIn());
        h.setCheckOut(dto.getCheckOut());
        h.setTelefono(dto.getTelefono());
        h.setEmail(dto.getEmail());
        h.setNumCamere(dto.getNumCamere());
        h.setPrezzoMedio(dto.getPrezzoMedio());
        return h;
    }
}
