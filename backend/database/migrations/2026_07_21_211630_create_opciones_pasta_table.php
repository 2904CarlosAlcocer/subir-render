<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crea el catálogo administrable de opciones
     * utilizadas para personalizar pastas.
     */
    public function up(): void
    {
        Schema::create(
            'opciones_pasta',
            function (Blueprint $table) {
                $table->id();

                /*
                 * Grupos permitidos desde Laravel:
                 *
                 * - tipo_pasta
                 * - proteina
                 * - salsa
                 * - ingrediente
                 */
                $table
                    ->string('grupo', 30);

                $table
                    ->string('nombre', 100);

                /*
                 * Precio que se suma al precio base
                 * del producto personalizable.
                 *
                 * Puede ser cero cuando la opción
                 * ya esté incluida en el precio base.
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
                 * Permite controlar el orden en que
                 * las opciones aparecen en React.
                 */
                $table
                    ->unsignedInteger('orden')
                    ->default(0);

                $table->timestamps();

                /*
                 * Impide registrar dos opciones con
                 * el mismo nombre dentro del mismo grupo.
                 *
                 * Sí permite, por ejemplo, que un nombre
                 * exista en grupos distintos.
                 */
                $table->unique(
                    [
                        'grupo',
                        'nombre',
                    ],
                    'opciones_pasta_grupo_nombre_unique'
                );

                /*
                 * Optimiza las consultas del menú público
                 * y del panel administrativo.
                 */
                $table->index(
                    [
                        'grupo',
                        'estado',
                        'orden',
                    ],
                    'opciones_pasta_busqueda_index'
                );
            }
        );
    }

    /**
     * Elimina el catálogo de opciones de pasta.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'opciones_pasta'
        );
    }
};