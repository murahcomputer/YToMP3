const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const YT_DLP_PATH = '/home/ubuntu/bgutil-env/bin/yt-dlp';
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');

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

// Endpoint /convert menggunakan metode file temporer (100% stabil)
app.get('/convert', (req, res) => {
    const videoUrl = req.query.url;
    const quality = req.query.quality || '128';

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL video tidak boleh kosong' });
    }

    // Buat nama file unik untuk mencegah bentrok antar pengguna
    const uniqueId = crypto.randomBytes(6).toString('hex');
    const outputTemplate = path.join(__dirname, `audio_${uniqueId}.%(ext)s`);

    const ytProcess = spawn(YT_DLP_PATH, [
        '--cookies', COOKIES_PATH,
        '--extractor-args', 'youtube:player_client=web;pot-provider=bgutil:script',
        '--remote-components', 'ejs:github',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', `${quality}K`,
        '-o', outputTemplate,
        videoUrl
    ]);

    ytProcess.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data}`);
    });

    ytProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Gagal mengonversi video ke MP3.' });
        }

        // Cari file MP3 hasil konversi di direktori
        fs.readdir(__dirname, (err, files) => {
            if (err) {
                return res.status(500).json({ error: 'Gagal membaca direktori server.' });
            }

            const targetFile = files.find(f => f.startsWith(`audio_${uniqueId}`) && f.endsWith('.mp3'));
            if (!targetFile) {
                return res.status(500).json({ error: 'File MP3 hasil konversi tidak ditemukan.' });
            }

            const filePath = path.join(__dirname, targetFile);

            // Kirim file ke klien, lalu hapus setelah selesai dikirim
            res.download(filePath, targetFile.replace(`audio_${uniqueId}_`, ''), (downloadErr) => {
                if (downloadErr) {
                    console.error('Error saat mengirim file:', downloadErr);
                }
                // Hapus file temporer dari server
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Gagal menghapus file temporer:', unlinkErr);
                });
            });
        });
    });

    req.on('close', () => {
        ytProcess.kill();
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
