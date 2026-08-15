<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('caja_sesiones', function (Blueprint $table) {
            /*
             |--------------------------------------------------------------------------
             | USUARIO ASIGNADO PARA TRABAJAR LA CAJA
             |--------------------------------------------------------------------------
             |
             | usuario_apertura_id: Quién ABRIÓ la caja (siempre es Admin)
             | usuario_asignado_id: Quién TRABAJA la caja (Admin o Caja)
             |
             | Ejemplo:
             | Admin Carlos abre la caja y la asigna a Caja María.
             |
             | usuario_apertura_id = 1 (Carlos)
             | usuario_asignado_id = 2 (María)
             |
             */
            $table->foreignId('usuario_asignado_id')
                ->nullable()
                ->after('usuario_apertura_id')
                ->constrained('users')
                ->nullOnDelete();

            // Mejorar índices para consultas rápidas
            $table->index(['estado', 'fecha_apertura'], 'caja_sesiones_estado_fecha_index');
        });

        /*
         |--------------------------------------------------------------------------
         | ACTUALIZAR REGISTROS EXISTENTES
         |--------------------------------------------------------------------------
         |
         | Los registros antiguos que no tengan usuario_asignado_id
         | tomarán el mismo valor que usuario_apertura_id.
         |
         */
        DB::table('caja_sesiones')
            ->whereNull('usuario_asignado_id')
            ->update([
                'usuario_asignado_id' => DB::raw('usuario_apertura_id')
            ]);
    }

    public function down(): void
    {
        Schema::table('caja_sesiones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('usuario_asignado_id');
            $table->dropIndex('caja_sesiones_estado_fecha_index');
        });
    }
};