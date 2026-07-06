package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.dto.ChangePasswordDTO;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class UserService {

    private final UtenteJDBC      utenteJDBC;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UtenteJDBC utenteJDBC, PasswordEncoder passwordEncoder) {
        this.utenteJDBC      = utenteJDBC;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Utente> getTuttiUtenti() {
        return utenteJDBC.trovaTutti();
    }

    public Utente getProfilo(String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        utente.setPassword(null);
        return utente;
    }

    @Transactional
    public Utente aggiornaProfilo(String emailAutenticata, Map<String, String> profileRequest) {
        Utente utente = utenteJDBC.trovaPerEmail(emailAutenticata);
        if (utente == null) throw new RuntimeException("Utente non trovato.");

        String nome      = validaNonVuoto(profileRequest.get("nome"),    "nome");
        String cognome   = validaNonVuoto(profileRequest.get("cognome"), "cognome");
        String nuovaEmail = profileRequest.get("email");

        if (nuovaEmail == null || nuovaEmail.trim().isEmpty())
            throw new IllegalArgumentException("L'email non può essere vuota.");
        nuovaEmail = nuovaEmail.trim();
        if (!nuovaEmail.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"))
            throw new IllegalArgumentException("Formato email non valido.");

        Utente altroConStessaEmail = utenteJDBC.trovaPerEmail(nuovaEmail);
        if (altroConStessaEmail != null && !Objects.equals(altroConStessaEmail.getId(), utente.getId()))
            throw new IllegalArgumentException("Email già utilizzata da un altro utente.");

        // Telefono: opzionale. Se valorizzato deve essere univoco tra gli utenti;
        // se lasciato vuoto viene azzerato (NULL) così non collide con altri campi vuoti.
        String telefono = profileRequest.get("telefono");
        if (telefono != null) telefono = telefono.trim();
        if (telefono != null && telefono.isEmpty()) telefono = null;
        if (telefono != null && !telefono.matches("\\d+")) {
            throw new IllegalArgumentException("Il numero di telefono deve contenere solo cifre (0-9).");
        }
        if (telefono != null) {
            Utente altroConStessoTelefono = utenteJDBC.trovaPerTelefono(telefono);
            if (altroConStessoTelefono != null && !Objects.equals(altroConStessoTelefono.getId(), utente.getId()))
                throw new IllegalArgumentException("Numero di telefono già utilizzato da un altro utente.");
        }

        utente.setNome(nome);
        utente.setCognome(cognome);
        utente.setEmail(nuovaEmail);
        utente.setTelefono(telefono);
        utenteJDBC.aggiorna(utente);
        utente.setPassword(null);
        return utente;
    }

    @Transactional
    public void cambiaPassword(String email, ChangePasswordDTO dto) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");

        if (!passwordEncoder.matches(dto.getOldPassword(), utente.getPassword()))
            throw new IllegalArgumentException("La vecchia password non è corretta.");

        String nuova = dto.getNewPassword();
        if (nuova == null || !nuova.matches("^(?=.*[A-Z])(?=.*\\d).{8,}$"))
            throw new IllegalArgumentException(
                    "La nuova password deve avere almeno 8 caratteri, una lettera maiuscola e un numero.");

        utenteJDBC.aggiornaPassword(utente.getId(), passwordEncoder.encode(nuova));
    }

    @Transactional
    public void promuoviAdAdmin(Integer idUtente) {
        Utente utente = utenteJDBC.trovaPerId(idUtente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        if ("ADMIN".equals(utente.getRuolo())) throw new RuntimeException("L'utente è già un admin.");
        utenteJDBC.promuoviAdAdmin(idUtente);
    }

    @Transactional
    public void bannaUtente(Integer idUtente) {
        Utente utente = utenteJDBC.trovaPerId(idUtente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        if ("ADMIN".equals(utente.getRuolo())) throw new RuntimeException("Non puoi bannare un admin.");
        utenteJDBC.setBanned(idUtente, true);
    }

    @Transactional
    public void sbannaUtente(Integer idUtente) {
        Utente utente = utenteJDBC.trovaPerId(idUtente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        utenteJDBC.setBanned(idUtente, false);
    }

    @Transactional
    public void eliminaUtente(Integer idUtente) {
        Utente utente = utenteJDBC.trovaPerId(idUtente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");

        long numAdmin = getTuttiUtenti().stream()
                .filter(u -> "ADMIN".equals(u.getRuolo()))
                .count();
        if ("ADMIN".equals(utente.getRuolo()) && numAdmin <= 1)
            throw new RuntimeException("Non puoi eliminare l'ultimo admin rimasto.");

        utenteJDBC.elimina(idUtente);
    }

    public List<Map<String, Object>> searchUsers(int page, int size, String name, String role) {
        return utenteJDBC.searchUsers(page, size, name, role);
    }

    public int countUsers(String name, String role) {
        return utenteJDBC.countUsers(name, role);
    }

    private String validaNonVuoto(String valore, String campo) {
        if (valore == null || valore.trim().isEmpty())
            throw new IllegalArgumentException("Il campo " + campo + " non può essere vuoto.");
        return valore.trim();
    }
}
