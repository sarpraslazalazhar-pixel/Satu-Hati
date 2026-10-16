<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Jalankan perintah maintenance lewat HTTP, untuk hosting tanpa SSH.
 *
 * Dilindungi token di .env (MAINTENANCE_TOKEN). Bila token kosong, SEMUA
 * route maintenance otomatis mati (404) — jadi aman ditinggal di produksi.
 *
 * ponytail: sengaja sederhana (query string token, output teks polos).
 * Kalau nanti ada SSH, hapus controller + route ini.
 */
class MaintenanceController extends Controller
{
    /**
     * Cek token lalu jalankan callback.
     */
    private function guard(Request $request, string $action, callable $callback): Response
    {
        $expected = (string) config('app.maintenance_token');

        // Token kosong = fitur maintenance dimatikan.
        if ($expected === '') {
            abort(404);
        }

        if (! hash_equals($expected, (string) $request->query('key'))) {
            abort(403, 'Token salah. Tambahkan ?key=TOKEN pada URL.');
        }

        $output = [];

        try {
            $exitCode = $callback($output);
        } catch (\Throwable $e) {
            $exitCode = 1;
            $output[] = 'GAGAL: '.$e->getMessage();
        }

        $body = "=== {$action} ===\n"
            .'Koneksi DB : '.config('database.default')."\n"
            ."Exit code  : {$exitCode}\n\n"
            .implode("\n", $output)."\n";

        return response($body, $exitCode === 0 ? 200 : 500)
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    /**
     * /mig321?key=TOKEN — jalankan migrasi yang belum dijalankan.
     */
    public function migrate(Request $request): Response
    {
        return $this->guard($request, 'migrate', function (array &$output) {
            $output[] = 'Database: '.$this->databaseInfo();
            $code = Artisan::call('migrate', ['--force' => true]);
            $output[] = Artisan::output();

            return $code;
        });
    }

    /**
     * /mig123?key=TOKEN — HAPUS SEMUA TABEL lalu migrasi ulang.
     */
    public function migrateFresh(Request $request): Response
    {
        return $this->guard($request, 'migrate:fresh', function (array &$output) {
            $output[] = 'Database: '.$this->databaseInfo();
            $output[] = 'PERINGATAN: seluruh tabel akan dihapus.';

            $code = Artisan::call('migrate:fresh', ['--force' => true]);
            $output[] = Artisan::output();

            return $code;
        });
    }

    /**
     * /mig000?key=TOKEN — isi ulang data awal (akun amil).
     */
    public function seed(Request $request): Response
    {
        return $this->guard($request, 'db:seed', function (array &$output) {
            $output[] = 'Database: '.$this->databaseInfo();
            $code = Artisan::call('db:seed', ['--force' => true]);
            $output[] = Artisan::output();

            return $code;
        });
    }

    /**
     * /mig999?key=TOKEN — lihat status migrasi & ringkasan tabel.
     */
    public function status(Request $request): Response
    {
        return $this->guard($request, 'status', function (array &$output) {
            $output[] = 'Database: '.$this->databaseInfo();
            $output[] = '';
            $output[] = '--- migrate:status ---';
            Artisan::call('migrate:status');
            $output[] = Artisan::output();

            $output[] = '--- tabel ---';
            foreach ($this->tables() as $table) {
                $output[] = sprintf('  %-24s %d baris', $table, $this->rowCount($table));
            }

            $output[] = '';
            $output[] = '--- akun amil ---';
            try {
                foreach (DB::table('users')->select('id', 'name', 'email')->get() as $user) {
                    $output[] = sprintf('  #%d  %s  <%s>', $user->id, $user->name, $user->email);
                }
            } catch (\Throwable $e) {
                $output[] = '  (tabel users belum ada — jalankan /mig321 lalu /mig000)';
            }

            return 0;
        });
    }

    private function databaseInfo(): string
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        return $connection.' ('.$database.')';
    }

    /**
     * Daftar nama tabel, mendukung SQLite dan MySQL/MariaDB.
     *
     * @return array<int, string>
     */
    private function tables(): array
    {
        $driver = config('database.default');

        $rows = match ($driver) {
            'sqlite' => DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"),
            default => DB::select('SHOW TABLES'),
        };

        return array_map(function ($row) {
            $values = array_values((array) $row);

            return (string) ($values[0] ?? '');
        }, $rows);
    }

    private function rowCount(string $table): int
    {
        try {
            return DB::table($table)->count();
        } catch (\Throwable) {
            return -1;
        }
    }
}
