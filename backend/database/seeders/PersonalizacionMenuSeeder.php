<?php

namespace Database\Seeders;

use App\Models\Acompanamiento;
use App\Models\OpcionPasta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PersonalizacionMenuSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->crearOpcionesPasta();
            $this->crearAcompanamientos();
        });
    }

    private function crearOpcionesPasta(): void
    {
        $opciones = [
            /*
            |--------------------------------------------------------------------------
            | TIPOS DE PASTA
            |--------------------------------------------------------------------------
            */

            [
                'grupo' =>
                    OpcionPasta::GRUPO_TIPO_PASTA,

                'nombre' =>
                    'Fettuccine',

                'precio_extra' =>
                    0,

                'orden' =>
                    1,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_TIPO_PASTA,

                'nombre' =>
                    'Penne',

                'precio_extra' =>
                    0,

                'orden' =>
                    2,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_TIPO_PASTA,

                'nombre' =>
                    'Spaghetti',

                'precio_extra' =>
                    0,

                'orden' =>
                    3,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_TIPO_PASTA,

                'nombre' =>
                    'Fusilli',

                'precio_extra' =>
                    500,

                'orden' =>
                    4,
            ],

            /*
            |--------------------------------------------------------------------------
            | PROTEÍNAS
            |--------------------------------------------------------------------------
            */

            [
                'grupo' =>
                    OpcionPasta::GRUPO_PROTEINA,

                'nombre' =>
                    'Pollo a la parrilla',

                'precio_extra' =>
                    2000,

                'orden' =>
                    1,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_PROTEINA,

                'nombre' =>
                    'Carne de res',

                'precio_extra' =>
                    2500,

                'orden' =>
                    2,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_PROTEINA,

                'nombre' =>
                    'Camarones',

                'precio_extra' =>
                    3000,

                'orden' =>
                    3,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_PROTEINA,

                'nombre' =>
                    'Tocineta',

                'precio_extra' =>
                    1800,

                'orden' =>
                    4,
            ],

            /*
            |--------------------------------------------------------------------------
            | SALSAS
            |--------------------------------------------------------------------------
            */

            [
                'grupo' =>
                    OpcionPasta::GRUPO_SALSA,

                'nombre' =>
                    'Salsa Alfredo',

                'precio_extra' =>
                    0,

                'orden' =>
                    1,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_SALSA,

                'nombre' =>
                    'Salsa Arrabbiata',

                'precio_extra' =>
                    0,

                'orden' =>
                    2,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_SALSA,

                'nombre' =>
                    'Salsa Pomodoro',

                'precio_extra' =>
                    0,

                'orden' =>
                    3,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_SALSA,

                'nombre' =>
                    'Salsa Pesto',

                'precio_extra' =>
                    1000,

                'orden' =>
                    4,
            ],

            /*
            |--------------------------------------------------------------------------
            | INGREDIENTES ADICIONALES
            |--------------------------------------------------------------------------
            */

            [
                'grupo' =>
                    OpcionPasta::GRUPO_INGREDIENTE,

                'nombre' =>
                    'Champiñones',

                'precio_extra' =>
                    700,

                'orden' =>
                    1,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_INGREDIENTE,

                'nombre' =>
                    'Brócoli',

                'precio_extra' =>
                    600,

                'orden' =>
                    2,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_INGREDIENTE,

                'nombre' =>
                    'Espinaca',

                'precio_extra' =>
                    500,

                'orden' =>
                    3,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_INGREDIENTE,

                'nombre' =>
                    'Queso parmesano',

                'precio_extra' =>
                    800,

                'orden' =>
                    4,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_INGREDIENTE,

                'nombre' =>
                    'Tomate cherry',

                'precio_extra' =>
                    700,

                'orden' =>
                    5,
            ],

            [
                'grupo' =>
                    OpcionPasta::GRUPO_INGREDIENTE,

                'nombre' =>
                    'Cebolla caramelizada',

                'precio_extra' =>
                    700,

                'orden' =>
                    6,
            ],
        ];

        foreach ($opciones as $opcion) {
            OpcionPasta::updateOrCreate(
                [
                    'grupo' =>
                        $opcion['grupo'],

                    'nombre' =>
                        $opcion['nombre'],
                ],
                [
                    'precio_extra' =>
                        $opcion['precio_extra'],

                    'estado' =>
                        OpcionPasta::ESTADO_DISPONIBLE,

                    'orden' =>
                        $opcion['orden'],
                ]
            );
        }
    }

    private function crearAcompanamientos(): void
    {
        /*
         * precio_extra se cobrará únicamente cuando
         * el acompañamiento sea el tercero o uno posterior.
         */
        $acompanamientos = [
            [
                'nombre' =>
                    'Papas fritas',

                'precio_extra' =>
                    1500,

                'orden' =>
                    1,
            ],

            [
                'nombre' =>
                    'Ensalada verde',

                'precio_extra' =>
                    1300,

                'orden' =>
                    2,
            ],

            [
                'nombre' =>
                    'Puré de papa',

                'precio_extra' =>
                    1500,

                'orden' =>
                    3,
            ],

            [
                'nombre' =>
                    'Vegetales salteados',

                'precio_extra' =>
                    1600,

                'orden' =>
                    4,
            ],

            [
                'nombre' =>
                    'Arroz',

                'precio_extra' =>
                    1200,

                'orden' =>
                    5,
            ],

            [
                'nombre' =>
                    'Yuca frita',

                'precio_extra' =>
                    1500,

                'orden' =>
                    6,
            ],
        ];

        foreach (
            $acompanamientos
            as $acompanamiento
        ) {
            Acompanamiento::updateOrCreate(
                [
                    'nombre' =>
                        $acompanamiento[
                            'nombre'
                        ],
                ],
                [
                    'precio_extra' =>
                        $acompanamiento[
                            'precio_extra'
                        ],

                    'estado' =>
                        Acompanamiento::ESTADO_DISPONIBLE,

                    'orden' =>
                        $acompanamiento[
                            'orden'
                        ],
                ]
            );
        }
    }
}