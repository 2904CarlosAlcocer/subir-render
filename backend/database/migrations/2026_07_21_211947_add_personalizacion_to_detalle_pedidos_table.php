<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega la composición estructurada calculada
     * por Laravel a cada detalle del pedido.
     */
    public function up(): void
    {
        Schema::table(
            'detalle_pedidos',
            function (Blueprint $table) {
                /*
                 * Guardará una fotografía de la personalización
                 * existente al momento de crear el pedido.
                 *
                 * Ejemplos:
                 *
                 * - Tipo de pasta.
                 * - Proteínas.
                 * - Salsa.
                 * - Ingredientes adicionales.
                 * - Acompañamientos incluidos.
                 * - Acompañamientos cobrados.
                 * - Precios aplicados desde la base de datos.
                 *
                 * Los productos normales y las pizzas actuales
                 * pueden mantener este campo en null.
                 */
                $table
                    ->json('personalizacion')
                    ->nullable()
                    ->after('observaciones');
            }
        );
    }

    /**
     * Elimina la composición estructurada.
     */
    public function down(): void
    {
        Schema::table(
            'detalle_pedidos',
            function (Blueprint $table) {
                $table->dropColumn(
                    'personalizacion'
                );
            }
        );
    }
};