<?php

namespace Tests\Feature;

use App\Models\ActivitySlide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ActivitySlideTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create([
            'email' => 'admin@zecrus.test',
        ]);
    }

    public function test_guest_can_list_activity_slides(): void
    {
        ActivitySlide::create([
            'title' => 'Dokumentasi Konser',
            'description' => 'Pentas seni kemanusiaan',
            'image_path' => '/uploads/slides/test.jpg',
            'badge_text' => 'KONSER',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/activity-slides');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment([
                'title' => 'Dokumentasi Konser',
            ]);
    }

    public function test_admin_can_upload_activity_slide(): void
    {
        $file = UploadedFile::fake()->image('kegiatan.jpg', 800, 600);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/activity-slides', [
            'title' => 'Penyaluran Bantuan Air Bersih',
            'description' => 'Distribusi air bersih untuk warga pengungsi',
            'badge_text' => 'AKSI NYATA',
            'image' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'slide' => [
                    'title' => 'Penyaluran Bantuan Air Bersih',
                    'badge_text' => 'AKSI NYATA',
                ],
            ]);

        $this->assertDatabaseHas('activity_slides', [
            'title' => 'Penyaluran Bantuan Air Bersih',
            'badge_text' => 'AKSI NYATA',
        ]);
    }

    public function test_admin_can_delete_activity_slide(): void
    {
        $slide = ActivitySlide::create([
            'title' => 'Slide to Delete',
            'image_path' => '/uploads/slides/dummy.jpg',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/admin/activity-slides/{$slide->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('activity_slides', [
            'id' => $slide->id,
        ]);
    }
}
