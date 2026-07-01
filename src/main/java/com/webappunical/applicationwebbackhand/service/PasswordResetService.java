package com.webappunical.applicationwebbackhand.service;

import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private static final long SCADENZA_MS = 60 * 60 * 1000L; // 1 ora

    private final ConcurrentHashMap<String, TokenEntry> tokenStore = new ConcurrentHashMap<>();

    public String generaToken(String email) {
        // Rimuovi eventuali token precedenti per questa email
        tokenStore.entrySet().removeIf(e -> e.getValue().email().equals(email));

        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new TokenEntry(email, System.currentTimeMillis() + SCADENZA_MS));
        return token;
    }

    public String getEmailDaToken(String token) {
        TokenEntry entry = tokenStore.get(token);
        if (entry == null || entry.isScaduto()) {
            tokenStore.remove(token);
            return null;
        }
        return entry.email();
    }

    public void invalidaToken(String token) {
        tokenStore.remove(token);
    }

    private record TokenEntry(String email, long scadeA) {
        boolean isScaduto() {
            return System.currentTimeMillis() > scadeA;
        }
    }
}
