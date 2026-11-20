TIKDOWN — Local prototype with download backend


REQUIREMENTS
- Node.js (LTS)
- yt-dlp
- FFmpeg (needed for audio conversion and merging best video/audio streams)

RUN LOCALLY
1. Install Node.js from https://nodejs.org
2. Install yt-dlp and FFmpeg using Homebrew on macOS:
   brew install yt-dlp ffmpeg
3. Open Terminal and cd into this folder.
4. Run: npm install
5. Run: npm start
6. Open http://localhost:3000

This is a personal/local prototype. It only accepts TikTok URLs and downloads are handled by yt-dlp.\nUse only content you own or have permission to download. Availability, quality and watermark-free streams depend on the source and extractor; the app cannot guarantee a watermark-free file. Respect platform terms and copyright.

For public deployment, add rate limiting, authentication/abuse controls, file-size/time limits, and review hosting/provider terms before exposing this service.
