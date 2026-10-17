<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YToMP3 - High Quality YouTube to MP3 Converter</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-purple-500 selection:text-white">

    <!-- Background Glow Effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 w-full py-5 px-6 border-b border-slate-800/80 backdrop-blur-md bg-slate-950/60">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-extrabold tracking-wide bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">YToMP3</h1>
                    <p class="text-xs text-slate-400">Fast & High-Res Audio Engine</p>
                </div>
            </div>
            <div class="hidden sm:flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Server Online</span>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 flex-grow flex items-center justify-center px-4 py-8">
        <div class="w-full max-w-xl bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-purple-950/20">
            
            <form id="convertForm" class="space-y-5">
                <!-- Input URL -->
                <div>
                    <label for="url" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Link YouTube</label>
                    <div class="relative flex items-center">
                        <input type="url" id="url" name="url" required 
                            placeholder="Tempel link video YouTube di sini..." 
                            class="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm text-white placeholder-slate-600 transition shadow-inner">
                        <button type="button" id="clearBtn" class="absolute right-3 text-slate-500 hover:text-slate-300 hidden text-xs bg-slate-800 px-2 py-1 rounded-md">Hapus</button>
                    </div>
                </div>

                <!-- Preview Loading State -->
                <div id="previewSkeleton" class="hidden animate-pulse bg-slate-950/40 border border-slate-800 rounded-2xl p-3.5 flex items-center space-x-4">
                    <div class="w-24 h-16 bg-slate-800 rounded-xl flex-shrink-0"></div>
                    <div class="flex-grow space-y-2">
                        <div class="h-3 bg-slate-800 rounded w-1/4"></div>
                        <div class="h-4 bg-slate-800 rounded w-3/4"></div>
                        <div class="h-3 bg-slate-800 rounded w-1/3"></div>
                    </div>
                </div>

                <!-- Live Preview Card -->
                <div id="previewCard" class="hidden transform transition-all duration-300 ease-out bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center space-x-4">
                    <img id="previewThumb" src="" alt="Thumbnail" class="w-24 h-16 object-cover rounded-xl shadow-md border border-slate-800 flex-shrink-0">
                    <div class="flex-grow min-w-0">
                        <span id="previewBadge" class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 mb-1">Siap Dikonversi</span>
                        <h3 id="previewTitle" class="text-xs font-semibold text-slate-200 truncate">Judul Video</h3>
                        <p id="previewDuration" class="text-[11px] text-slate-400 mt-0.5">Durasi: --:--</p>
                    </div>
                </div>

                <!-- Quality Selection (Pill Options) -->
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Pilih Kualitas Audio (Bitrate)</label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <label class="cursor-pointer">
                            <input type="radio" name="quality" value="128" class="peer sr-only" checked>
                            <div class="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-xs font-medium text-slate-400 peer-checked:bg-gradient-to-r peer-checked:from-red-600/20 peer-checked:to-purple-600/20 peer-checked:border-purple-500 peer-checked:text-white transition shadow-sm">
                                128 kbps
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="quality" value="192" class="peer sr-only">
                            <div class="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-xs font-medium text-slate-400 peer-checked:bg-gradient-to-r peer-checked:from-red-600/20 peer-checked:to-purple-600/20 peer-checked:border-purple-500 peer-checked:text-white transition shadow-sm">
                                192 kbps
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="quality" value="256" class="peer sr-only">
                            <div class="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-xs font-medium text-slate-400 peer-checked:bg-gradient-to-r peer-checked:from-red-600/20 peer-checked:to-purple-600/20 peer-checked:border-purple-500 peer-checked:text-white transition shadow-sm">
                                256 kbps
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="quality" value="320" class="peer sr-only">
                            <div class="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-xs font-medium text-slate-400 peer-checked:bg-gradient-to-r peer-checked:from-red-600/20 peer-checked:to-purple-600/20 peer-checked:border-purple-500 peer-checked:text-white transition shadow-sm">
                                320 kbps <span class="block text-[9px] text-purple-400 font-normal">HD</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submitBtn"
                    class="w-full py-3.5 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-purple-600/25 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    <span id="btnText">Konversi & Unduh MP3</span>
                </button>
            </form>

            <!-- Loading & Status Indicator -->
            <div id="loading" class="hidden mt-6 text-center space-y-3">
                <div class="inline-block animate-spin rounded-full h-7 w-7 border-3 border-purple-500 border-t-transparent"></div>
                <p id="loadingStatus" class="text-xs font-medium text-purple-300 animate-pulse">Menghubungkan ke server...</p>
            </div>

            <!-- Error Notification -->
            <div id="errorMsg" class="hidden mt-5 p-3.5 bg-red-950/50 border border-red-900/60 rounded-xl text-red-300 text-xs text-center"></div>
        </div>
    </main>

    <!-- Hidden Iframe untuk Unduhan Latar Belakang -->
    <iframe id="downloadFrame" class="hidden"></iframe>

    <!-- Footer -->
    <footer class="relative z-10 py-5 text-center text-xs text-slate-500 border-t border-slate-800/80 backdrop-blur-md bg-slate-950/60">
        &copy; 2026 YToMP3 &bull; Fast, Secure & Free YouTube Converter
    </footer>

    <!-- Frontend Script -->
    <script>
        const urlInput = document.getElementById('url');
        const clearBtn = document.getElementById('clearBtn');
        const previewCard = document.getElementById('previewCard');
        const previewSkeleton = document.getElementById('previewSkeleton');
        const previewThumb = document.getElementById('previewThumb');
        const previewTitle = document.getElementById('previewTitle');
        const previewDuration = document.getElementById('previewDuration');
        
        const form = document.getElementById('convertForm');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const loading = document.getElementById('loading');
        const loadingStatus = document.getElementById('loadingStatus');
        const errorMsg = document.getElementById('errorMsg');
        const downloadFrame = document.getElementById('downloadFrame');

        let debounceTimer;

        // Fungsi Otomatis Memuat Metadata/Preview
        async function fetchPreview(url) {
            if (!url || !url.includes('youtu')) {
                previewCard.classList.add('hidden');
                previewSkeleton.classList.add('hidden');
                return;
            }

            previewCard.classList.add('hidden');
            previewSkeleton.classList.remove('hidden');

            try {
                const res = await fetch(`/info?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                
                previewSkeleton.classList.add('hidden');

                if (data.title) {
                    previewThumb.src = data.thumbnail;
                    previewTitle.textContent = data.title;
                    previewDuration.textContent = `Durasi: ${data.duration}`;
                    previewCard.classList.remove('hidden');
                    errorMsg.classList.add('hidden');
                } else if (data.error) {
                    errorMsg.textContent = data.error;
                    errorMsg.classList.remove('hidden');
                }
            } catch (e) {
                previewSkeleton.classList.add('hidden');
                previewCard.classList.add('hidden');
            }
        }

        // Listener saat user mengetik atau menempel (paste) link
        urlInput.addEventListener('input', () => {
            const url = urlInput.value.trim();
            clearBtn.classList.toggle('hidden', url.length === 0);
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchPreview(url);
            }, 500);
        });

        clearBtn.addEventListener('click', () => {
            urlInput.value = '';
            previewCard.classList.add('hidden');
            previewSkeleton.classList.add('hidden');
            clearBtn.classList.add('hidden');
            errorMsg.classList.add('hidden');
            urlInput.focus();
        });

        // Submit Form: Mengunduh di Latar Belakang via Hidden Iframe
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = urlInput.value.trim();
            const quality = document.querySelector('input[name="quality"]:checked').value;

            if (!url) return;

            errorMsg.classList.add('hidden');
            loading.classList.remove('hidden');
            submitBtn.disabled = true;
            btnText.textContent = 'Memproses...';

            setTimeout(() => { loadingStatus.textContent = "Mengunduh stream audio dari YouTube..."; }, 1200);
            setTimeout(() => { loadingStatus.textContent = `Mengonversi ke MP3 (${quality} kbps)... Mohon tunggu...`; }, 3500);

            // Tembakkan request konversi ke iframe tersembunyi
            const downloadUrl = `/convert?url=${encodeURIComponent(url)}&quality=${quality}`;
            downloadFrame.src = downloadUrl;

            // Kembalikan status tombol setelah beberapa saat tanpa mengubah/mereset halaman
            setTimeout(() => {
                loading.classList.add('hidden');
                submitBtn.disabled = false;
                btnText.textContent = 'Konversi & Unduh MP3';
                loadingStatus.textContent = "Menghubungkan ke server...";
            }, 9000);
        });
    </script>
</body>
</html>
