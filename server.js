const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function sanitizeFilename(filename) {
    return filename.replace(/[\/\\?%*:|"<>]/g, '').trim();
}

const cookiesPath = path.resolve(__dirname, 'cookies.txt');
const hasCookies = fs.existsSync(cookiesPath);
const cookiesFlag = hasCookies ? `--cookies "${cookiesPath}"` : '';

// Menambahkan --remote-components ejs:github untuk mengatasi JavaScript challenge YouTube
const extractorArgs = "youtube:player_client=web";
const ytdlFlags = `${cookiesFlag} --extractor-args "${extractorArgs}" --remote-components ejs:github --no-check-certificates --geo-bypass`;

// 1. Endpoint Info Metadata (Preview Video)
app.get('/info', (req, res) => {
    let url = req.query.url ? req.query.url.trim() : '';
    if (!url) {
        return res.status(400).json({ error: 'URL YouTube wajib diisi!' });
    }

    const cmd = `yt-dlp ${ytdlFlags} --print "%(title)s\n%(thumbnail)s\n%(duration_string)s" "${url}"`;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error('Info Error Details:', stderr);
            return res.status(500).json({ 
                error: 'Gagal mengambil informasi video. Periksa URL atau masa berlaku cookies.txt Anda.' 
            });
        }
        
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) {
            return res.status(500).json({ error: 'Gagal membaca metadata video.' });
        }

        res.json({
            title: lines[0],
            thumbnail: lines[1],
            duration: lines[2] || 'N/A'
        });
    });
});

// 2. Endpoint Konversi & Unduh MP3 (Background Task)
app.get('/convert', (req, res) => {
    let url = req.query.url ? req.query.url.trim() : '';
    const quality = req.query.quality;

    if (!url) {
        return res.status(400).json({ error: 'URL YouTube wajib diisi!' });
    }

    const bitrate = quality && ['128', '192', '256', '320'].includes(quality) ? quality : '128';
    const timestamp = Date.now();
    const tempOutputPattern = path.join(__dirname, `temp_${timestamp}.%(ext)s`);

    const titleCmd = `yt-dlp ${ytdlFlags} --get-title "${url}"`;

    exec(titleCmd, (titleError, rawTitle) => {
        let videoTitle = "YToMP3_Audio";
        if (!titleError && rawTitle) {
            videoTitle = sanitizeFilename(rawTitle.trim()) || "YToMP3_Audio";
        }

        const convertCmd = `yt-dlp ${ytdlFlags} -f "bestaudio/best" -x --audio-format mp3 --audio-quality 0 --postprocessor-args "ffmpeg:-b:a ${bitrate}k" -o "${tempOutputPattern}" "${url}"`;

        exec(convertCmd, (execErr, stdout, stderr) => {
            const finalFilePath = path.join(__dirname, `temp_${timestamp}.mp3`);

            if (execErr || !fs.existsSync(finalFilePath)) {
                console.error('Conversion Error Details:', stderr);
                if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);

                const firstErrLine = stderr ? stderr.split('\n').find(l => l.includes('ERROR:')) || stderr.split('\n')[0] : '';
                return res.status(500).json({ 
                    error: `Gagal mengonversi: ${firstErrLine || 'Terjadi kesalahan pada server.'}` 
                });
            }

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(videoTitle)}_${bitrate}kbps.mp3"`);

            res.download(finalFilePath, `${videoTitle}_${bitrate}kbps.mp3`, (downloadErr) => {
                if (fs.existsSync(finalFilePath)) {
                    fs.unlinkSync(finalFilePath);
                }
            });
        });
    });
});

// Menjalankan Server Express
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Server YToMP3 berjalan di port ${PORT}`);
    console.log(` Status Cookies: ${hasCookies ? 'AKTIF (' + cookiesPath + ')' : 'TIDAK DITEMUKAN'}`);
    console.log(`==================================================`);
});
