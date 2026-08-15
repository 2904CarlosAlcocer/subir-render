<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PedidoVerificacionComprobanteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Simula un usuario autenticado con el rol indicado.
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

    private function crearPedido(): int
    {
        $clienteId = DB::table('clientes')->insertGetId([
            'nombre' => 'Cliente SINPE',
            'telefono' => '88888888',
            'correo' => 'sinpe@test.com',
            'fecha_registro' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('pedidos')->insertGetId([
            'cliente_id' => $clienteId,
            'codigo_tracking' => 'RC-VER123',
            'modalidad_entrega' => 'retiro',
            'estado_pedido' => 'pendiente',
            'total' => 12500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function crearPagoPendiente(int $pedidoId): void
    {
        $contenido = 'contenido-comprobante-prueba';

        DB::table('pagos_pedidos')->insert([
            'pedido_id' => $pedidoId,
            'metodo_pago' => 'sinpe',
            'estado_pago' => 'pendiente_verificacion',
            'comprobante_binario' => $contenido,
            'comprobante_nombre' => 'RC-VER123.pdf',
            'comprobante_mime' => 'application/pdf',
            'comprobante_tamano' => strlen($contenido),
            'fecha_comprobante' => now(),
            'fecha_verificacion' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function obtenerPagoPedido(
        int $pedidoId
    ): ?array {
        $pago = DB::table('pagos_pedidos')
            ->where('pedido_id', $pedidoId)
            ->first();

        return $pago
            ? (array) $pago
            : null;
    }

    public function test_no_permite_listar_comprobantes_sin_autenticacion(): void
    {
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

        $response->assertUnauthorized();
    }

    public function test_usuario_autenticado_puede_listar_comprobantes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->crearPagoPendiente($pedidoId);
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

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath(
                '0.pedido_id',
                $pedidoId
            )
            ->assertJsonPath(
                '0.codigo_tracking',
                'RC-VER123'
            )
            ->assertJsonPath(
                '0.cliente_nombre',
                'Cliente SINPE'
            )
            ->assertJsonPath(
                '0.metodo_pago',
                'sinpe'
            )
            ->assertJsonPath(
                '0.estado_pago',
                'pendiente_verificacion'
            )
            ->assertJsonPath(
                '0.comprobante',
                'RC-VER123.pdf'
            )
            ->assertJsonStructure([
                [
                    'pedido_id',
                    'codigo_tracking',
                    'cliente_nombre',
                    'metodo_pago',
                    'comprobante',
                    'comprobante_url',
                    'estado_pago',
                    'fecha',
                ],
            ]);
    }

    public function test_usuario_autenticado_puede_verificar_un_comprobante(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->crearPagoPendiente($pedidoId);
        $this->autenticarComo('admin');

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
            ->assertOk()
            ->assertJson([
                'message' => 'Estado actualizado correctamente',
            ]);

        $registro = $this->obtenerPagoPedido(
            $pedidoId
        );

        $this->assertNotNull($registro);

        $this->assertSame(
            'verificado',
            $registro['estado_pago']
        );

        $this->assertNotNull(
            $registro['fecha_verificacion']
        );

        /*
         * Los otros datos deben conservarse.
         */
        $this->assertSame(
            'sinpe',
            $registro['metodo_pago']
        );

        $this->assertSame(
            'RC-VER123.pdf',
            $registro['comprobante_nombre']
        );
    }

    public function test_usuario_autenticado_puede_rechazar_un_comprobante(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->crearPagoPendiente($pedidoId);
        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/admin/comprobantes/{$pedidoId}/verificar",
            [
                'estado' => 'rechazado',
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
                'Estado actualizado correctamente'
            );

        $registro = $this->obtenerPagoPedido(
            $pedidoId
        );

        $this->assertNotNull($registro);

        $this->assertSame(
            'rechazado',
            $registro['estado_pago']
        );

        $this->assertNotNull(
            $registro['fecha_verificacion']
        );
    }

    public function test_rechaza_un_estado_de_comprobante_invalido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->crearPagoPendiente($pedidoId);
        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/admin/comprobantes/{$pedidoId}/verificar",
            [
                'estado' => 'aprobado_inventado',
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
                'estado',
            ]);

        /*
         * El registro de pago debe conservar el estado anterior.
         */
        $registro = $this->obtenerPagoPedido(
            $pedidoId
        );

        $this->assertNotNull($registro);

        $this->assertSame(
            'pendiente_verificacion',
            $registro['estado_pago']
        );

        $this->assertNull(
            $registro['fecha_verificacion']
        );
    }

    public function test_no_permite_verificar_comprobante_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $this->crearPagoPendiente($pedidoId);

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

        $response->assertUnauthorized();

        $registro = $this->obtenerPagoPedido(
            $pedidoId
        );

        $this->assertNotNull($registro);

        $this->assertSame(
            'pendiente_verificacion',
            $registro['estado_pago']
        );

        $this->assertNull(
            $registro['fecha_verificacion']
        );
    }
}