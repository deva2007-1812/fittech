package com.fitmind.util;

import com.fitmind.entity.User;
import com.fitmind.exception.ResourceNotFoundException;
import com.fitmind.repository.UserRepository;
import com.fitmind.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolves the current authenticated user's ID from the SecurityContext.
 * Controllers must use this instead of trusting user IDs from the request body.
 */
@Component
@RequiredArgsConstructor
public class AuthUtils {

    private final UserRepository userRepository;

    public UUID getCurrentUserId() {
        String email = getCurrentEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }

    public String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found in security context");
        }
        return auth.getName();
    }
}
