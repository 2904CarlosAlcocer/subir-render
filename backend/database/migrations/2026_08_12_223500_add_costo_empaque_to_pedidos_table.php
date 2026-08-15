<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el costo de empaque aplicado a pedidos para retiro.
     */
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->decimal('costo_empaque', 10, 2)
                ->default(0)
                ->after('estado_pedido');
        });
    }

    /**
     * Revierte el campo de costo de empaque.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn('costo_empaque');
        });
    }
};