<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Indica qué tipo de personalizador utiliza
     * cada producto del menú.
     */
    public function up(): void
    {
        Schema::table(
            'productos',
            function (Blueprint $table) {
                /*
                 * Valores utilizados:
                 *
                 * - null:
                 *   Producto normal o pizza existente.
                 *
                 * - pasta:
                 *   Abre el personalizador de pastas.
                 *
                 * - acompanamientos:
                 *   Abre el selector de acompañamientos
                 *   para productos de carnes.
                 *
                 * No se utiliza enum para permitir
                 * ampliar los tipos en el futuro.
                 */
                $table
                    ->string(
                        'tipo_personalizacion',
                        30
                    )
                    ->nullable()
                    ->after('estado');

                /*
                 * Mejora las búsquedas de productos
                 * según su tipo de personalización.
                 */
                $table->index(
                    'tipo_personalizacion',
                    'productos_tipo_personalizacion_index'
                );
            }
        );
    }

    /**
     * Elimina la configuración del personalizador.
     */
    public function down(): void
    {
        Schema::table(
            'productos',
            function (Blueprint $table) {
                $table->dropIndex(
                    'productos_tipo_personalizacion_index'
                );

                $table->dropColumn(
                    'tipo_personalizacion'
                );
            }
        );
    }
};