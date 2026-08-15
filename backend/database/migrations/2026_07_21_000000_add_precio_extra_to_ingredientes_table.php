<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el precio individual de cada ingrediente extra.
     */
    public function up(): void
    {
        Schema::table('ingredientes', function (Blueprint $table) {
            $table
                ->decimal('precio_extra', 10, 2)
                ->default(1500)
                ->after('nombre');
        });
    }

    /**
     * Elimina la columna si se revierte la migración.
     */
    public function down(): void
    {
        Schema::table('ingredientes', function (Blueprint $table) {
            $table->dropColumn('precio_extra');
        });
    }
};