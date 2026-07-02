package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.ServizioDAO;
import com.webappunical.applicationwebbackhand.dto.HotelDTO;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.Servizio;
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
        h.setStato(dto.getStato());
        h.setCheckIn(dto.getCheckIn());
        h.setCheckOut(dto.getCheckOut());
        h.setTelefono(dto.getTelefono());
        h.setEmail(dto.getEmail());
        h.setNumCamere(dto.getNumCamere());
        h.setPrezzoMedio(dto.getPrezzoMedio());
        return h;
    }
}
