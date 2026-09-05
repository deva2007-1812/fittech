package com.fitmind.service;

import com.fitmind.dto.*;
import com.fitmind.entity.User;
import com.fitmind.entity.UserProfile;
import com.fitmind.exception.ResourceNotFoundException;
import com.fitmind.fitness.FitnessCalculationService;
import com.fitmind.repository.UserProfileRepository;
import com.fitmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final FitnessCalculationService fitnessCalculationService;

    public UserResponse getUserResponse(UUID userId) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        boolean profileComplete = profile != null && profile.getAge() != null;
        return toUserResponse(user, profile, profileComplete);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, ProfileRequest request) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().user(user).build());

        applyProfileRequest(profile, request);
        fitnessCalculationService.applyTargets(profile);
        userProfileRepository.save(profile);

        return toUserResponse(user, profile, true);
    }

    @Transactional
    public UserResponse completeOnboarding(UUID userId, ProfileRequest request) {
        return updateProfile(userId, request);
    }

    public ProfileResponse getProfile(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found. Please complete onboarding."));
        return toProfileResponse(profile);
    }

    @Transactional
    public ProfileResponse saveProfile(UUID userId, ProfileRequest request) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().user(user).build());

        applyProfileRequest(profile, request);
        fitnessCalculationService.applyTargets(profile);
        profile = userProfileRepository.save(profile);
        return toProfileResponse(profile);
    }

    public DailyTargetsResponse getDailyTargets(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null || profile.getDailyCalorieTarget() == null) {
            return DailyTargetsResponse.builder()
                    .calories(2000).protein(150.0).carbs(250.0).fat(55.0).water(2500)
                    .build();
        }
        return DailyTargetsResponse.builder()
                .calories(profile.getDailyCalorieTarget())
                .protein(profile.getDailyProteinTarget() != null ? profile.getDailyProteinTarget().doubleValue() : 150.0)
                .carbs(profile.getDailyCarbohydrateTarget() != null ? profile.getDailyCarbohydrateTarget().doubleValue() : 250.0)
                .fat(profile.getDailyFatTarget() != null ? profile.getDailyFatTarget().doubleValue() : 55.0)
                .water(profile.getDailyWaterTarget() != null ? profile.getDailyWaterTarget() : 2500)
                .build();
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
    }

    private void applyProfileRequest(UserProfile profile, ProfileRequest request) {
        if (request.getAge() != null) profile.setAge(request.getAge());
        if (request.getHeight() != null) profile.setHeight(BigDecimal.valueOf(request.getHeight()));
        if (request.getWeight() != null) profile.setWeight(BigDecimal.valueOf(request.getWeight()));
        if (request.getActivityLevel() != null) profile.setActivityLevel(request.getActivityLevel());
        if (request.getFitnessGoal() != null) profile.setFitnessGoal(request.getFitnessGoal());
    }

    private UserResponse toUserResponse(User user, UserProfile profile, boolean profileComplete) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .name(user.getName())
                .profileComplete(profileComplete)
                .createdAt(user.getCreatedAt());

        if (profile != null) {
            builder.age(profile.getAge())
                   .height(profile.getHeight() != null ? profile.getHeight().doubleValue() : null)
                   .weight(profile.getWeight() != null ? profile.getWeight().doubleValue() : null)
                   .activityLevel(profile.getActivityLevel())
                   .fitnessGoal(profile.getFitnessGoal());
        }
        return builder.build();
    }

    private ProfileResponse toProfileResponse(UserProfile profile) {
        return ProfileResponse.builder()
                .userId(profile.getUser().getId().toString())
                .age(profile.getAge())
                .height(profile.getHeight() != null ? profile.getHeight().doubleValue() : null)
                .weight(profile.getWeight() != null ? profile.getWeight().doubleValue() : null)
                .activityLevel(profile.getActivityLevel())
                .fitnessGoal(profile.getFitnessGoal())
                .dailyCalorieTarget(profile.getDailyCalorieTarget())
                .dailyProteinTarget(profile.getDailyProteinTarget() != null ? profile.getDailyProteinTarget().doubleValue() : null)
                .dailyCarbohydrateTarget(profile.getDailyCarbohydrateTarget() != null ? profile.getDailyCarbohydrateTarget().doubleValue() : null)
                .dailyFatTarget(profile.getDailyFatTarget() != null ? profile.getDailyFatTarget().doubleValue() : null)
                .dailyWaterTarget(profile.getDailyWaterTarget())
                .build();
    }
}
