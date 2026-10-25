const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Jalur absolut ke yt-dlp di virtual environment Python
const YT_DLP_PATH = '/home/ubuntu/bgutil-env/bin/yt-dlp';
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');

// Endpoint /info: Mengambil metadata video (judul, thumbnail, durasi)
app.get('/info', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL video tidak boleh kosong' });
    }

    const cmd = `"${YT_DLP_PATH}" --cookies "${COOKIES_PATH}" --dump-json --no-playlist "${videoUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Info Error Details:', stderr);
            return res.status(500).json({ error: `Gagal mengambil info: ${stderr.trim()}` });
        }
        try {
            const info = JSON.parse(stdout);
            res.json({
                title: info.title,
                thumbnail: info.thumbnail,
                duration: formatDuration(info.duration)
            });
        } catch (parseError) {
            res.status(500).json({ error: 'Gagal memparsing data metadata video.' });
        }
    });
});

// Endpoint /convert: Mengunduh, mengonversi ke MP3 secara dinamis, dan mengalirkan ke klien
app.get('/convert', (req, res) => {
    const videoUrl = req.query.url;
    // Menangkap parameter quality secara dinamis dari query (default ke '128' jika tidak diset)
    const quality = req.query.quality || '128';

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL video tidak boleh kosong' });
    }

    // Ambil judul video untuk penamaan file unduhan yang bersih
    const infoCmd = `"${YT_DLP_PATH}" --cookies "${COOKIES_PATH}" --get-title --no-playlist "${videoUrl}"`;
    
    exec(infoCmd, (err, titleStdout) => {
        let safeTitle = 'audio_download';
        if (!err && titleStdout) {
            safeTitle = titleStdout.trim().replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
        }

        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Jalankan yt-dlp dengan argumen penangkal blokir dan kualitas dinamis
        const ytProcess = spawn(YT_DLP_PATH, [
            '--cookies', COOKIES_PATH,
            '--extractor-args', 'youtube:player_client=web;pot-provider=bgutil:script',
            '--remote-components', 'ejs:github',
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', `${quality}K`, // Menggunakan kualitas pilihan user (misal: 128K, 192K, 320K)
            '-o', '-',
            videoUrl
        ]);

        ytProcess.stdout.pipe(res);

        ytProcess.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

        ytProcess.on('close', (code) => {
            if (code !== 0 && !res.headersSent) {
                res.status(500).json({ error: 'Gagal mengonversi video ke MP3.' });
            }
        });

        req.on('close', () => {
            ytProcess.kill();
        });
    });
});

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

app.listen(PORT, () => {
    console.log('==================================================');
    console.log(` Server YToMP3 berjalan di port ${PORT}`);
    console.log(` Status Cookies: ${fs.existsSync(COOKIES_PATH) ? 'AKTIF' : 'TIDAK ADA'}`);
    console.log('==================================================');
});
