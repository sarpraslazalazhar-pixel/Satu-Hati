<?php

use App\Http\Controllers\ActivitySlideController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DonationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Donation API
|--------------------------------------------------------------------------
*/
Route::get('/donations', [DonationController::class, 'index']);
Route::post('/donations', [DonationController::class, 'store']);
Route::get('/donations/{id}/check-status', [DonationController::class, 'checkStatus']);
Route::post('/webhooks/mayar', [DonationController::class, 'mayarWebhook']);
Route::post('/webhooks/tako', [DonationController::class, 'mayarWebhook']);
Route::get('/activity-slides', [ActivitySlideController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Admin Authentication API
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me']);

/*
|--------------------------------------------------------------------------
| Protected Admin Donation API
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::get('/donations', [DonationController::class, 'adminList']);
    Route::patch('/donations/{id}/approve', [DonationController::class, 'approve']);
    Route::patch('/donations/{id}/reject', [DonationController::class, 'reject']);
    Route::post('/donations/offline', [DonationController::class, 'offline']);
    Route::post('/donations/manual-cash', [DonationController::class, 'manualCash']);
    Route::post('/donations/parse-pdf', [DonationController::class, 'parsePdf']);
    Route::post('/donations/import-pdf-batch', [DonationController::class, 'importPdfBatch']);
    Route::get('/donations/export-excel', [DonationController::class, 'exportExcel']);
    Route::post('/donations/parse-excel', [DonationController::class, 'parseExcel']);
    Route::post('/donations/import-excel-batch', [DonationController::class, 'importExcelBatch']);
    Route::post('/activity-slides', [ActivitySlideController::class, 'store']);
    Route::delete('/activity-slides/{id}', [ActivitySlideController::class, 'destroy']);
});
