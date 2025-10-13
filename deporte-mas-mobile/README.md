# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Branding Guidelines

This section documents the Deporte Más brand identity implementation for the mobile app. All UI components should follow these guidelines to maintain visual consistency.

### Colors

The Deporte Más color palette uses a dark theme with bold accent colors:

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `background` | `#090B1C` | Main app background, screen containers |
| `card` | `#111536` | Primary card backgrounds, content containers |
| `subCard` | `#1D2255` | Nested cards, secondary content containers |
| `text` | `#FFFFFF` | All text content (white) |
| `impact.red` | `#E12F23` | Accent color, gradient end, alerts |
| `impact.blue` | `#222DC2` | Accent color, gradient start, highlights |
| `gradient.start` | `#222DC2` | Button gradient start (blue) |
| `gradient.end` | `#E12F23` | Button gradient end (red) |

**Usage Example:**
```typescript
import { Theme } from '../constants/Theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background,
  },
  card: {
    backgroundColor: Theme.colors.card,
  },
  text: {
    color: Theme.colors.text,
  },
});
```

**Rules:**
- ❌ Never use hardcoded hex values in components
- ✅ Always reference `Theme.colors` tokens
- ✅ Use `ThemedView` for screen containers to ensure consistent backgrounds

### Typography

The app uses two primary fonts that establish clear visual hierarchy:

#### Fonts

| Font | Source | Usage |
|------|--------|-------|
| **RomaGothic Bold** | Adobe Fonts | Titles, headings, button text |
| **Geist** | Google Fonts | Body text, descriptions, labels |

#### Font Files Required

Place these files in `assets/fonts/`:
- `RomaGothic-Bold.otf` (from Adobe Fonts)
- `Geist-Regular.otf`
- `Geist-Medium.otf`
- `Geist-SemiBold.otf`
- `Geist-Bold.otf`

#### Typography Rules

1. **Titles (RomaGothic Bold)**
   - ✅ ALWAYS display in UPPERCASE
   - Use for: Screen titles, section headings, button labels, emphasis text
   - Implemented automatically via `ThemedText` component with `variant="title"`

2. **Body Text (Geist)**
   - Use for: Paragraphs, descriptions, input labels, helper text
   - Available in Regular, Medium, SemiBold, Bold weights
   - Implemented via `ThemedText` component with `variant="body"` (default)

**Usage Example:**
```typescript
import { ThemedText } from '../components/themed';

// Title - automatically uppercase
<ThemedText variant="title">
  Revive los mejores momentos
</ThemedText>

// Body text
<ThemedText variant="body">
  Accede a repeticiones de los mejores momentos del programa
</ThemedText>
```

### Buttons

Brand buttons use a horizontal gradient from blue to red, creating a distinctive visual identity.

#### Gradient Button

**Specification:**
- Colors: `#222DC2` (left) → `#E12F23` (right)
- Direction: Horizontal (left to right)
- Text: RomaGothic Bold, UPPERCASE, white
- Border radius: 8px
- Padding: 15px vertical, 30px horizontal

**Usage Example:**
```typescript
import { GradientButton } from '../components/themed';

<GradientButton
  title="Ingresar"
  onPress={handleLogin}
  disabled={loading}
/>
```

**When to Use:**
- ✅ Primary call-to-action buttons
- ✅ Form submission buttons
- ✅ Navigation actions that require emphasis
- ❌ Secondary actions (use outlined or text buttons)
- ❌ Destructive actions (use impact.red solid color)

### Cards

Cards provide visual hierarchy through a two-tier background color system.

#### Card Hierarchy

| Variant | Background | Usage |
|---------|------------|-------|
| `default` | `#111536` | Primary content containers |
| `sub` | `#1D2255` | Nested content within cards |

**Specifications:**
- Border radius: 12px (default)
- Padding: 16px (default)
- Can be nested: `Card` > `Card variant="sub"`

**Usage Example:**
```typescript
import { Card } from '../components/themed';

// Primary card
<Card>
  <ThemedText variant="title">Título Principal</ThemedText>

  // Nested sub-card
  <Card variant="sub">
    <ThemedText>Contenido secundario</ThemedText>
  </Card>
</Card>
```

**Rules:**
- ✅ Use `default` for top-level content containers
- ✅ Use `sub` for nested content within cards
- ✅ Maintain consistent padding and border radius
- ❌ Don't nest more than 2 levels deep

### Component Library

The app provides themed components that automatically apply branding:

| Component | Purpose | Import |
|-----------|---------|--------|
| `ThemedView` | Screen container with brand background | `components/themed` |
| `ThemedText` | Text with typography rules | `components/themed` |
| `GradientButton` | Branded CTA button | `components/themed` |
| `Card` | Content container with hierarchy | `components/themed` |

**Full Example:**
```typescript
import { ThemedView, ThemedText, GradientButton, Card } from '../components/themed';

export default function MyScreen() {
  return (
    <ThemedView>
      <ThemedText variant="title">Screen Title</ThemedText>

      <Card>
        <ThemedText variant="body">
          This is a card with branded styling
        </ThemedText>

        <GradientButton
          title="Action"
          onPress={handleAction}
        />
      </Card>
    </ThemedView>
  );
}
```

### Status Bar

The status bar is configured to match the brand's dark aesthetic:

**Configuration:**
- Style: `light-content` (white text/icons)
- Background: `#090B1C` (matches app background)
- Hidden: No (visible on all screens)

**Implementation:**
Configured in `app.json`:
```json
{
  "statusBarStyle": "light-content",
  "statusBarBackgroundColor": "#090B1C"
}
```

### Best Practices

#### ✅ Do
- Use `ThemedView` for all screen containers
- Use `ThemedText` for all text (auto-applies branding)
- Import colors from `Theme.colors` constants
- Use `GradientButton` for primary CTAs
- Follow card hierarchy (default → sub)
- Keep titles uppercase (automatic with `variant="title"`)
- Test on both iOS and Android

#### ❌ Don't
- Hardcode hex color values
- Mix custom fonts with brand fonts
- Override uppercase transformation for titles
- Create custom gradient buttons
- Nest cards more than 2 levels
- Use light/bright colors that clash with dark theme

### Reference Implementation

See the branding specification documents in `project-specs/mobile-app-branding/`:
- `requirements.md` - Detailed requirements and acceptance criteria
- `design.md` - Complete system design and architecture
- `tasks.md` - Implementation task breakdown

### Visual Reference

The branding is based on the Deporte Más design system featuring:
- Dark, immersive backgrounds for content focus
- Bold gradient buttons for clear calls-to-action
- Uppercase titles with RomaGothic for impact
- Clean, readable body text with Geist
- Layered card system for content organization

For questions or clarifications, refer to the design documentation or consult the design team.
