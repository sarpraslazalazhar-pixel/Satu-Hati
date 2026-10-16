<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.maintenance_token' => 'rahasia123']);
    }

    public function test_routes_are_disabled_when_token_is_empty(): void
    {
        config(['app.maintenance_token' => '']);

        $this->get('/mig321')->assertNotFound();
        $this->get('/mig999')->assertNotFound();
    }

    public function test_wrong_or_missing_token_is_forbidden(): void
    {
        $this->get('/mig321')->assertForbidden();
        $this->get('/mig321?key=salah')->assertForbidden();
        $this->get('/mig999')->assertForbidden();
    }

    public function test_status_route_reports_database_and_migrations(): void
    {
        $response = $this->get('/mig999?key=rahasia123');

        $response->assertOk();
        $this->assertStringContainsString('=== status ===', $response->getContent());
        $this->assertStringContainsString('migrate:status', $response->getContent());
        $this->assertStringContainsString('create_donations_table', $response->getContent());
    }

    public function test_maintenance_routes_bypass_session_and_capture_all(): void
    {
        // Route maintenance harus menang atas catch-all `/{any?}` dan tidak
        // memakai middleware web (yang butuh tabel `sessions`).
        foreach (['/mig321', '/mig123', '/mig000', '/mig999'] as $uri) {
            $route = collect(app('router')->getRoutes()->getRoutes())
                ->first(fn ($r) => $r->uri() === ltrim($uri, '/'));

            $this->assertNotNull($route, "Route {$uri} tidak terdaftar.");
            $this->assertSame([], $route->gatherMiddleware(), "Route {$uri} harus tanpa middleware.");
        }
    }
}
