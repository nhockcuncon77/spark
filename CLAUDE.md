# CLAUDE.md - Spark Codebase Documentation

## Project Overview

**Spark** is a personality-first dating app where users connect based on personality before photos are revealed. The codebase is a monorepo with three main workspaces:

- **`expo/`** - React Native mobile app (iOS/Android) built with Expo
- **`landing/`** - Marketing website built with Vite + React  
- **`services/`** - Go backend API with GraphQL

---

## Quick Commands

### Root Level (bun/npm)

```bash
# Database
bun db:generate     # Generate Drizzle migrations
bun db:migrate      # Apply migrations

# GraphQL
bun gqlgen          # Regenerate GraphQL types and resolvers

# Start
bun start:backend   # Run Go server locally
bun start:app       # Start Expo dev server

# Build & Deploy
bun build:backend   # Build Linux binary
bun build:docker    # Build Docker image
bun deploy:docker   # Push and deploy to Kubernetes

# Version
bun release:patch   # Bump patch version
bun release:minor   # Bump minor version
```

### Expo (`cd expo`)

```bash
bunx expo start --clear  # Dev server
bunx expo run:ios        # iOS build
bunx expo run:android    # Android build
```

### Landing (`cd landing`)

```bash
npm run dev     # Dev server (Vite)
npm run build   # Production build
```

### Services (`cd services`)

```bash
go run main.go           # Run server
go build -o spark .    # Build binary
go test ./...            # Run tests
```

---

## Database (`db/`)

**Tech**: Drizzle ORM + PostgreSQL (Neon serverless)

### Schema Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles with photos, bio, personality traits |
| `matches` | Match pairs with compatibility scores |
| `chats` | Message history per match |
| `posts` | Community feed posts |
| `comments` | Post comments with nesting |
| `swipes` | Like/dislike/superlike actions |
| `reports` | User/content reports |
| `user_files` | S3 file references |
| `user_profile_activities` | Pokes, views, superlikes |
| `user_verifications` | Selfie verification requests |
| `blocked_users` | User blocking relationships |
| `aichat_chats` | AI assistant chat history |

### Config Files

- `db/schema.ts` - Drizzle table definitions
- `db/drizzle.config.ts` - Drizzle Kit config
- `db/drizzle/` - Migration files

---

## Backend (`services/`)

**Tech**: Go + GoFiber + GraphQL (gqlgen)

### Key Packages

| Package | Purpose |
|---------|---------|
| `github.com/MelloB1989/karma` | Custom utilities (ORM, auth, mail, utils) |
| `github.com/gofiber/fiber/v2` | HTTP framework |
| `github.com/99designs/gqlgen` | GraphQL code generation |
| `github.com/workos/workos-go` | SSO/Auth via WorkOS |
| `github.com/redis/go-redis/v9` | Redis client |
| `github.com/posthog/posthog-go` | Analytics |

### karma Package Usage

```go
import (
    "github.com/MelloB1989/karma/utils"       // GenerateID, GenerateOTP, RedisConnect
    "github.com/MelloB1989/karma/orm"         // ORM operations
    "github.com/MelloB1989/karma/database"    // Raw SQL via PostgresConn()
    "github.com/MelloB1989/karma/mails"       // Email via AWS SES
    "github.com/MelloB1989/karma/config"      // Environment config
)

// ID generation
id := utils.GenerateID()

// ORM
orm.Load(ctx, &model, &[]Model{})
orm.Create(ctx, &model)
orm.UpdateByPrimaryKey(ctx, "id", &model)
orm.DeleteByPrimaryKey(ctx, "tablename", "id")

// Raw SQL
db := database.PostgresConn()
db.Exec("DELETE FROM users WHERE id = $1", id)
```

### Internal Structure

```
services/internal/
├── anal/           # Analytics (PostHog)
├── auth/           # JWT + WorkOS SSO
├── chat_service/   # WebSocket chat
├── cmd/            # CLI commands
├── constants/      # App constants
├── graph/          # GraphQL resolvers
│   ├── users/      # User mutations/queries
│   ├── community/  # Posts, comments
│   ├── matches/    # Matching logic
│   ├── reports/    # Content reporting
│   └── blocked_users/ # User blocking
├── handlers/       # Fiber route handlers
├── helpers/        # Business logic helpers
├── logger/         # Zap logger setup
├── mailer/         # Email templates
├── middlewares/    # Auth, CORS middlewares
├── models/         # Go structs (ORM models)
└── routes/         # Fiber route registration
```

### GraphQL

- Schema files: `services/internal/graph/**/*.graphqls`
- Run `bun gqlgen` after modifying `.graphqls` files
- Resolvers follow schema layout (e.g., `users.graphqls` → `users.resolvers.go`)
- Uses `@auth` directive for protected endpoints

---

## Mobile App (`expo/`)

**Tech**: React Native + Expo SDK 54 + NativeWind (TailwindCSS)

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `urql` | GraphQL client |
| `zustand` | State management |
| `nativewind` | TailwindCSS for React Native |
| `lucide-react-native` | Icons |
| `expo-router` | File-based routing |
| `react-native-reanimated` | Animations |

### GraphQL Service

```typescript
import { graphqlAuthService } from "../services/graphql-auth";

// Auth
await graphqlAuthService.createUser(input);
await graphqlAuthService.loginWithPassword(email, password);
await graphqlAuthService.getMe();

// Account
await graphqlAuthService.requestAccountDeletion();
await graphqlAuthService.deleteAccount(code);

// Blocking
await graphqlAuthService.blockUser(userId);
await graphqlAuthService.unblockUser(userId);
await graphqlAuthService.isUserBlocked(userId);
```

### Routing Structure

```
expo/app/
├── (auth)/         # Login, signup, onboarding
├── (tabs)/         # Main tab navigator
│   ├── index.tsx   # Discover/swipe
│   ├── community.tsx
│   ├── messages.tsx
│   └── profile.tsx
├── (modals)/       # Modal screens
└── _layout.tsx     # Root layout
```

---

## Landing Website (`landing/`)

**Tech**: Vite + React + TailwindCSS

### Routing

Uses React Router with routes:
- `/` - Home page
- `/delete-account` - Account deletion page

---

## Color Scheme

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Purple | `#7C3AED` | Buttons, accents |
| Primary Light | `#8B5CF6` / `#A78BFA` | Hover, highlights |
| Primary Deep | `#6B21A8` / `#5B21B6` | Pressed states |
| Purple Glow | `#9B6BFF` | Glowing effects |

### Backgrounds (Dark Theme)

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#080314` / `#0B0B10` | Main background |
| Surface | `#17102E` / `#121218` | Cards, modals |
| Elevated | `#16161B` | Elevated surfaces |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#F5F3FF` / `#E6E6F0` | Main text |
| Secondary | `#C7C7D4` | Supporting text |
| Muted | `#A6A6B2` / `#A6A3B8` | Hints, captions |
| Faint | `#7C7C88` / `#6E6A85` | Disabled text |

### Action Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` / `#16A34A` | Positive actions |
| Warning | `#F59E0B` / `#FACC15` | Warnings |
| Danger | `#EF4444` | Errors, destructive |
| Like | `#22C55E` | Right swipe |
| Superlike | `#38BDF8` | Superlike |
| Nope | `#F43F5E` | Left swipe |
| Love | `#F472B6` | Match/heart |
| AI | `#FDE68A` | AI features |

### Typography

- **Font**: Lexend (primary), Nunito (secondary)
- Both fonts are soft, rounded, and friendly

---

## Environment Variables

### Services (`services/.env`)

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
WORKOS_API_KEY=...
WORKOS_CLIENT_ID=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
MAILER_ADDRESS=noreply@example.com
POSTHOG_API_KEY=...
```

### Database (`db/.env`)

```bash
DATABASE_URL=postgresql://...
```

---

## Authentication Flow

1. **Signup/Login** → WorkOS handles OAuth, or email/password via JWT
2. **JWT tokens** stored in `expo-secure-store`
3. **GraphQL requests** include Bearer token via `@urql/exchange-auth`
4. **@auth directive** validates tokens on protected endpoints

---

## Common Patterns

### Creating a New GraphQL Endpoint

1. Add schema to `services/internal/graph/{feature}/{feature}.graphqls`
2. Run `bun gqlgen`
3. Implement resolver in `services/internal/graph/{feature}/resolver.go`
4. Wire in `services/internal/graph/{feature}.resolvers.go`

### Adding a New Database Table

1. Add table to `db/schema.ts`
2. Run `bun db:generate` then `bun db:migrate`
3. Add Go model to `services/internal/models/schema.go`
4. Register in `services/gqlgen.yml` if using with GraphQL

### Sending Emails

```go
import "spark/internal/mailer"

// Use pre-built templates
template := mailer.AccountDeletion(email, code)
err := template.Send()
```
