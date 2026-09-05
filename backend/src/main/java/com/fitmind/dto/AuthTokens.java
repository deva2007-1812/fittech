package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthTokens {
    private String accessToken;
    private String refreshToken;
}
