package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.CameraDAO;
import com.webappunical.applicationwebbackhand.dao.HotelDAO;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Camera;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CameraService {

    private final CameraDAO  cameraDAO;
    private final HotelDAO   hotelDAO;
    private final UtenteJDBC utenteJDBC;

    @Autowired
    public CameraService(CameraDAO cameraDAO, HotelDAO hotelDAO, UtenteJDBC utenteJDBC) {
        this.cameraDAO  = cameraDAO;
        this.hotelDAO   = hotelDAO;
        this.utenteJDBC = utenteJDBC;
    }

    public List<Camera> getCamerePerHotel(Integer idHotel) {
        return cameraDAO.trovaPerHotel(idHotel);
    }

    public List<Camera> getCamereDisponibili(Integer idHotel) {
        return cameraDAO.trovaDisponibili(idHotel);
    }

    public Camera getCamera(Integer id) {
        Camera camera = cameraDAO.trovaPerId(id);
        if (camera == null) throw new RuntimeException("Camera non trovata con id: " + id);
        return camera;
    }

    @Transactional
    public Camera crea(Camera camera, String emailRichiedente) {
        verificaProprietaHotel(camera.getIdHotel(), emailRichiedente);
        Integer id = cameraDAO.salva(camera);
        camera.setId(id);
        return camera;
    }

    @Transactional
    public Camera aggiorna(Camera camera, String emailRichiedente) {
        Camera esistente = cameraDAO.trovaPerId(camera.getId());
        if (esistente == null) throw new RuntimeException("Camera non trovata.");
        verificaProprietaHotel(esistente.getIdHotel(), emailRichiedente);
        cameraDAO.aggiorna(camera);
        return camera;
    }

    @Transactional
    public void elimina(Integer id, String emailRichiedente) {
        Camera camera = cameraDAO.trovaPerId(id);
        if (camera == null) throw new RuntimeException("Camera non trovata.");
        verificaProprietaHotel(camera.getIdHotel(), emailRichiedente);
        cameraDAO.elimina(id);
    }

    private void verificaProprietaHotel(Integer idHotel, String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        Hotel hotel = hotelDAO.trovaPerId(idHotel);
        if (hotel == null) throw new RuntimeException("Hotel non trovato.");
        if ("ADMIN".equals(utente.getRuolo())) return;
        if (!hotel.getIdProprietario().equals(utente.getId())) {
            throw new SecurityException("Non sei il proprietario di questo hotel.");
        }
    }
}
