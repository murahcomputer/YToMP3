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

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const extractorArgs = "youtube:player_client=android,web_safari";

// Cek otomatis file cookies.txt untuk bypass proteksi IP server cloud (AWS)
const cookiesPath = path.join(__dirname, 'cookies.txt');
const cookiesFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';

// Endpoint Info Metadata
app.get('/info', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    const cmd = `yt-dlp ${cookiesFlag} --user-agent "${userAgent}" --extractor-args "${extractorArgs}" --print "%(title)s\n%(thumbnail)s\n%(duration_string)s" "${url}"`;
    
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error('Info Error:', stderr);
            return res.status(500).json({ error: 'Gagal mengambil informasi video. Periksa URL atau pasang cookies.txt.' });
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

// Endpoint Konversi & Download
app.get('/convert', (req, res) => {
    const { url, quality } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL YouTube wajib diisi!' });
    }

    const bitrate = quality && ['128', '192', '256', '320'].includes(quality) ? quality : '128';
    const timestamp = Date.now();
    const tempOutputPattern = path.join(__dirname, `temp_${timestamp}.%(ext)s`);

    const titleCmd = `yt-dlp ${cookiesFlag} --user-agent "${userAgent}" --extractor-args "${extractorArgs}" --get-title "${url}"`;

    exec(titleCmd, (titleError, rawTitle) => {
        let videoTitle = "YToMP3_Audio";
        if (!titleError && rawTitle) {
            videoTitle = sanitizeFilename(rawTitle.trim()) || "YToMP3_Audio";
        }

        const convertCmd = `yt-dlp ${cookiesFlag} --user-agent "${userAgent}" --extractor-args "${extractorArgs}" -f bestaudio -x --audio-format mp3 --audio-quality 0 --postprocessor-args "ffmpeg:-b:a ${bitrate}k" -o "${tempOutputPattern}" "${url}"`;

        exec(convertCmd, (execErr, stdout, stderr) => {
            const finalFilePath = path.join(__dirname, `temp_${timestamp}.mp3`);

            if (execErr || !fs.existsSync(finalFilePath)) {
                console.error('Conversion Error:', stderr);
                if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
                return res.status(500).json({ 
                    error: 'Proteksi IP AWS terdeteksi. Silakan tambahkan file cookies.txt ke server.' 
                });
            }

            res.download(finalFilePath, `${videoTitle}_${bitrate}kbps.mp3`, (downloadErr) => {
                if (fs.existsSync(finalFilePath)) {
                    fs.unlinkSync(finalFilePath);
                }
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server YToMP3 berjalan di port ${PORT}`);
});