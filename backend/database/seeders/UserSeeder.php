<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Administrador',
            'email' => 'admin@rooster.com',
            'password' => Hash::make('admin123'),
            'rol' => 'admin',
            'estado' => 'activo',
        ]);

        User::create([
            'name' => 'Cocina',
            'email' => 'cocina@rooster.com',
            'password' => Hash::make('cocina123'),
            'rol' => 'cocina',
            'estado' => 'activo',
        ]);

        User::create([
            'name' => 'Caja',
            'email' => 'caja@rooster.com',
            'password' => Hash::make('caja123'),
            'rol' => 'caja',
            'estado' => 'activo',
        ]);
    }
}