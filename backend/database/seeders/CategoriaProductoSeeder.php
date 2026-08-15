<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Categoria;
use App\Models\Producto;

class CategoriaProductoSeeder extends Seeder
{
    public function run(): void
    {
        $pizzas = Categoria::create([
            'nombre' => 'Pizzas',
            'descripcion' => 'Pizzas artesanales al horno de leña',
            'estado' => 'activa',
        ]);

        $pastas = Categoria::create([
            'nombre' => 'Pastas',
            'descripcion' => 'Pastas frescas hechas en casa',
            'estado' => 'activa',
        ]);

        $bebidas = Categoria::create([
            'nombre' => 'Bebidas',
            'descripcion' => 'Refrescos y bebidas frías',
            'estado' => 'activa',
        ]);

        Producto::insert([
            [
                'categoria_id' => $pizzas->id,
                'nombre' => 'Pizza Margarita',
                'descripcion' => 'Salsa de tomate, mozzarella fresca y albahaca',
                'precio' => 6500,
                'estado' => 'disponible',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'categoria_id' => $pizzas->id,
                'nombre' => 'Pizza Pepperoni',
                'descripcion' => 'Salsa de tomate, mozzarella y pepperoni',
                'precio' => 7200,
                'estado' => 'disponible',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'categoria_id' => $pizzas->id,
                'nombre' => 'Pizza Hawaiana',
                'descripcion' => 'Jamón, piña y mozzarella',
                'precio' => 7000,
                'estado' => 'disponible',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'categoria_id' => $pastas->id,
                'nombre' => 'Spaghetti a la Boloñesa',
                'descripcion' => 'Carne molida en salsa de tomate casera',
                'precio' => 5800,
                'estado' => 'disponible',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'categoria_id' => $bebidas->id,
                'nombre' => 'Coca-Cola 600ml',
                'descripcion' => null,
                'precio' => 1500,
                'estado' => 'disponible',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}