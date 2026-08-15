<?php

namespace Database\Seeders;

use App\Models\Acompanamiento;
use App\Models\Categoria;
use App\Models\OpcionPasta;
use App\Models\Producto;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuRealSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $categorias = [
                'Pizzas' => 'Pizzas artesanales hechas a la leña.',
                'Pastas' => 'Pastas de la casa y opciones para armar al gusto.',
                'Carnes' => 'Carnes preparadas al grill. La costilla se cocina al horno durante 4 horas.',
                'Bebidas' => 'Bebidas disponibles en el restaurante.',
            ];

            $categoriasGuardadas = [];

            foreach ($categorias as $nombre => $descripcion) {
                $categoria = Categoria::query()
                    ->whereRaw('LOWER(TRIM(nombre)) = ?', [
                        mb_strtolower($nombre),
                    ])
                    ->first();

                if (!$categoria) {
                    $categoria = new Categoria();
                }

                $categoria->nombre = $nombre;
                $categoria->descripcion = $descripcion;
                $categoria->estado = 'activa';
                $categoria->save();

                $categoriasGuardadas[$nombre] = $categoria;
            }

            /*
             * No se eliminan productos viejos porque pueden estar relacionados
             * con pedidos anteriores. Solamente se marcan como agotados.
             */
            Producto::query()
                ->whereIn(
                    'categoria_id',
                    collect($categoriasGuardadas)
                        ->pluck('id')
                        ->all()
                )
                ->update([
                    'estado' => 'agotado',
                ]);

            $productos = [
                /*
                 * PIZZAS
                 */
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'White / Red Rooster',
                    'descripcion' => 'Base de salsa roja, pollo, tres quesos, hongos, cebolla y chile dulce.',
                    'precio' => 8950,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-white-red-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Margarita Rooster',
                    'descripcion' => 'Tomate fresco, albahaca y tres tipos de queso.',
                    'precio' => 8500,
                    'precio_personal' => 6000,
                    'imagen' => 'productos/pizza-margarita-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Jamón & Hongos',
                    'descripcion' => 'Jamón y hongos frescos.',
                    'precio' => 8500,
                    'precio_personal' => 6000,
                    'imagen' => 'productos/pizza-jamon-hongos.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Brasileña Rooster',
                    'descripcion' => 'Carne, salame, hongos, tomate, cebolla y chile dulce.',
                    'precio' => 8950,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-brasilena-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Vegetariana Rooster',
                    'descripcion' => 'Berenjena, zucchini, hongos, tomate, cebolla y chile dulce.',
                    'precio' => 8500,
                    'precio_personal' => 6000,
                    'imagen' => 'productos/pizza-vegetariana-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Camarones Rooster',
                    'descripcion' => 'Camarones, tres quesos, cebolla y hongos.',
                    'precio' => 9500,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-camarones-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Salame Rooster',
                    'descripcion' => 'Salame, cebolla y chile dulce.',
                    'precio' => 8500,
                    'precio_personal' => 6000,
                    'imagen' => 'productos/pizza-salame-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Prosciutto Rooster',
                    'descripcion' => 'Prosciutto, tres quesos y arúgula.',
                    'precio' => 9500,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-prosciutto-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Pancetta Rooster',
                    'descripcion' => 'Jamón, pancetta, salame, cebolla morada y tomate cherry.',
                    'precio' => 9500,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-pancetta-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Hawaiana Rooster',
                    'descripcion' => 'Jamón de la casa, piña y tres tipos de queso.',
                    'precio' => 8500,
                    'precio_personal' => 6000,
                    'imagen' => 'productos/pizza-hawaiana-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Fire Rooster Pizza',
                    'descripcion' => 'Carne, jamón, hongos, chile dulce y jalapeño.',
                    'precio' => 8950,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-fire-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Pepperoni Pizza',
                    'descripcion' => 'Pepperoni, hongos y cebolla.',
                    'precio' => 8500,
                    'precio_personal' => 6000,
                    'imagen' => 'productos/pizza-pepperoni.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Tres Carnes Pizza',
                    'descripcion' => 'Prosciutto, jamón, pepperoni, chile, aceitunas negras y cebolla.',
                    'precio' => 9500,
                    'precio_personal' => 6500,
                    'imagen' => 'productos/pizza-tres-carnes.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pizzas',
                    'nombre' => 'Pizza Lomito Rooster',
                    'descripcion' => 'Lomito, chile y cebolla.',
                    'precio' => 10500,
                    'precio_personal' => null,
                    'imagen' => 'productos/pizza-lomito-rooster.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],

                /*
                 * CARNES
                 */
                [
                    'categoria' => 'Carnes',
                    'nombre' => 'Costilla Rooster',
                    'descripcion' => 'Costilla cocinada al horno durante 4 horas, con acompañamientos a elegir.',
                    'precio' => 8500,
                    'precio_personal' => null,
                    'imagen' => 'productos/costilla-rooster.webp',
                    'tipo_personalizacion' => Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Carnes',
                    'nombre' => 'Ribeye Rooster',
                    'descripcion' => 'Ribeye preparado al grill, con acompañamientos a elegir.',
                    'precio' => 12950,
                    'precio_personal' => null,
                    'imagen' => 'productos/ribeye-rooster.webp',
                    'tipo_personalizacion' => Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Carnes',
                    'nombre' => 'Lomito Rooster',
                    'descripcion' => 'Lomito preparado al grill, con acompañamientos a elegir.',
                    'precio' => 10950,
                    'precio_personal' => null,
                    'imagen' => 'productos/lomito-rooster.webp',
                    'tipo_personalizacion' => Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Carnes',
                    'nombre' => 'Churrasco Rooster',
                    'descripcion' => 'Churrasco preparado al grill, con acompañamientos a elegir.',
                    'precio' => 11950,
                    'precio_personal' => null,
                    'imagen' => 'productos/churrasco-rooster.webp',
                    'tipo_personalizacion' => Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    'estado' => 'disponible',
                ],

                /*
                 * PASTAS FIJAS
                 */
                [
                    'categoria' => 'Pastas',
                    'nombre' => 'Lomito / Camarones Salsa Rosada',
                    'descripcion' => 'Pasta con lomito, camarones y salsa rosada.',
                    'precio' => 8950,
                    'precio_personal' => null,
                    'imagen' => 'productos/pasta-lomito-camarones-salsa-rosada.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pastas',
                    'nombre' => 'Lomito Salsa de Hongos',
                    'descripcion' => 'Pasta con lomito y salsa de hongos.',
                    'precio' => 8500,
                    'precio_personal' => null,
                    'imagen' => 'productos/pasta-lomito-salsa-hongos.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pastas',
                    'nombre' => 'Pollo Pesto Pistacho',
                    'descripcion' => 'Pasta con pollo, pesto y pistacho.',
                    'precio' => 8500,
                    'precio_personal' => null,
                    'imagen' => 'productos/pasta-pollo-pesto-pistacho.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Pastas',
                    'nombre' => 'Pollo Ajillo Chile',
                    'descripcion' => 'Pasta con pollo al ajillo y chile.',
                    'precio' => 8500,
                    'precio_personal' => null,
                    'imagen' => 'productos/pasta-pollo-ajillo-chile.webp',
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],

                /*
                 * El precio de "Ármala a tu gusto" no aparece en las imágenes.
                 * Se crea agotada y con precio 0 para no cobrar un monto inventado.
                 * Cuando el negocio confirme el precio, edítala en el Dashboard
                 * y cámbiala a disponible.
                 */
                [
                    'categoria' => 'Pastas',
                    'nombre' => 'Pasta Ármala a tu gusto',
                    'descripcion' => 'Elige spaghetti, fettuccine o penne; salsa de tomate, blanca o pesto; y pollo, carne o primavera.',
                    'precio' => 0,
                    'precio_personal' => null,
                    'imagen' => null,
                    'tipo_personalizacion' => Producto::PERSONALIZACION_PASTA,
                    'estado' => 'agotado',
                ],

                /*
                 * BEBIDAS
                 */
                [
                    'categoria' => 'Bebidas',
                    'nombre' => 'Natural Smoothies',
                    'descripcion' => 'Smoothie natural de fruta de temporada.',
                    'precio' => 2000,
                    'precio_personal' => null,
                    'imagen' => null,
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Bebidas',
                    'nombre' => 'Gaseosas',
                    'descripcion' => 'Gaseosas disponibles en el restaurante.',
                    'precio' => 1500,
                    'precio_personal' => null,
                    'imagen' => null,
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
                [
                    'categoria' => 'Bebidas',
                    'nombre' => 'Cerveza Premium',
                    'descripcion' => 'Cerveza premium.',
                    'precio' => 2300,
                    'precio_personal' => null,
                    'imagen' => null,
                    'tipo_personalizacion' => null,
                    'estado' => 'disponible',
                ],
            ];

            foreach ($productos as $datos) {
                $categoria = $categoriasGuardadas[
                    $datos['categoria']
                ];

                Producto::query()->updateOrCreate(
                    [
                        'nombre' => $datos['nombre'],
                    ],
                    [
                        'categoria_id' => $categoria->id,
                        'descripcion' => $datos['descripcion'],
                        'precio' => $datos['precio'],
                        'precio_personal' => $datos['precio_personal'],
                        'imagen' => $datos['imagen'],
                        'estado' => $datos['estado'],
                        'tipo_personalizacion' => $datos['tipo_personalizacion'],
                    ]
                );
            }

            /*
             * ACOMPAÑAMIENTOS DE CARNES
             *
             * El menú no muestra el precio de los acompañamientos adicionales.
             * Si la opción ya existía, se conserva precio_extra.
             * Las opciones nuevas quedan en 0 hasta que el negocio confirme el monto.
             */
            $acompanamientos = [
                'Papa asada',
                'Ensalada',
                'Vegetales al grill',
                'Puré',
                'Arroz',
                'Vegetales salteados',
            ];

            foreach ($acompanamientos as $indice => $nombre) {
                $acompanamiento = Acompanamiento::query()
                    ->whereRaw('LOWER(TRIM(nombre)) = ?', [
                        mb_strtolower($nombre),
                    ])
                    ->first();

                if (!$acompanamiento) {
                    $acompanamiento =
                        new Acompanamiento();

                    $acompanamiento->nombre =
                        $nombre;

                    $acompanamiento->setAttribute(
                        'precio_extra',
                        '0.00'
                    );
                }

                $acompanamiento->nombre =
                    $nombre;

                $acompanamiento->estado =
                    Acompanamiento::ESTADO_DISPONIBLE;

                $acompanamiento->orden =
                    $indice + 1;

                $acompanamiento->save();
            }

            /*
             * OPCIONES DE "ÁRMALA A TU GUSTO"
             *
             * Los precios extra no aparecen en la imagen.
             * Si una opción ya existía se conserva su precio.
             * Las nuevas se crean en 0.
             */
            $opcionesPasta = [
                [
                    'grupo' => OpcionPasta::GRUPO_TIPO_PASTA,
                    'nombres' => [
                        'Spaghetti',
                        'Fettuccine',
                        'Penne',
                    ],
                ],
                [
                    'grupo' => OpcionPasta::GRUPO_SALSA,
                    'nombres' => [
                        'Tomate',
                        'Blanca',
                        'Pesto',
                    ],
                ],
                [
                    'grupo' => OpcionPasta::GRUPO_PROTEINA,
                    'nombres' => [
                        'Pollo',
                        'Carne',
                        'Primavera',
                    ],
                ],
            ];

            foreach ($opcionesPasta as $grupoDatos) {
                foreach (
                    $grupoDatos['nombres']
                    as $indice => $nombre
                ) {
                    $opcion = OpcionPasta::query()
                        ->where('grupo', $grupoDatos['grupo'])
                        ->whereRaw('LOWER(TRIM(nombre)) = ?', [
                            mb_strtolower($nombre),
                        ])
                        ->first();

                    if (!$opcion) {
                        $opcion = new OpcionPasta();

                        $opcion->grupo =
                            $grupoDatos['grupo'];

                        $opcion->nombre =
                            $nombre;

                        $opcion->setAttribute(
                            'precio_extra',
                            '0.00'
                        );
                    }

                    $opcion->grupo =
                        $grupoDatos['grupo'];

                    $opcion->nombre =
                        $nombre;

                    $opcion->estado =
                        OpcionPasta::ESTADO_DISPONIBLE;

                    $opcion->orden =
                        $indice + 1;

                    $opcion->save();
                }
            }
        });
    }
}
