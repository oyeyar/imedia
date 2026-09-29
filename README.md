# iMediaYar — Direct Public Media Downloader

A React + Vite frontend with a small Node/Express resolver API for public Instagram, Facebook and X/Twitter media, plus obvious direct image/video URLs.

## Architecture

The backend is intentionally a **resolver, not a media proxy**:

1. User pastes a public social-media URL or direct media URL.
2. Backend resolves supported social URLs using `btch-downloader` 6.4.0.
3. Backend returns the direct media URL(s).
4. Browser downloads the media directly from the source host.
5. For carousel/multiple media, the browser fetches the files and creates the ZIP locally.

This keeps normal media bandwidth off the backend host.

### Important direct-download limitation

Some media CDNs allow a browser to open a public URL but block JavaScript `fetch()` with CORS. Individual downloads can fall back to opening the direct URL, but **Download all** requires browser-readable CORS access because the ZIP is created locally. The app reports which item blocked ZIP creation instead of silently proxying the media through the server.

## Supported input

- Instagram public posts, Reels and carousel media
- Facebook public media URLs supported by the resolver
- X / Twitter public post URLs supported by the resolver
- Direct URLs ending in common image/video extensions such as `.jpg`, `.png`, `.webp`, `.gif`, `.mp4`, `.mov`, `.m4v`, `.webm`

The app does not bypass private content, login requirements or DRM.

## Local development

### Server

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Production hosting

Host the `server` on a Node-capable service and the `client` on any static hosting provider. Set:

- `CLIENT_ORIGIN` on the server to the exact frontend origin.
- `VITE_API_URL` on the client to the public backend URL.
- `TRUST_PROXY=1` when the backend is behind a trusted reverse proxy that forwards the client IP.

Because the backend does not stream media in the normal flow, its bandwidth usage is primarily API traffic rather than video/image traffic.

## Checks

```bash
cd server && npm test
cd client && npm run build
```

## Legal / usage

Only download public content you have permission to use. iMediaYar is an independent tool and is not affiliated with Instagram, Facebook or X.
