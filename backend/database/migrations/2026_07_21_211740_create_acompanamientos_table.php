<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crea el catálogo administrable de acompañamientos
     * disponibles para los productos de carnes.
     */
    public function up(): void
    {
        Schema::create(
            'acompanamientos',
            function (Blueprint $table) {
                $table->id();

                $table
                    ->string('nombre', 100)
                    ->unique();

                /*
                 * Este precio se cobra únicamente cuando
                 * el acompañamiento queda en la tercera
                 * posición seleccionada o posterior.
                 *
                 * Los primeros dos acompañamientos son
                 * incluidos y Laravel aplicará precio cero.
                 */
                $table
                    ->decimal(
                        'precio_extra',
                        10,
                        2
                    )
                    ->default(0);

                /*
                 * Estados utilizados:
                 *
                 * - disponible
                 * - agotado
                 */
                $table
                    ->string('estado', 30)
                    ->default('disponible');

                /*
                 * Controla el orden en que aparecen
                 * los acompañamientos en el frontend.
                 */
                $table
                    ->unsignedInteger('orden')
                    ->default(0);

                $table->timestamps();

                /*
                 * Optimiza la consulta del menú público
                 * y del panel administrativo.
                 */
                $table->index(
                    [
                        'estado',
                        'orden',
                    ],
                    'acompanamientos_estado_orden_index'
                );
            }
        );
    }

    /**
     * Elimina el catálogo de acompañamientos.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'acompanamientos'
        );
    }
};