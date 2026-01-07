## Local GPU (RTX 2050) video processing setup

This project can run **locally** and process videos to **HLS** using **NVENC** (GPU), then upload the results to **Backblaze B2**.

### What runs where
- **Backend API**: `http://localhost:5001`
- **Frontend**: `http://localhost:3000`
- **Redis** (queue): `localhost:6379`
- **GPU HLS Worker**: runs on your PC (RTX 2050), pulls jobs from Redis, downloads the source from B2, encodes to HLS, uploads HLS back to B2, updates Mongo.

### Required environment variables (put these in your `.env`)
Backend:
- `NODE_ENV=development`
- `PORT=5001`
- `CLIENT_URL=http://localhost:3000`
- `FRONTEND_URL=http://localhost:3000`

Mongo:
- `MONGO_URI=...`

Redis queue:
- `REDIS_ENABLED=true`
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`

B2:
- `B2_ENDPOINT=...`
- `B2_BUCKET=...`
- `B2_ACCESS_KEY_ID=...`
- `B2_SECRET_ACCESS_KEY=...`
- `B2_PUBLIC_BASE=...`

GPU encoding:
- `VIDEO_ENCODER=h264_nvenc`

If NVENC fails on Windows, use your own NVENC-enabled ffmpeg build:
- `FFMPEG_PATH=C:\path\to\ffmpeg.exe`
- `FFPROBE_PATH=C:\path\to\ffprobe.exe`

Worker tuning (safe defaults for a single RTX 2050):
- `WORKER_CONCURRENCY=1`

### How to run
In one terminal:

```powershell
npm run dev
```

In a second terminal:

```powershell
npm run worker:hls
```


