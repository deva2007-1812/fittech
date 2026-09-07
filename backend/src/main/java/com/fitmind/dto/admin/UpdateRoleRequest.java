package com.fitmind.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(?i)(USER|ADMIN)$", message = "Role must be either USER or ADMIN")
    private String role;
}
