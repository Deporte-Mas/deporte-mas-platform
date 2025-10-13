# Implementation Plan

## Overview
This implementation plan breaks down the external subscription link feature into incremental, testable coding tasks. Each task builds on the previous work and references specific requirements from the requirements document.

---

## Tasks

- [ ] 1. Create environment configuration infrastructure
  - Create `.env.example` file with `EXPO_PUBLIC_SUBSCRIPTION_URL` template
  - Create `config/subscription.ts` module to read environment variables using `expo-constants`
  - Implement `getSubscriptionUrl()` function with fallback logic
  - Write unit tests for config module to verify env var loading and fallback behavior
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create URL validation utility
  - Create `utils/urlValidator.ts` file
  - Implement `isValidUrl()` function to validate HTTPS URLs
  - Implement `sanitizeUrl()` function to trim and clean URL strings
  - Write unit tests for URL validation edge cases (empty, malformed, http vs https)
  - _Requirements: 6.2_

- [ ] 3. Create user-facing message constants
  - Create `constants/messages.ts` file
  - Define Spanish error messages for all error scenarios
  - Define compliance warning dialog copy (title, message, buttons)
  - Export message constants for reuse across components
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

- [ ] 4. Implement subscription service core logic
  - Create `services/subscriptionService.ts` file
  - Define `SubscriptionServiceResult` and `SubscriptionError` types
  - Implement `openSubscriptionUrl()` function using `expo-web-browser`
  - Add platform detection logic (iOS, Android, Web) with platform-specific browser handling
  - Implement error handling for browser open failures
  - Write unit tests using mocked `WebBrowser` API
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Implement compliance warning dialog utility
  - Create `showSubscriptionWarning()` helper function using React Native `Alert.alert()`
  - Use message constants from `constants/messages.ts`
  - Configure two-button layout: "Cancelar" and "Continuar"
  - Add function to `services/subscriptionService.ts` or create separate `utils/subscriptionWarning.ts`
  - Test dialog display and button callbacks
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.3, 5.4_

- [ ] 6. Implement complete subscription flow orchestration
  - Implement `initiateSubscription()` function in `services/subscriptionService.ts`
  - Integrate compliance warning display as first step
  - Add URL retrieval from config module on user confirmation
  - Add URL validation before opening browser
  - Chain all steps: warning → get URL → validate → open browser
  - Implement error handling at each step with appropriate user messages
  - Write integration tests for complete flow
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 6.1, 6.2, 6.3_

- [ ] 7. Add subscription button to profile screen UI
  - Modify `app/profile.tsx` to add "Suscribirse" button in points section
  - Style button to match app design (gradient, colors, spacing)
  - Add button state management (loading, disabled states)
  - Position button below "Tus puntos" section
  - _Requirements: 4.1, 4.2_

- [ ] 8. Wire subscription button to service layer
  - Import `initiateSubscription` from subscription service into `app/profile.tsx`
  - Add `onPress` handler to subscription button
  - Implement loading state during subscription flow
  - Add error state handling with user-friendly error display
  - Test user flow: tap → warning → confirm → browser opens
  - _Requirements: 4.3, 6.1, 6.4_

- [ ] 9. Create environment variable file for development
  - Create `.env` file in project root (gitignored)
  - Add `EXPO_PUBLIC_SUBSCRIPTION_URL=https://deporte-mas-platform.vercel.app/`
  - Update `.gitignore` to exclude `.env` file
  - Document environment setup in project README or setup docs
  - _Requirements: 1.1, 1.2_

- [ ] 10. Cross-platform testing and refinement
  - Test complete flow on iOS simulator/device
  - Test complete flow on Android emulator/device
  - Test complete flow on web browser
  - Verify compliance warning displays correctly on all platforms
  - Verify external browser opens with correct URL on all platforms
  - Fix any platform-specific issues discovered
  - Verify error handling works correctly on all platforms
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Add error logging and monitoring
  - Add console.error logging for all error scenarios in subscription service
  - Include error context: error code, platform, timestamp, sanitized URL
  - Add try-catch blocks around all async operations
  - Log user actions: button tap, warning shown, warning confirmed/cancelled, browser opened
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 12. Write comprehensive unit tests for all modules
  - Write tests for `config/subscription.ts`: env var reading, fallback, validation
  - Write tests for `utils/urlValidator.ts`: valid/invalid URLs, edge cases
  - Write tests for `services/subscriptionService.ts`: flow orchestration, error handling, platform detection
  - Mock external dependencies: `expo-constants`, `expo-web-browser`, `Alert`
  - Achieve high code coverage (>80%)
  - _Requirements: All_

---

## Execution Notes

- **Order Matters:** Tasks should be completed sequentially as each builds on the previous
- **Testing:** Write tests immediately after implementing each module
- **Commits:** Create git commits after each completed task for clear history
- **Environment:** Restart Expo dev server after creating `.env` file (task 9)
- **Platforms:** Task 10 requires access to iOS, Android, and web platforms for thorough testing

---

## Task Completion Criteria

Each task is considered complete when:
1. Code is written and follows TypeScript best practices
2. Unit tests are written and passing
3. Code is manually tested in development environment
4. No console errors or warnings
5. All referenced requirements are satisfied

---

## Dependencies

All required packages are already installed:
- `expo-web-browser` (~15.0.7)
- `expo-constants` (~18.0.9)
- `react-native` (0.81.4)

No additional npm installations required.
