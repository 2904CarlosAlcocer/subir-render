<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PedidoTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_puede_buscar_un_pedido_por_codigo_tracking(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoriaId = DB::table('categorias')->insertGetId([
            'nombre' => 'Pizzas',
            'descripcion' => 'Categoría de prueba',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productoId = DB::table('productos')->insertGetId([
            'categoria_id' => $categoriaId,
            'nombre' => 'Pizza Pepperoni',
            'descripcion' => 'Producto de prueba',
            'precio' => 8500,
            'imagen' => null,
            'estado' => 'disponible',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $clienteId = DB::table('clientes')->insertGetId([
            'nombre' => 'Carlos Prueba',
            'telefono' => '88888888',
            'correo' => 'carlos@test.com',
            'fecha_registro' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $pedidoId = DB::table('pedidos')->insertGetId([
            'cliente_id' => $clienteId,
            'codigo_tracking' => 'RC-ABC123',
            'modalidad_entrega' => 'retiro',
            'estado_pedido' => 'pendiente',
            'total' => 8500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('detalle_pedidos')->insert([
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => 1,
            'precio_unitario' => 8500,
            'subtotal' => 8500,
            'extras' => null,
            'alergias' => null,
            'observaciones' => 'Bien cocinada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        | Se envía el tracking en minúscula para comprobar que el controlador
        | lo convierta correctamente a mayúscula.
        */

        $response = $this->getJson(
            '/api/pedidos/tracking/rc-abc123'
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'codigo_tracking',
                'RC-ABC123'
            )
            ->assertJsonPath(
                'estado_pedido',
                'pendiente'
            )
            ->assertJsonPath(
                'modalidad_entrega',
                'retiro'
            )
            ->assertJsonPath(
                'cliente.nombre',
                'Carlos Prueba'
            )
            ->assertJsonPath(
                'detalles.0.producto.nombre',
                'Pizza Pepperoni'
            )
            ->assertJsonPath(
                'detalles.0.cantidad',
                1
            )
            ->assertJsonPath(
                'detalles.0.observaciones',
                'Bien cocinada'
            )
            ->assertJsonStructure([
                'id',
                'cliente_id',
                'codigo_tracking',
                'modalidad_entrega',
                'estado_pedido',
                'total',
                'detalles' => [
                    '*' => [
                        'id',
                        'pedido_id',
                        'producto_id',
                        'cantidad',
                        'precio_unitario',
                        'subtotal',
                        'producto',
                    ],
                ],
                'cliente',
            ]);

        $this->assertEquals(
            8500,
            (float) $response->json('total')
        );

        $this->assertEquals(
            8500,
            (float) $response->json(
                'detalles.0.subtotal'
            )
        );
    }

    public function test_devuelve_404_cuando_el_tracking_no_existe(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson(
            '/api/pedidos/tracking/RC-NOEXIS'
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertNotFound()
            ->assertJson([
                'message' => 'No se encontró ningún pedido con ese código.',
            ]);
    }
}