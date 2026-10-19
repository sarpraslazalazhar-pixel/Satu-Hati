<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Satu Hati untuk Palestina - LAZ Al Azhar Peduli</title>
    <meta name="description" content="Platform galang dana digital resmi LAZ Al Azhar Peduli untuk Palestina. Donasi mudah via QRIS.">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23C66723'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Permanent+Marker&family=Fredoka:wght@600;700&family=Montserrat:ital,wght@0,800;0,900;1,800;1,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
    @if (file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
        @vite(['resources/css/app.css', 'resources/js/main.jsx'])
    @endif
</head>
<body class="bg-[#EDE3D4] text-[#1C140E] antialiased m-0 p-0 selection:bg-[#C66723] selection:text-white">
    @if (file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
        <div id="app"></div>
    @else
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, sans-serif; background: #EDE3D4;">
            <div style="max-width: 540px; background: white; border: 2px solid #C66723; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center;">
                <h1 style="font-size: 20px; font-weight: 800; color: #C66723;">Aset Vite Belum Dibuilt</h1>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">Jalankan <code>npm run build</code> di terminal.</p>
            </div>
        </div>
    @endif
</body>
</html>
