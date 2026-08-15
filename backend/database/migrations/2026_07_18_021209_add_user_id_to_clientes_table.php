<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * La columna ya existe en algunas instalaciones del proyecto.
         * En ese caso, la migración termina sin intentar crearla otra vez.
         */
        if (Schema::hasColumn('clientes', 'user_id')) {
            return;
        }

        Schema::table('clientes', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('id')
                ->constrained('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('clientes', 'user_id')) {
            return;
        }

        Schema::table('clientes', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};