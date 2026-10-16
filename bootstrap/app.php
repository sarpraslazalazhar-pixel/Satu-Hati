<?php

use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        using: function () {
            /*
             * Urutan penting: route spesifik didaftarkan SEBELUM catch-all
             * `/{any?}` di web.php, kalau tidak catch-all yang menangkapnya.
             */
            Route::get('/up', function () {
                return response('', 200);
            });

            /*
             * Route maintenance dilewatkan middleware web secara sengaja:
             * grup `web` menjalankan StartSession, yang butuh tabel `sessions`.
             * Saat database masih kosong (deploy pertama), session error 500
             * sebelum controller sempat menjalankan migrasi.
             */
            Route::middleware([])->prefix('')->group(__DIR__.'/../routes/maintenance.php');

            Route::middleware('api')->prefix('api')->group(__DIR__.'/../routes/api.php');
            Route::middleware('web')->group(__DIR__.'/../routes/web.php');
        },
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
