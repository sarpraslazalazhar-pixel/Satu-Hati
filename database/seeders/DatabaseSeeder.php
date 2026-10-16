<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'amil@lazalazhar.org'],
            [
                'name' => 'Amil LAZ Al Azhar Peduli',
                'password' => Hash::make('admin123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@zecrus.com'],
            [
                'name' => 'Amil LAZ Al Azhar Peduli',
                'password' => Hash::make('admin123'),
            ]
        );
    }
}
