const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint Konversi & Download
app.get('/convert', async (req, res) => {
    const { url, quality } = req.query;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'URL YouTube tidak valid!' });
    }

    try {
        // Ambil informasi video untuk judul file
        const info = await ytdl.getInfo(url);
        let title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, ''); // Bersihkan karakter ilegal
        
        // Pilih bitrate (default 128 kbps jika tidak dipilih)
        const bitrate = quality && ['128', '192', '256', '320'].includes(quality) ? quality : '128';

        // Set Header untuk Download File MP3
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}_${bitrate}kbps.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Stream audio dari YouTube
        const audioStream = ytdl(url, { quality: 'highestaudio' });

        // Proses konversi menggunakan FFmpeg
        ffmpeg(audioStream)
            .audioBitrate(bitrate)
            .toFormat('mp3')
            .on('error', (err) => {
                console.error('FFmpeg Error:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Terjadi kesalahan saat memproses audio.' });
                }
            })
            .pipe(res, { end: true });

    } catch (error) {
        console.error('Conversion Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Gagal mengambil data video YouTube.' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server YToMP3 berjalan di port ${PORT}`);
});