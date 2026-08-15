<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de mensajes enviados
     * desde el formulario público de contacto.
     */
    public function up(): void
    {
        Schema::create(
            'mensajes_contacto',
            function (Blueprint $table) {
                $table->id();

                /*
                |--------------------------------------------------------------------------
                | INFORMACIÓN DEL CLIENTE
                |--------------------------------------------------------------------------
                */

                $table->string(
                    'nombre',
                    120
                );

                $table->string(
                    'telefono',
                    30
                );

                $table->string(
                    'correo',
                    150
                )->nullable();

                /*
                |--------------------------------------------------------------------------
                | CONTENIDO DEL MENSAJE
                |--------------------------------------------------------------------------
                */

                $table->string(
                    'asunto',
                    120
                )->default(
                    'Consulta general'
                );

                $table->text(
                    'mensaje'
                );

                /*
                |--------------------------------------------------------------------------
                | ESTADO DEL MENSAJE
                |--------------------------------------------------------------------------
                |
                | Valores permitidos:
                |
                | nuevo
                | leido
                | atendido
                | archivado
                |
                */

                $table->string(
                    'estado',
                    20
                )->default(
                    'nuevo'
                );

                /*
                |--------------------------------------------------------------------------
                | FECHAS DE GESTIÓN
                |--------------------------------------------------------------------------
                */

                $table->timestamp(
                    'leido_at'
                )->nullable();

                $table->timestamp(
                    'atendido_at'
                )->nullable();

                $table->timestamp(
                    'archivado_at'
                )->nullable();

                /*
                |--------------------------------------------------------------------------
                | ADMINISTRADOR RESPONSABLE
                |--------------------------------------------------------------------------
                */

                $table->foreignId(
                    'atendido_por_user_id'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                /*
                |--------------------------------------------------------------------------
                | INFORMACIÓN DE SEGURIDAD
                |--------------------------------------------------------------------------
                |
                | La IP y el navegador ayudan a investigar
                | mensajes repetidos o intentos de spam.
                |
                */

                $table->string(
                    'ip_address',
                    45
                )->nullable();

                $table->text(
                    'user_agent'
                )->nullable();

                $table->timestamps();

                /*
                |--------------------------------------------------------------------------
                | ÍNDICES
                |--------------------------------------------------------------------------
                */

                $table->index(
                    'estado'
                );

                $table->index(
                    'telefono'
                );

                $table->index(
                    'created_at'
                );

                $table->index([
                    'estado',
                    'created_at',
                ]);
            }
        );
    }

    /**
     * Eliminar la tabla.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'mensajes_contacto'
        );
    }
};