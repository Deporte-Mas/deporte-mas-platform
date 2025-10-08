# Deporte+ Club Landing Page

Modern subscription landing page for Deporte+ Club, Costa Rica's premier sports streaming platform. Built with React, TypeScript, and integrated with Stripe for subscription management.

## Overview

This landing page handles user acquisition and subscription sign-ups for the Deporte+ Club platform. Features include:

- **Embedded Stripe Checkout** - Seamless subscription flow
- **Dual Environment Support** - Test and production modes
- **Supabase Integration** - User authentication and data management
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Meta Pixel Tracking** - Marketing analytics integration

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite** | Build tool and dev server |
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling framework |
| **shadcn/ui** | Component library |
| **Stripe** | Payment processing |
| **Supabase** | Backend (auth, database, edge functions) |
| **React Query** | Data fetching and caching |
| **React Router** | Client-side routing |

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn
- Supabase account
- Stripe account (test mode for development)

### Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>

# Navigate to landing page directory
cd deporte-mas-platform/deporte-mas-landing

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual keys (see Environment Variables section)

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

Configuration is managed through environment variables. See [.env.example](.env.example) for the complete list.

### Required Variables

```bash
VITE_SUPABASE_URL                 # Your Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY     # Supabase publishable key (formerly anon key)
VITE_STRIPE_TEST_PUBLISHABLE_KEY  # Stripe test publishable key
VITE_DEV_MODE=true                # Set to false for production
```

### Environment Templates

- `.env.development` - Pre-configured for local development
- `.env.production.template` - Template for production deployment

### Validation

Run environment validation before starting:

```bash
npm run validate-env
```

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run typecheck        # Type check without emitting
npm run validate-env     # Validate environment variables
npm run test:stripe      # Test Stripe configuration
npm run deploy:preview   # Build and preview with serve
```

## Stripe Integration

This project includes a complete Stripe subscription system with dual-environment support.

### Quick Setup

1. **Configure Environment**: Set `VITE_DEV_MODE=true` for testing
2. **Add Stripe Keys**: Add test publishable key to `.env`
3. **Test Configuration**: Run `npm run test:stripe`
4. **Test Purchase Flow**: See [scripts/test-purchase-flow.md](scripts/test-purchase-flow.md)

### Detailed Documentation

See [STRIPE_CONFIG.md](./STRIPE_CONFIG.md) for:
- Complete setup instructions
- Product and price configuration
- Webhook setup
- Environment variable reference
- Troubleshooting guide

## Project Structure

```
deporte-mas-landing/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Hero.tsx      # Landing sections
│   │   ├── PricingSection.tsx
│   │   └── StripeCheckout.tsx
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities and configs
│   ├── pages/            # Route pages
│   └── types/            # TypeScript types
├── scripts/              # Utility scripts
├── public/               # Static assets
└── ...config files
```

## Development Workflow

### Local Development

1. **Start Dev Server**: `npm run dev`
2. **Hot Reload**: Changes reflect immediately
3. **Type Checking**: Run `npm run typecheck` periodically
4. **Linting**: Fix issues with `npm run lint`

### Testing Subscriptions

Use Stripe test cards in development mode:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

See [test-purchase-flow.md](scripts/test-purchase-flow.md) for detailed testing instructions.

### DevModeRibbon

A visual indicator shows when running in development mode (when `VITE_DEV_MODE=true`). This ribbon appears at the top of the page to prevent confusion about which environment you're in.

## Deployment

### Build for Production

```bash
# Set production environment variables
cp .env.production.template .env

# Build
npm run build

# Preview build locally
npm run preview
```

### Environment Configuration

Before deploying:

1. Set `VITE_DEV_MODE=false`
2. Use production Stripe publishable key
3. Verify Supabase production URL and keys
4. Configure Meta Pixel ID (if using)

### Hosting Options

The built static files in `dist/` can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Related Documentation

- **Monorepo Root**: `../README.md` - Platform overview
- **Stripe Setup**: [STRIPE_CONFIG.md](./STRIPE_CONFIG.md)
- **Purchase Testing**: [scripts/test-purchase-flow.md](./scripts/test-purchase-flow.md)
- **Supabase Functions**: `../supabase/functions/` - Backend edge functions

## Known Issues & Future Work

### Asset Migration
Images currently use `/lovable-uploads/*` paths from initial prototyping. These need migration to Supabase Storage:

```bash
# Current paths (to be migrated):
/lovable-uploads/ba62bac6-7973-4695-85e0-ee7039862fec.png
/lovable-uploads/1e6893cd-c63f-45b0-9650-58f2434258da.png
# etc.
```

**Action Item**: Move images to Supabase Storage bucket and update component references.

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
```

**Stripe Not Loading**
- Check `VITE_STRIPE_TEST_PUBLISHABLE_KEY` is set
- Verify `VITE_DEV_MODE` matches your intent
- Run `npm run test:stripe` to validate configuration

**Supabase Connection Issues**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Check network connectivity
- Verify project is not paused in Supabase Dashboard

### Getting Help

- Check existing documentation in this repo
- Review Stripe integration logs in browser console
- Check Supabase logs in dashboard
- Verify environment variables with `npm run validate-env`

## License

Part of the Deporte+ platform. All rights reserved.
