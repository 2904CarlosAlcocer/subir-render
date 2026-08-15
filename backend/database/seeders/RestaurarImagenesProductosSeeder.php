<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RestaurarImagenesProductosSeeder extends Seeder
{
    public function run(): void
    {
        $mapa = [
            'Fire Rooster Pizza' =>
                'productos/30uSqPoYBsby2b1iauy7FVRwdDQoWSh2ZOT1ORKD.jpg',

            'Camarones Rooster' =>
                'productos/6CRGCpuwuSpghN54L8t0InMMxfnqG4rfG3brubfv.jpg',

            'Pancetta Rooster' =>
                'productos/6UqUAAwYp8Poe2nK1meeP4VIc1K4Qrm0MX7Vhp4M.jpg',

            'Hawaiana Rooster' =>
                'productos/ehkgM55pnixbhSTSbdu9r7us77xc4esrBHDEeAyz.jpg',

            'Pepperoni Pizza' =>
                'productos/gUDCTYGNkY9RhEUh2i1X2JlZJPzaMxpvTym7WaZE.jpg',

            'Pizza Lomito Rooster' =>
                'productos/hoAjdjneuQRPCrkFZlhXZ5omd43lF0t4BeC3sWUE.jpg',

            'Natural Smoothies' =>
                'productos/In5cx0PGiSXFtMuj8yngsDe4N6eTSJ0fsAr9yfrH.jpg',

            'Churrasco Rooster' =>
                'productos/jEeejyUtHtOcIh214zfknnTbm72R9pSgBaJNSklz.jpg',

            'Lomito Rooster' =>
                'productos/lomito-rooster.webp',

            'Tres Carnes Pizza' =>
                'productos/myjEae5AJ6VT0RJOvT31vbrjXnvTuAjhGamuuMbO.jpg',

            'Costilla Rooster' =>
                'productos/P1QVBIlvz2TURGAFSBjbOcvk4uZbTrx0E3ipW4bh.jpg',

            'Lomito Salsa de Hongos' =>
                'productos/pasta-lomito-salsa-hongos.webp',

            'Pollo Ajillo Chile' =>
                'productos/pasta-pollo-ajillo-chile.webp',

            'Pollo Pesto Pistacho' =>
                'productos/pasta-pollo-pesto-pistacho.webp',

            'Salame Rooster' =>
                'productos/PbyfZl5rMp4xeEiE1GxeF1C6TlulfqxxtRLeCyBt.jpg',

            'Prosciutto Rooster' =>
                'productos/PYqoRJyyXyuhLC5EZjdE1ezUOkndot2fWQD3mQOm.jpg',

            'Lomito / Camarones Salsa Rosada' =>
                'productos/Q9gjmse7EaAox3UadBNYfCjyRk08ck6LDKyC4VcI.jpg',

            'Ribeye Rooster' =>
                'productos/ribeye-rooster.webp',

            'Brasileña Rooster' =>
                'productos/RolTOXfFniQQiFowbeBBY7dcPybnbByVDzcyLSl7.jpg',

            'Jamón & Hongos' =>
                'productos/TzClM1U1akLwTO5ODQyOEvYfsru066fjfQ9r0TtA.jpg',

            'Margarita Rooster' =>
                'productos/vt3TmT6q7HkCS6hQ6nmPtFceDLKvKIXwElJgHqFP.jpg',

            'Gaseosas' =>
                'productos/WjSY6M0O5ZC47pdFwX8VjNF7lA8Fryzq4Ty9SBHE.webp',

            'Vegetariana Rooster' =>
                'productos/y9yMR9rueqRtOsaq58WkujW7KqvyMUWS4LGd89wI.jpg',

            'White / Red Rooster' =>
                'productos/ZyRV4WJ0MJW5t2sIDdrwOpUcXdQ8vH22BqoLX0wC.jpg',
        ];

        DB::transaction(function () use ($mapa): void {
            foreach ($mapa as $nombre => $imagen) {
                $actualizados = DB::table('productos')
                    ->where('nombre', $nombre)
                    ->update([
                        'imagen' => $imagen,
                        'updated_at' => now(),
                    ]);

                $this->command->info(
                    "{$nombre}: {$actualizados} registro(s) actualizado(s)"
                );
            }

            DB::table('productos')
                ->whereIn('nombre', [
                    'Cerveza Premium',
                    'Pasta Ármala a tu gusto',
                ])
                ->update([
                    'imagen' => null,
                    'updated_at' => now(),
                ]);
        });

        $this->command->info(
            'Rutas de imágenes restauradas correctamente.'
        );
    }
}