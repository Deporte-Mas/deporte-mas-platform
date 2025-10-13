# Implementation Plan: Mobile App Branding

## Overview
This implementation plan provides step-by-step coding tasks to build the Deporte Más branding system. Each task builds incrementally, focusing on test-driven development and best practices. Tasks are designed to be executed by a code-generation LLM with full context from the requirements and design documents.

---

## Phase 1: Foundation Setup

- [ ] 1. Create color constants module
  - Create `deporte-mas-mobile/constants/Colors.ts`
  - Define all brand color tokens (background, cards, text, impact, gradient)
  - Export as const object with TypeScript type
  - _Requirements: 1.1, 1.2_

- [ ] 2. Set up font assets directory structure
  - Create `deporte-mas-mobile/assets/fonts/` directory
  - Add placeholder comments for RomaGothic-Bold.otf and Geist font files
  - Document where to download fonts (Adobe Fonts, Google Fonts)
  - _Requirements: 2.1_

- [ ] 3. Create typography constants module
  - Create `deporte-mas-mobile/constants/Typography.ts`
  - Define font family names and loading configuration
  - Create title and body text style objects with uppercase transform for titles
  - Export fontAssets object for expo-font loader
  - _Requirements: 2.1, 2.2_

- [ ] 4. Create unified theme module
  - Create `deporte-mas-mobile/constants/Theme.ts`
  - Import and combine Colors and Typography
  - Add spacing scale (xs to xxl) and border radius tokens
  - Export type-safe Theme object
  - _Requirements: 7.1, 7.2, 7.3_

---

## Phase 2: Themed Components

- [ ] 5. Implement ThemedText component
  - [ ] 5.1 Create component file and basic structure
    - Create `deporte-mas-mobile/components/themed/ThemedText.tsx`
    - Define ThemedTextProps interface extending TextProps
    - Add variant prop ('title' | 'body') with default 'body'
    - _Requirements: 2.2, 7.4_
  - [ ] 5.2 Implement variant logic and uppercase transform
    - Apply typography styles based on variant prop
    - Automatically uppercase title variant text content
    - Merge custom styles with theme styles
    - Export component
    - _Requirements: 2.2, 2.5_

- [ ] 6. Implement ThemedView component
  - Create `deporte-mas-mobile/components/themed/ThemedView.tsx`
  - Define ThemedViewProps extending ViewProps
  - Apply brand background color by default
  - Set flex: 1 for full-screen layouts
  - Allow style overrides via style prop
  - Export component
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7. Implement GradientButton component
  - [ ] 7.1 Create component structure
    - Create `deporte-mas-mobile/components/themed/GradientButton.tsx`
    - Define GradientButtonProps interface (onPress, title, disabled, style)
    - Import LinearGradient from expo-linear-gradient
    - _Requirements: 3.1_
  - [ ] 7.2 Implement gradient and touch handling
    - Wrap LinearGradient in TouchableOpacity
    - Configure gradient colors from Theme.colors.gradient (start to end)
    - Set horizontal gradient (start {x:0,y:0}, end {x:1,y:0})
    - Apply activeOpacity for touch feedback
    - Use ThemedText with variant="title" for button text
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 7.3 Add styling and export
    - Create StyleSheet with padding, border radius, alignment
    - Handle disabled state with opacity
    - Export component
    - _Requirements: 3.4_

- [ ] 8. Implement Card components
  - [ ] 8.1 Create Card component structure
    - Create `deporte-mas-mobile/components/themed/Card.tsx`
    - Define CardProps extending ViewProps with variant prop
    - Add variant options: 'default' | 'sub'
    - _Requirements: 4.1, 4.2_
  - [ ] 8.2 Implement background hierarchy and styling
    - Apply Theme.colors.card for 'default' variant
    - Apply Theme.colors.subCard for 'sub' variant
    - Set default padding and border radius from Theme
    - Allow style prop overrides
    - Export Card component
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 9. Create themed components barrel export
  - Create `deporte-mas-mobile/components/themed/index.ts`
  - Export all themed components (ThemedText, ThemedView, GradientButton, Card)
  - Provides single import point for consumers
  - _Requirements: 7.4_

---

## Phase 3: Font Loading Integration

- [ ] 10. Update root layout with font loading
  - [ ] 10.1 Import font loading dependencies
    - Open `deporte-mas-mobile/app/_layout.tsx`
    - Import useFonts hook from expo-font
    - Import SplashScreen from expo-splash-screen
    - Import fontAssets from constants/Typography
    - _Requirements: 2.3_
  - [ ] 10.2 Implement font loading logic
    - Call SplashScreen.preventAutoHideAsync() at module level
    - Use useFonts hook with fontAssets
    - Create useEffect to hide splash screen when fonts load or error occurs
    - Return null while loading fonts
    - Handle font loading errors gracefully
    - _Requirements: 2.3, 2.4_
  - [ ] 10.3 Update background color to use theme token
    - Replace hardcoded backgroundColor in Stack screenOptions
    - Use Theme.colors.background instead of "#010017"
    - _Requirements: 5.1_

---

## Phase 4: Status Bar Configuration

- [ ] 11. Update app.json with brand status bar colors
  - Open `deporte-mas-mobile/app.json`
  - Update statusBarBackgroundColor to "#090B1C" (Theme.colors.background)
  - Verify statusBarStyle is "light-content" at root and iOS levels
  - Update android.statusBarBackgroundColor if exists
  - _Requirements: 8.1, 8.2, 8.3_

---

## Phase 5: Existing Screen Migration

- [ ] 12. Migrate login screen to branded components
  - [ ] 12.1 Update imports
    - Open `deporte-mas-mobile/app/login.tsx`
    - Import ThemedView, ThemedText, GradientButton from components/themed
    - Import Theme from constants/Theme
    - _Requirements: 7.4_
  - [ ] 12.2 Replace container with ThemedView
    - Replace root View with ThemedView component
    - Remove hardcoded backgroundColor from styles.container
    - Verify layout remains correct
    - _Requirements: 5.1_
  - [ ] 12.3 Update button to use GradientButton
    - Replace login button TouchableOpacity/LinearGradient with GradientButton
    - Pass onPress={handleLogin}, title="Enviar Magic Link"
    - Remove old button styles related to gradient
    - Test disabled state with loading prop
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 12.4 Replace hardcoded colors with theme tokens
    - Replace "#010017" with Theme.colors.background where found
    - Update any color references to use Theme.colors tokens
    - Verify visual consistency
    - _Requirements: 1.3_

- [ ] 13. Migrate index screen to branded components
  - [ ] 13.1 Update imports and container
    - Open `deporte-mas-mobile/app/index.tsx`
    - Import ThemedView, ThemedText from components/themed
    - Replace root View with ThemedView
    - _Requirements: 5.1, 7.4_
  - [ ] 13.2 Update text components and colors
    - Replace Text components with ThemedText where appropriate
    - Use variant="title" for headings
    - Replace hardcoded colors with Theme tokens
    - _Requirements: 2.2, 1.3_
  - [ ] 13.3 Update buttons to GradientButton if applicable
    - Identify CTAs that should use gradient buttons
    - Replace with GradientButton component
    - _Requirements: 3.1_

---

## Phase 6: Documentation

- [ ] 14. Add branding guidelines to README
  - [ ] 14.1 Create branding section structure
    - Open `deporte-mas-mobile/README.md`
    - Add "## Branding Guidelines" section after existing content
    - Create subsections for Colors, Typography, Components
    - _Requirements: 6.1, 6.2_
  - [ ] 14.2 Document color system
    - List all color tokens with hex values
    - Describe usage for each (background, cards, text, impact, gradients)
    - Provide code example of importing and using Theme.colors
    - _Requirements: 6.2_
  - [ ] 14.3 Document typography rules
    - Document RomaGothic Bold for titles (uppercase requirement)
    - Document Geist for body text
    - List font sources (Adobe Fonts, Google Fonts)
    - Provide usage examples with ThemedText component
    - _Requirements: 6.2_
  - [ ] 14.4 Document button gradient specifications
    - Document gradient direction and color stops
    - Show GradientButton component usage
    - Include props documentation
    - _Requirements: 6.2_
  - [ ] 14.5 Document card styling hierarchy
    - Explain card vs sub-card usage
    - Provide Card component examples
    - Document when to use each variant
    - _Requirements: 6.2_
  - [ ] 14.6 Add examples and best practices
    - Include complete component usage examples
    - Document common patterns (screen layouts, forms, buttons)
    - Add notes on avoiding hardcoded colors
    - Link to Theme constants for reference
    - _Requirements: 6.3, 6.4_

---

## Phase 7: Verification and Testing

- [ ] 15. Create example screen demonstrating all branding elements
  - Create `deporte-mas-mobile/app/branding-demo.tsx`
  - Build screen showcasing all themed components
  - Display color swatches with hex values
  - Show typography variants (title vs body)
  - Demonstrate gradient buttons in various states
  - Show card hierarchy (card within sub-card)
  - Add navigation to demo screen from index for testing
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 16. Audit remaining screens for hardcoded colors
  - Search codebase for hardcoded hex colors (#)
  - Create list of files requiring migration
  - Update each file to use Theme tokens instead
  - Test visual consistency across all screens
  - _Requirements: 1.3, 5.2_

---

## Success Criteria

Implementation is complete when:
- ✅ All constants modules (Colors, Typography, Theme) are created and exported
- ✅ All themed components (ThemedText, ThemedView, GradientButton, Card) work correctly
- ✅ Fonts load successfully on app launch without flash
- ✅ Status bar matches brand colors on iOS and Android
- ✅ Login and index screens use themed components
- ✅ README contains comprehensive branding guidelines with examples
- ✅ Branding demo screen displays all components correctly
- ✅ No hardcoded brand colors remain in codebase (except constants)
- ✅ TypeScript provides autocomplete for all theme tokens
- ✅ App visual appearance matches reference design

## Notes

- **Font Files:** RomaGothic Bold must be downloaded from Adobe Fonts. Geist fonts should be downloaded from Google Fonts or the official Geist repository. Place .otf or .ttf files in `assets/fonts/` directory.

- **Testing:** After each phase, test on both iOS and Android simulators/devices to ensure visual consistency.

- **Incremental Approach:** Complete tasks in order. Each task builds on previous work. Do not skip ahead.

- **One Task at a Time:** Execute one task, verify it works, then move to the next. This ensures quality and makes debugging easier.
