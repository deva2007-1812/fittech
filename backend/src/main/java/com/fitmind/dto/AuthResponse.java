package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private UserResponse user;
    private AuthTokens tokens;
}
