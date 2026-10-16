<?php

use App\Http\Controllers\MaintenanceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Route Maintenance (tanpa Terminal / SSH)
|--------------------------------------------------------------------------
| Berguna di shared hosting cPanel yang tidak menyediakan SSH.
| Dilindungi token di .env: MAINTENANCE_TOKEN.
|
| Route ini SENGAJA tanpa middleware web/session, supaya tetap bisa dipanggil
| saat database masih kosong (SESSION_DRIVER=database butuh tabel `sessions`).
|
| HAPUS file ini (atau kosongkan MAINTENANCE_TOKEN) setelah selesai deploy.
*/
Route::get('/mig321', [MaintenanceController::class, 'migrate']);
Route::get('/mig123', [MaintenanceController::class, 'migrateFresh']);
Route::get('/mig000', [MaintenanceController::class, 'seed']);
Route::get('/mig999', [MaintenanceController::class, 'status']);
