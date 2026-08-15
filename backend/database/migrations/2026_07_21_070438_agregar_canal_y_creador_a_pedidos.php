<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el origen y el usuario que creó el pedido.
     */
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            /*
             * web:
             * Pedido realizado por un cliente autenticado.
             *
             * caja:
             * Pedido registrado por un cajero o administrador.
             */
            $table->string('canal', 20)
                ->default('web')
                ->after('modalidad_entrega')
                ->index();

            /*
             * Guarda la cuenta autenticada que creó el pedido:
             *
             * - Cliente, cuando compra desde la página.
             * - Cajero o administrador, cuando se crea desde CajaDashboard.
             *
             * Si la cuenta se elimina, el pedido se conserva.
             */
            $table->foreignId('creado_por_user_id')
                ->nullable()
                ->after('canal')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Revierte los cambios.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropConstrainedForeignId(
                'creado_por_user_id'
            );

            $table->dropColumn('canal');
        });
    }
};