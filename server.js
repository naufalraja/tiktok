const express = require('express');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
app.use(express.json({ limit: '20kb' }));
app.use(express.static(__dirname));

function validTikTokUrl(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    return ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].some(d => host === d || host.endsWith('.' + d)) && ['http:', 'https:'].includes(u.protocol);
  } catch { return false; }
}

app.post('/api/download', async (req, res) => {
  const { url, format = 'video', quality = 'best' } = req.body || {};
  if (!validTikTokUrl(url)) return res.status(400).json({ error: 'URL TikTok tidak valid.' });
  if (!['video', 'audio'].includes(format)) return res.status(400).json({ error: 'Format tidak didukung.' });
  if (!['best', '1080p', '720p', '480p'].includes(quality)) return res.status(400).json({ error: 'Kualitas tidak didukung.' });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tikdown-'));
  const id = crypto.randomBytes(8).toString('hex');
  const output = path.join(tmp, `${id}.%(ext)s`);
  let args;
  if (format === 'audio') {
    args = ['--no-playlist', '--no-warnings', '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', output, url];
  } else {
    const limit = quality === 'best' ? '' : quality.replace('p', '');
    const selector = limit
      ? `bestvideo[height<=${limit}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${limit}][ext=mp4]/best[height<=${limit}]`
      : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    args = ['--no-playlist', '--no-warnings', '--merge-output-format', 'mp4', '-f', selector, '-o', output, url];
  }

  const child = spawn('yt-dlp', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let errorText = '';
  child.stderr.on('data', chunk => { errorText += chunk.toString(); });
  child.on('error', async err => {
    fs.rmSync(tmp, { recursive: true, force: true });
    if (!res.headersSent) res.status(500).json({ error: 'yt-dlp tidak ditemukan. Install yt-dlp dan FFmpeg terlebih dahulu.' });
  });
  child.on('close', code => {
    if (res.headersSent) return;
    if (code !== 0) {
      fs.rmSync(tmp, { recursive: true, force: true });
      return res.status(502).json({ error: 'Video gagal diproses. Video mungkin privat, tidak tersedia, atau downloader perlu diperbarui.' });
    }
    const files = fs.readdirSync(tmp).filter(f => !f.endsWith('.part') && !f.endsWith('.ytdl'));
    if (!files.length) {
      fs.rmSync(tmp, { recursive: true, force: true });
      return res.status(502).json({ error: 'File hasil tidak ditemukan.' });
    }
    const file = path.join(tmp, files[0]);
    const ext = path.extname(file) || (format === 'audio' ? '.mp3' : '.mp4');
    const filename = `tikdown-${id}${ext}`;
    res.download(file, filename, () => fs.rmSync(tmp, { recursive: true, force: true }));
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tikdown running at http://localhost:${PORT}`));
