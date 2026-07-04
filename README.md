# storage-s3-typescript (Tube)

This repo contains the starter code for the asset test application - based upon the "Learn File Servers and CDNs with S3 and CloudFront" [course](https://www.boot.dev/courses/learn-file-servers-s3-cloudfront-typescript) on [boot.dev](https://www.boot.dev)

## What This Project Achieves

This project is a full-stack video hosting application that handles the complete lifecycle of user-generated video content — from authenticated upload through cloud storage to served playback. By the end of a working implementation you have:

- A REST API server built on **Bun's native HTTP server** with JWT-based auth (access + refresh token rotation)
- A **SQLite-backed database** with schema migrations running automatically at startup — no ORM, no migration tool
- **Local file serving** for thumbnails via a static asset handler
- **S3-backed video storage** with pre-upload processing and orientation-aware key prefixing
- A served **single-page frontend** using Bun's native HTML bundler — no Webpack, no Vite
  see [BOOTSTRAP.md](./BOOTSTRAP.md) for details on starting from scratch with Bun + SQLite + S3

## Quickstart

_This is to be used as a reference_ in case you need it, you should follow the instructions in the course rather than trying to do everything here.

## 1. Install dependencies

- [Typescript](https://www.typescriptlang.org/)
- [Bun](https://bun.sh/)
- [FFMPEG](https://ffmpeg.org/download.html) - both `ffmpeg` and `ffprobe` are required to be in your `PATH`.

```bash
# linux
sudo apt update
sudo apt install ffmpeg

# mac
brew update
brew install ffmpeg
```

- [SQLite 3](https://www.sqlite.org/download.html) only required for you to manually inspect the database.

```bash
# linux
sudo apt update
sudo apt install sqlite3

# mac
brew update
brew install sqlite3
```

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

## 2. Download sample images and videos

```bash
./samplesdownload.sh
# samples/ dir will be created
# with sample images and videos
```

## 3. Configure environment variables

Copy the `.env.example` file to `.env` and fill in the values.

```bash
cp .env.example .env
```

You'll need to update values in the `.env` file to match your configuration, but _you won't need to do anything here until the course tells you to_.

## 3. Run the server

```bash
bun run src/index.ts
```

- You should see a new database file `tubely.db` created in the root directory.
- You should see a new `assets` directory created in the root directory, this is where the images will be stored.
- You should see a link in your console to open the local web page.
