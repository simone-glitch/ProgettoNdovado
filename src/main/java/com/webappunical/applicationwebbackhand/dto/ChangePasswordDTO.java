package com.webappunical.applicationwebbackhand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ChangePasswordDTO {

    @NotBlank(message = "La vecchia password non può essere vuota")
    private String oldPassword;

    @NotBlank(message = "La nuova password non può essere vuota")
    @Size(min = 8, message = "La nuova password deve avere almeno 8 caratteri")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "La nuova password deve avere almeno 8 caratteri, almeno una lettera maiuscola e almeno un numero"
    )
    private String newPassword;

    public ChangePasswordDTO() {
    }

    public ChangePasswordDTO(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }

    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}