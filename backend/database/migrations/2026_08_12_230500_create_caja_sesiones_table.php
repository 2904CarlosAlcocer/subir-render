<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('caja_sesiones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('usuario_apertura_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('usuario_cierre_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('fecha_apertura')->useCurrent();
            $table->timestamp('fecha_cierre')->nullable();

            $table->decimal('monto_inicial', 12, 2)->default(0);

            // Estos campos se congelan al cerrar la caja.
            $table->decimal('ventas_efectivo', 12, 2)->nullable();
            $table->decimal('ventas_sinpe', 12, 2)->nullable();
            $table->decimal('ventas_tarjeta', 12, 2)->nullable();
            $table->decimal('total_ventas', 12, 2)->nullable();
            $table->unsignedInteger('cantidad_pedidos')->default(0);

            $table->decimal('efectivo_esperado', 12, 2)->nullable();
            $table->decimal('efectivo_contado', 12, 2)->nullable();
            $table->decimal('diferencia', 12, 2)->nullable();

            $table->string('estado', 20)
                ->default('abierta')
                ->index();

            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->foreignId('caja_sesion_id')
                ->nullable()
                ->after('creado_por_user_id')
                ->constrained('caja_sesiones')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('caja_sesion_id');
        });

        Schema::dropIfExists('caja_sesiones');
    }
};