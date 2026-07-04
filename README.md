# storage-s3-typescript (Tube)

A full-stack video hosting application built with Bun, SQLite, and S3. Originally based on the ["Learn File Servers and CDNs with S3 and CloudFront"](https://www.boot.dev/courses/learn-file-servers-s3-cloudfront-typescript) course on [boot.dev](https://www.boot.dev), and extended with additional type safety, video processing, and architectural improvements.

## What This Project Achieves

- A REST API server built on **Bun's native HTTP server** with JWT-based auth (access + refresh token rotation)
- A **SQLite-backed database** with schema migrations running automatically at startup — no ORM, no migration tool
- **Local file serving** for thumbnails via a static asset handler
- **S3-backed video storage** with `ffmpeg` fast-start processing and orientation-aware key prefixing (`landscape/`, `portrait/`, `other/`)
- A served **single-page frontend** using Bun's native HTML bundler — no Webpack, no Vite

> For building a similar app from scratch, see [BOOTSTRAP.md](./BOOTSTRAP.md).

---

## Running This Repo

### 1. Prerequisites

- [Bun](https://bun.sh/)
- [ffmpeg + ffprobe](https://ffmpeg.org/download.html) — both must be in your `PATH`
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) — configured with credentials that have S3 access

```bash
# macOS
brew install ffmpeg awscli
aws configure
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your S3 bucket, region, and AWS credentials. All other defaults work for local development.

### 4. Download sample media (optional)

```bash
./samplesdownload.sh
```

### 5. Run

```bash
bun run src/index.ts
```

The database and `assets/` directory are created automatically on first run. The UI is available at `http://localhost:<PORT>`.
