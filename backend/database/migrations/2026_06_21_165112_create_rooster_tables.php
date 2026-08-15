<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabla de Categorías
Schema::create('categorias', function (Blueprint $table) {
    $table->id();
    $table->string('nombre', 100);
    $table->string('descripcion', 255)->nullable();
    $table->string('estado', 50)->default('activa');
    $table->timestamps();
});

// Tabla de Productos (Pizzas)
Schema::create('productos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('categoria_id')->constrained('categorias')->onDelete('cascade');
    $table->string('nombre', 120);
    $table->string('descripcion', 255)->nullable();
    $table->decimal('precio', 10, 2);
    $table->string('imagen', 255)->nullable();
    $table->string('estado', 50)->default('disponible');
    $table->timestamps();
});

// Tabla de Ingredientes
Schema::create('ingredientes', function (Blueprint $table) {
    $table->id();
    $table->string('nombre', 100);
    $table->string('estado', 50)->default('disponible');
    $table->timestamps();
});

// Tabla de relación Producto-Ingredientes
Schema::create('producto_ingredientes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('producto_id')->constrained('productos')->onDelete('cascade');
    $table->foreignId('ingrediente_id')->constrained('ingredientes')->onDelete('cascade');
    $table->timestamps();
});

// Tabla de Clientes
Schema::create('clientes', function (Blueprint $table) {
    $table->id();
    $table->string('nombre', 100);
    $table->string('telefono', 20)->nullable();
    $table->string('correo', 150)->nullable();
    $table->timestamp('fecha_registro')->useCurrent();
    $table->timestamps();
});

// Tabla de Pedidos
Schema::create('pedidos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('cliente_id')->nullable()->constrained('clientes')->onDelete('set null');
    $table->string('codigo_tracking', 20)->unique();
    $table->string('modalidad_entrega', 50); // 'consumo_local' o 'retiro'
    $table->string('estado_pedido', 50)->default('recibido'); // recibido, en_preparacion, listo
    $table->decimal('total', 10, 2);
    $table->timestamps();
});

// Tabla de Detalles de Pedido
Schema::create('detalle_pedidos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pedido_id')->constrained('pedidos')->onDelete('cascade');
    $table->foreignId('producto_id')->constrained('productos')->onDelete('cascade');
    $table->integer('cantidad');
    $table->decimal('precio_unitario', 10, 2);
    $table->decimal('subtotal', 10, 2);
    $table->text('extras')->nullable();
    $table->string('alergias', 255)->nullable();
    $table->text('observaciones')->nullable();
    $table->timestamps();
});

// Tabla de Promociones
Schema::create('promociones', function (Blueprint $table) {
    $table->id();
    $table->string('titulo', 120);
    $table->string('descripcion', 255)->nullable();
    $table->string('imagen', 255)->nullable();
    $table->date('fecha_inicio')->nullable();
    $table->date('fecha_fin')->nullable();
    $table->string('estado', 50)->default('activa');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
   public function down(): void
{
    Schema::dropIfExists('detalle_pedidos');
    Schema::dropIfExists('pedidos');
    Schema::dropIfExists('clientes');
    Schema::dropIfExists('producto_ingredientes');
    Schema::dropIfExists('ingredientes');
    Schema::dropIfExists('productos');
    Schema::dropIfExists('categorias');
    Schema::dropIfExists('promociones');
}
};
