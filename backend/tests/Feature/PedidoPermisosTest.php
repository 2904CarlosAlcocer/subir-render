<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PedidoPermisosTest extends TestCase
{
    use RefreshDatabase;

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

    private function crearPedido(
        string $codigo = 'RC-PER123'
    ): int {
        return DB::table('pedidos')->insertGetId([
            'cliente_id' => null,
            'codigo_tracking' => $codigo,
            'modalidad_entrega' => 'retiro',
            'estado_pedido' => 'pendiente',
            'total' => 10000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_cliente_no_puede_cambiar_estado_del_pedido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->autenticarComo('cliente');

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
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'No tienes permiso para gestionar pedidos.'
            );

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'pendiente',
        ]);
    }

    public function test_cliente_no_puede_listar_todos_los_pedidos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearPedido();

        $this->autenticarComo('cliente');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/pedidos');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'No tienes permiso para gestionar pedidos.'
            );
    }

    public function test_cocina_puede_listar_los_pedidos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearPedido();

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/pedidos');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath(
                '0.codigo_tracking',
                'RC-PER123'
            );
    }

    public function test_cocina_puede_cambiar_estado_del_pedido(): void
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
                'pedido.estado_pedido',
                'en_preparacion'
            );

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'estado_pedido' => 'en_preparacion',
        ]);
    }

    public function test_cocina_no_puede_listar_comprobantes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson(
            '/api/admin/comprobantes'
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'No tienes permiso para realizar esta acción.'
            );
    }

    public function test_caja_no_puede_verificar_comprobantes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->autenticarComo('caja');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/admin/comprobantes/{$pedidoId}/verificar",
            [
                'estado' => 'verificado',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'No tienes permiso para realizar esta acción.'
            );
    }

    public function test_admin_puede_listar_comprobantes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson(
            '/api/admin/comprobantes'
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertOk();
    }
}