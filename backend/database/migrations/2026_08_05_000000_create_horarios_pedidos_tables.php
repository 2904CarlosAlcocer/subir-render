<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios_atencion', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('dia_semana')->unique();
            $table->string('nombre_dia', 20);
            $table->time('hora_apertura')->default('12:00:00');
            $table->time('hora_ultimo_pedido')->default('21:30:00');
            $table->time('hora_cierre')->default('22:00:00');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('excepciones_horario', function (Blueprint $table) {
            $table->id();
            $table->date('fecha')->unique();
            $table->time('hora_apertura')->nullable();
            $table->time('hora_ultimo_pedido')->nullable();
            $table->time('hora_cierre')->nullable();
            $table->boolean('pedidos_pausados')->default(false);
            $table->string('motivo', 255)->nullable();
            $table->foreignId('creado_por_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();
        });

        $ahora = now();

        DB::table('horarios_atencion')->insert([
            ['dia_semana' => 0, 'nombre_dia' => 'Domingo',   'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['dia_semana' => 1, 'nombre_dia' => 'Lunes',     'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['dia_semana' => 2, 'nombre_dia' => 'Martes',    'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['dia_semana' => 3, 'nombre_dia' => 'Miércoles', 'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['dia_semana' => 4, 'nombre_dia' => 'Jueves',    'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['dia_semana' => 5, 'nombre_dia' => 'Viernes',   'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['dia_semana' => 6, 'nombre_dia' => 'Sábado',    'hora_apertura' => '12:00:00', 'hora_ultimo_pedido' => '21:30:00', 'hora_cierre' => '22:00:00', 'activo' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('excepciones_horario');
        Schema::dropIfExists('horarios_atencion');
    }
};
