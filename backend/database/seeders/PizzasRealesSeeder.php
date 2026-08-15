<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Producto;
use App\Models\Categoria;

class PizzasRealesSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar productos sin imagen antes de insertar
        Producto::whereNull('imagen')->orWhere('imagen', '')->delete();

        // ==================== PIZZAS (8) ====================
        $categoriaPizzas = Categoria::firstOrCreate(['nombre' => 'Pizzas']);

        $pizzas = [
            ['nombre' => 'Pizza Hawaiana', 'descripcion' => 'Jamón, piña y queso derretido', 'precio' => 12500, 'imagen' => 'productos/pizza-hawaiana.jpg'],
            ['nombre' => 'Pizza Margarita', 'descripcion' => 'Tomate, mozzarella fresca y albahaca', 'precio' => 11500, 'imagen' => 'productos/pizza-margarita.jpg'],
            ['nombre' => 'Pizza Caprese', 'descripcion' => 'Tomate, mozzarella y albahaca fresca', 'precio' => 12500, 'imagen' => 'productos/pizza-caprese.jpg'],
            ['nombre' => 'Pizza Carne Picante', 'descripcion' => 'Carne molida, jalapeño y queso', 'precio' => 13500, 'imagen' => 'productos/pizza-carne-picante.jpg'],
            ['nombre' => 'Pizza Especial Rooster', 'descripcion' => 'Nuestro secreto: jamón, champiñones, cebolla y especias de la casa', 'precio' => 14500, 'imagen' => 'productos/pizza-especial-rooster.jpg'],
            ['nombre' => 'Pizza Jamón Champiñones', 'descripcion' => 'Jamón serrano y champiñones frescos', 'precio' => 13000, 'imagen' => 'productos/pizza-jamon-champinones.jpg'],
            ['nombre' => 'Pizza Pepperoni Champiñones', 'descripcion' => 'Pepperoni crujiente con champiñones', 'precio' => 13500, 'imagen' => 'productos/pizza-pepperoni-champinones.jpg'],
            ['nombre' => 'Pizza Vegetariana', 'descripcion' => 'Vegetales frescos: tomate, cebolla, champiñones, pimiento', 'precio' => 11000, 'imagen' => 'productos/pizza-vegetariana.jpg'],
        ];

        foreach ($pizzas as $pizza) {
            Producto::updateOrCreate(['nombre' => $pizza['nombre']], array_merge($pizza, ['categoria_id' => $categoriaPizzas->id]));
        }
        $this->command->info('✅ 8 pizzas cargadas');

        // ==================== PASTAS (2) ====================
        $categoriaPastas = Categoria::firstOrCreate(['nombre' => 'Pastas']);

        $pastas = [
            ['nombre' => 'Fettuccine Alfredo', 'descripcion' => 'Fettuccine con crema y queso parmesano', 'precio' => 8500, 'imagen' => 'productos/pasta1.jpeg'],
            ['nombre' => 'Penne Arrabbiata', 'descripcion' => 'Penne con tomate, ajo y chile', 'precio' => 8000, 'imagen' => 'productos/pasta2.jpeg'],
        ];

        foreach ($pastas as $pasta) {
            Producto::updateOrCreate(['nombre' => $pasta['nombre']], array_merge($pasta, ['categoria_id' => $categoriaPastas->id]));
        }
        $this->command->info('✅ 2 pastas cargadas');

        // ==================== CARNES (3) ====================
        $categoriaCarnes = Categoria::firstOrCreate(['nombre' => 'Carnes']);

        $carnes = [
            ['nombre' => 'Filete a la Parrilla', 'descripcion' => 'Filete de carne premium con hierbas aromáticas', 'precio' => 16500, 'imagen' => 'productos/carne1.jpeg'],
            ['nombre' => 'Pechuga de Pollo Rellena', 'descripcion' => 'Pechuga jugosa rellena de jamón y queso', 'precio' => 12000, 'imagen' => 'productos/carne2.jpeg'],
            ['nombre' => 'Costillas BBQ', 'descripcion' => 'Costillas tiernas con salsa BBQ de la casa', 'precio' => 15000, 'imagen' => 'productos/carne3.jpeg'],
        ];

        foreach ($carnes as $carne) {
            Producto::updateOrCreate(['nombre' => $carne['nombre']], array_merge($carne, ['categoria_id' => $categoriaCarnes->id]));
        }
        $this->command->info('✅ 3 carnes cargadas');

        // ==================== BEBIDAS (3) ====================
        $categoriaBebidas = Categoria::firstOrCreate(['nombre' => 'Bebidas']);

        $bebidas = [
            ['nombre' => 'Coca-Cola', 'descripcion' => 'Coca-Cola fría (lata 355ml)', 'precio' => 2500, 'imagen' => 'productos/coca-cola.jpg'],
            ['nombre' => 'Pepsi', 'descripcion' => 'Pepsi fría (lata 355ml)', 'precio' => 2500, 'imagen' => 'productos/pepsi.jpg'],
            ['nombre' => 'Té Tropical Arándano', 'descripcion' => 'Bebida refrescante tropical con arándano', 'precio' => 3000, 'imagen' => 'productos/te-tropical-arandano.webp'],
        ];

        foreach ($bebidas as $bebida) {
            Producto::updateOrCreate(['nombre' => $bebida['nombre']], array_merge($bebida, ['categoria_id' => $categoriaBebidas->id]));
        }
        $this->command->info('✅ 3 bebidas cargadas');

        $this->command->info('');
        $this->command->info('🎯 TOTAL: 16 productos con imagen');
        $this->command->info('✨ Seeder completado exitosamente');
    }
}