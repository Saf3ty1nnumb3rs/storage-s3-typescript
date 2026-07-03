# Building a Bun + SQLite + S3 Video App from Scratch

## Prerequisites

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# ffmpeg + ffprobe (macOS)
brew install ffmpeg

# AWS CLI (macOS)
brew install awscli
aws configure
```

---

## 1. Initialise the project

```bash
mkdir my-app && cd my-app
bun init -y
```

Install dependencies:

```bash
bun add jsonwebtoken
bun add -d @types/bun @types/jsonwebtoken typescript
```

---

## 2. Configure TypeScript

Replace the generated tsconfig.json with:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 3. Environment variables

Create .env:

```env
DB_PATH="./app.db"
JWT_SECRET="your-random-secret"
PLATFORM="dev"
FILEPATH_ROOT="./app"
ASSETS_ROOT="./assets"
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-2"
AWS_ACCESS_KEY_ID="your-key-id"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_CF_DISTRO="your-cloudfront-domain"
PORT="8080"
```

---

## 4. Directory structure

```bash
mkdir -p src/api/utils src/app src/db src/types assets
```

Key layout:

```txt
src/
  index.ts          # Bun.serve entry point + route definitions
  config.ts         # Reads env vars, creates DB, exports cfg
  auth.ts           # JWT creation/validation, password hashing
  types/
    api.ts          # ApiConfig type, route type aliases
  api/
    errors.ts       # Custom error classes (BadRequest, NotFound, etc.)
    json.ts         # respondWithJSON helper
    middleware.ts   # withConfig, errorHandlingMiddleware, cacheMiddleware
    auth.ts         # Login/refresh/revoke handlers
    users.ts        # User creation handler
    video-meta.ts   # Video CRUD handlers (no file upload)
    videos.ts       # Video file upload handler
    thumbnails.ts   # Thumbnail upload handler
    assets.ts       # ensureAssetsDir helper
    utils/
      videoHelpers.ts  # ffprobe/ffmpeg helpers, S3 upload
  db/
    db.ts           # newDatabase + autoMigrate (runs on startup)
    users.ts        # User DB queries
    videos.ts       # Video DB queries
    refresh-tokens.ts
  app/
    index.html      # SPA entry point — served by Bun natively
    app.js          # Frontend JS
    styles.css
```

---

## 5. Database

The database is SQLite via `bun:sqlite`. Create it in db.ts with `autoMigrate` called at startup — no migration tool needed. The three core tables are:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  user_id TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

---

## 6. Run

```bash
bun run src/index.ts
```

- DB file and assets directory are created automatically on first run
- UI available at `http://localhost:<PORT>`
- No build step — Bun runs TypeScript directly

---

## Key design notes

- **Auth**: JWT access tokens + refresh tokens stored in SQLite. Passwords hashed with `Bun.password` (argon2id).
- **File serving**: Static files under assets served via a `fetch` handler in `Bun.serve`. The SPA `index.html` is imported directly and served by Bun's native HTML bundler.
- **Video uploads**: Written to a local temp file first, processed with `ffmpeg` for fast-start, then streamed to S3 via `bun`'s built-in `S3Client`. Temp files are cleaned up in a `finally` block.
- **Thumbnails**: Stored locally in assets and served from `/assets/<filename>`.
