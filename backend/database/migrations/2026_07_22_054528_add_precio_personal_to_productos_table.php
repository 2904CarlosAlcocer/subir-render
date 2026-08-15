<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el precio opcional para pizzas
     * de tamaño personal.
     */
    public function up(): void
    {
        Schema::table(
            'productos',
            function (Blueprint $table) {
                /*
                 * precio:
                 * Precio normal o grande del producto.
                 *
                 * precio_personal:
                 * Precio de la pizza personal.
                 *
                 * Se mantiene nullable porque las carnes,
                 * pastas, bebidas y algunas pizzas solamente
                 * tienen un precio.
                 */
                $table
                    ->decimal(
                        'precio_personal',
                        10,
                        2
                    )
                    ->nullable();
            }
        );
    }

    /**
     * Elimina el precio personal.
     */
    public function down(): void
    {
        Schema::table(
            'productos',
            function (Blueprint $table) {
                $table->dropColumn(
                    'precio_personal'
                );
            }
        );
    }
};