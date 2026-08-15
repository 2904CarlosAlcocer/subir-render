<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos_pedidos', function (Blueprint $table) {
            $table->string('metodo_pago', 20)->nullable()->change();
            $table->string('estado_pago', 40)->default('pendiente')->change();
        });
    }

    public function down(): void
    {
        Schema::table('pagos_pedidos', function (Blueprint $table) {
            $table->string('metodo_pago', 20)->nullable(false)->change();
            $table->string('estado_pago', 40)->default('no_requiere')->change();
        });
    }
};