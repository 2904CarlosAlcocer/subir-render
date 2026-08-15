<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('caja_sesiones', function (Blueprint $table) {
            $table->text('observaciones_apertura')
                ->nullable()
                ->after('monto_inicial');

            $table->decimal('entradas_efectivo', 12, 2)
                ->default(0)
                ->after('cantidad_pedidos');

            $table->decimal('salidas_efectivo', 12, 2)
                ->default(0)
                ->after('entradas_efectivo');

            $table->string('motivo_diferencia', 60)
                ->nullable()
                ->after('diferencia');

            $table->text('detalle_diferencia')
                ->nullable()
                ->after('motivo_diferencia');
        });

        Schema::create('caja_movimientos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('caja_sesion_id')
                ->constrained('caja_sesiones')
                ->cascadeOnDelete();

            $table->foreignId('usuario_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('tipo', 20)->index();
            $table->decimal('monto', 12, 2);
            $table->string('motivo', 120);
            $table->text('observaciones')->nullable();

            $table->timestamps();

            $table->index(
                ['caja_sesion_id', 'tipo'],
                'caja_movimientos_sesion_tipo_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('caja_movimientos');

        Schema::table('caja_sesiones', function (Blueprint $table) {
            $table->dropColumn([
                'observaciones_apertura',
                'entradas_efectivo',
                'salidas_efectivo',
                'motivo_diferencia',
                'detalle_diferencia',
            ]);
        });
    }
};
