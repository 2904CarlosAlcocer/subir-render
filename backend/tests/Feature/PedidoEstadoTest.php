<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PedidoEstadoTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Crea un pedido básico para utilizarlo en cada prueba.
     */
    private function crearPedido(
        string $codigoTracking = 'RC-EST123'
    ): int {
        return DB::table('pedidos')->insertGetId([
            'cliente_id' => null,
            'codigo_tracking' => $codigoTracking,
            'modalidad_entrega' => 'retiro',
            'estado_pedido' => 'pendiente',
            'total' => 8500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Simula un usuario autenticado con un rol autorizado.
     */
    private function autenticarComo(string $rol): void
    {
        $usuario = new User();

        $usuario->forceFill([
            'id' => 1,
            'name' => 'Usuario de prueba',
            'email' => "{$rol}@test.com",
            'rol' => $rol,
            'estado' => 'activo',
        ]);

        Sanctum::actingAs($usuario, ['*']);
    }

    public function test_no_permite_cambiar_estado_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/pedidos/{$pedidoId}/estado",
            [
                'estado_pedido' => 'en_preparacion',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'pendiente',
        ]);

        $this->assertDatabaseMissing('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'en_preparacion',
        ]);
    }

    public function test_usuario_autenticado_puede_cambiar_estado_del_pedido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/pedidos/{$pedidoId}/estado",
            [
                'estado_pedido' => 'en_preparacion',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Estado actualizado'
            )
            ->assertJsonPath(
                'pedido.id',
                $pedidoId
            )
            ->assertJsonPath(
                'pedido.estado_pedido',
                'en_preparacion'
            )
            ->assertJsonPath(
                'pedido.codigo_tracking',
                'RC-EST123'
            )
            ->assertJsonStructure([
                'message',
                'pedido' => [
                    'id',
                    'cliente_id',
                    'codigo_tracking',
                    'modalidad_entrega',
                    'estado_pedido',
                    'total',
                    'detalles',
                    'cliente',
                ],
            ]);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'en_preparacion',
        ]);

        $this->assertDatabaseMissing('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'pendiente',
        ]);
    }

    public function test_no_permite_asignar_un_estado_invalido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido('RC-INV123');

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/pedidos/{$pedidoId}/estado",
            [
                'estado_pedido' => 'cancelado_inventado',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'estado_pedido',
            ]);

        /*
         * El pedido debe continuar pendiente porque la
         * solicitud fue rechazada.
         */
        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'pendiente',
        ]);

        $this->assertDatabaseMissing('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'cancelado_inventado',
        ]);
    }

    public function test_estado_pedido_es_obligatorio(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido('RC-REQ123');

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/pedidos/{$pedidoId}/estado",
            []
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'estado_pedido',
            ]);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'pendiente',
        ]);
    }
}