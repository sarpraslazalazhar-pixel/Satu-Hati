<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>LAZ Al Azhar Peduli - Satu Hati untuk Palestina</title>
    <meta name="description" content="Platform galang dana digital resmi LAZ Al Azhar Peduli untuk bantuan kemanusiaan darurat dan pendidikan anak-anak Palestina. Donasi mudah via QRIS tanpa upload struk.">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFD200'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Permanent+Marker&family=Fredoka:wght@600;700&family=Montserrat:ital,wght@0,800;0,900;1,800;1,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
    @if (file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
        @vite(['resources/css/app.css', 'resources/js/main.jsx'])
    @endif
</head>
<body class="bg-black text-white antialiased m-0 p-0">
    @if (file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
        <div id="app"></div>
    @else
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, sans-serif; background: #E8FBE8;">
            <div style="max-width: 540px; background: white; border: 3px solid #111; border-radius: 20px; padding: 30px; box-shadow: 6px 6px 0 #111; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 10px;">⚡</div>
                <h1 style="font-size: 24px; font-weight: 800; color: #004D26; margin: 0 0 10px 0;">Aset Vite Belum Dibuilt</h1>
                <p style="font-size: 14px; color: #444; line-height: 1.6; margin-bottom: 20px;">
                    Jalankan salah satu perintah berikut di terminal folder <code>zecrus</code> untuk memuat frontend:
                </p>
                <div style="background: #111; color: #A3FF2E; padding: 12px 16px; border-radius: 12px; font-family: monospace; font-size: 14px; font-weight: bold; margin-bottom: 15px; text-align: left;">
                    npm run dev
                </div>
                <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">atau untuk mode build produksi:</p>
                <div style="background: #111; color: #FFD200; padding: 12px 16px; border-radius: 12px; font-family: monospace; font-size: 14px; font-weight: bold; text-align: left;">
                    npm run build
                </div>
            </div>
        </div>
    @endif
</body>
</html>
