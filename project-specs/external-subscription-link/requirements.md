# Requirements Document

## Introduction

The mobile application currently handles subscriptions through a hardcoded URL. This needs to be updated to redirect users to an external web platform (https://deporte-mas-platform.vercel.app/) for subscription purchases. This change is driven by Apple App Store and Google Play Store policies that require apps using external payment systems to display a warning to users before redirecting them outside the app.

This feature will implement a compliant external subscription flow that includes the mandatory disclosure warning, environment-based URL configuration, and a seamless user experience when navigating to the subscription purchase page.

## Requirements

### Requirement 1: Environment-Based Subscription URL Configuration
**User Story:** As a developer, I want the subscription URL to be configurable through environment variables, so that I can easily change the target URL across different environments (development, staging, production) without code changes.

#### Acceptance Criteria
1. WHEN the application initializes THEN the system SHALL load the subscription URL from an environment variable named `EXPO_PUBLIC_SUBSCRIPTION_URL`
2. IF the environment variable is not defined THEN the system SHALL fall back to the default URL `https://deporte-mas-platform.vercel.app/`
3. WHEN the subscription URL is needed THEN the system SHALL use the value from the environment configuration

### Requirement 2: Store Compliance Warning Dialog
**User Story:** As a user, I want to be informed before being redirected to an external payment platform, so that I understand I'm leaving the app to complete a purchase.

#### Acceptance Criteria
1. WHEN a user attempts to navigate to the subscription page THEN the system SHALL display a warning dialog before opening the external link
2. WHILE the warning dialog is displayed THE system SHALL show clear text explaining that payment will be processed on an external platform
3. IF the user confirms the warning THEN the system SHALL open the subscription URL in the device's default browser
4. IF the user cancels the warning THEN the system SHALL close the dialog and remain on the current screen
5. WHEN the warning dialog is displayed THEN the system SHALL comply with Apple App Store and Google Play Store external link requirements

### Requirement 3: External Browser Navigation
**User Story:** As a user, I want to be redirected to the subscription page in my mobile browser, so that I can complete the subscription purchase process.

#### Acceptance Criteria
1. WHEN the user confirms the compliance warning THEN the system SHALL open the subscription URL using the device's default browser
2. IF the browser fails to open THEN the system SHALL display an error message to the user
3. WHEN the external browser opens THEN the system SHALL pass the full subscription URL configured in the environment
4. WHILE the user is on the external subscription page THE mobile app SHALL remain in the background

### Requirement 4: User Trigger Points for Subscription Flow
**User Story:** As a user, I want clear entry points to start the subscription process, so that I can easily upgrade my account when needed.

#### Acceptance Criteria
1. WHEN a user is on the profile screen THEN the system SHALL display a subscription or upgrade button/option
2. WHEN a user attempts to access premium features THEN the system SHALL provide an option to subscribe
3. IF a user taps a subscription trigger point THEN the system SHALL initiate the compliance warning flow (Requirement 2)

### Requirement 5: Compliance Warning Copy
**User Story:** As a compliance officer, I want the warning message to meet Apple and Google store requirements, so that the app remains compliant with store policies.

#### Acceptance Criteria
1. WHEN the compliance warning is displayed THEN the system SHALL include text stating that purchases are made on an external website
2. WHEN the compliance warning is displayed THEN the system SHALL inform users that app store purchase protections do not apply
3. WHEN the compliance warning is displayed THEN the text SHALL be in Spanish (primary app language)
4. WHEN the compliance warning is displayed THEN the system SHALL use clear, non-technical language understandable by average users

### Requirement 6: Error Handling
**User Story:** As a user, I want to be informed if something goes wrong when trying to access the subscription page, so that I know what to do next.

#### Acceptance Criteria
1. IF the external browser fails to open THEN the system SHALL display an error message
2. IF the subscription URL is malformed or empty THEN the system SHALL log an error and display a user-friendly message
3. WHEN an error occurs THEN the system SHALL not crash or freeze the application
4. WHEN an error occurs THEN the user SHALL be able to retry the action or return to the previous screen

### Requirement 7: Platform Consistency
**User Story:** As a user on any platform (iOS, Android, Web), I want the subscription flow to work consistently, so that I have a reliable experience regardless of my device.

#### Acceptance Criteria
1. WHEN a user initiates the subscription flow on iOS THEN the system SHALL display the compliance warning and open the external browser
2. WHEN a user initiates the subscription flow on Android THEN the system SHALL display the compliance warning and open the external browser
3. IF the app is running on web THEN the system SHALL open the subscription URL in a new tab
4. WHEN the subscription flow completes THE behavior SHALL be consistent across all platforms (iOS, Android, Web)
