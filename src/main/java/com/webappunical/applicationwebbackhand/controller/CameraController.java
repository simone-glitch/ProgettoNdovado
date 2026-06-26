package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dto.CameraDTO;
import com.webappunical.applicationwebbackhand.model.Camera;
import com.webappunical.applicationwebbackhand.service.CameraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camere")
@CrossOrigin(origins = "http://localhost:4200")
public class CameraController {

    private final CameraService cameraService;

    @Autowired
    public CameraController(CameraService cameraService) {
        this.cameraService = cameraService;
    }

    @GetMapping("/hotel/{idHotel}")
    public ResponseEntity<List<Camera>> getPerHotel(@PathVariable Integer idHotel) {
        return ResponseEntity.ok(cameraService.getCamerePerHotel(idHotel));
    }

    @GetMapping("/hotel/{idHotel}/disponibili")
    public ResponseEntity<List<Camera>> getDisponibili(@PathVariable Integer idHotel) {
        return ResponseEntity.ok(cameraService.getCamereDisponibili(idHotel));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCamera(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(cameraService.getCamera(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> crea(@RequestBody CameraDTO dto, Authentication auth) {
        try {
            Camera camera = dtoToCamera(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    cameraService.crea(camera, auth.getName()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ResponseEntity<?> aggiorna(@PathVariable Integer id,
                                       @RequestBody CameraDTO dto,
                                       Authentication auth) {
        try {
            Camera camera = dtoToCamera(dto);
            camera.setId(id);
            return ResponseEntity.ok(cameraService.aggiorna(camera, auth.getName()));
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
            cameraService.elimina(id, auth.getName());
            return ResponseEntity.ok("Camera eliminata.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    private Camera dtoToCamera(CameraDTO dto) {
        Camera c = new Camera();
        c.setTipo(dto.getTipo());
        c.setDescrizione(dto.getDescrizione());
        c.setPrezzoNotte(dto.getPrezzoNotte());
        c.setCapienza(dto.getCapienza());
        c.setDisponibile(dto.isDisponibile());
        c.setIdHotel(dto.getIdHotel());
        return c;
    }
}
