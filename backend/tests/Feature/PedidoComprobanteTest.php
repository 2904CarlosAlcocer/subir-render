<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PedidoComprobanteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Crea un pedido básico para realizar las pruebas.
     */
    private function crearPedido(
        string $codigoTracking = 'RC-SIN123'
    ): int {
        return DB::table('pedidos')->insertGetId([
            'cliente_id' => null,
            'codigo_tracking' => $codigoTracking,
            'modalidad_entrega' => 'retiro',
            'estado_pedido' => 'pendiente',
            'total' => 10000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_puede_subir_un_comprobante_sinpe_valido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $pedidoId = $this->crearPedido();

        $contenidoPdf = implode(PHP_EOL, [
            '%PDF-1.4',
            '1 0 obj',
            '<< /Type /Catalog >>',
            'endobj',
            '%%EOF',
        ]);

        $archivo = UploadedFile::fake()
            ->createWithContent(
                'comprobante.pdf',
                $contenidoPdf
            )
            ->mimeType('application/pdf');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->post(
            '/api/pedidos/RC-SIN123/comprobante',
            [
                'comprobante' => $archivo,
            ],
            [
                'Accept' => 'application/json',
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
                'Comprobante subido correctamente'
            )
            ->assertJsonStructure([
                'message',
                'archivo',
            ]);

        $this->assertDatabaseHas('pagos_pedidos', [
            'pedido_id' => $pedidoId,
            'metodo_pago' => 'sinpe',
            'estado_pago' => 'pendiente_verificacion',
            'comprobante_nombre' => 'comprobante.pdf',
            'comprobante_mime' => 'application/pdf',
        ]);

        $pago = DB::table('pagos_pedidos')
            ->where('pedido_id', $pedidoId)
            ->first();

        $this->assertNotNull(
            $pago,
            'No se encontró el pago del pedido en la base de datos.'
        );

        $this->assertSame(
            $contenidoPdf,
            $pago->comprobante_binario
        );

        $this->assertSame(
            strlen($contenidoPdf),
            (int) $pago->comprobante_tamano
        );
        $this->assertNotNull($pago->fecha_comprobante);
        $this->assertNull($pago->fecha_verificacion);
    }

    public function test_devuelve_404_si_el_tracking_no_existe(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $archivo = UploadedFile::fake()->create(
            'comprobante.pdf',
            200,
            'application/pdf'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->post(
            '/api/pedidos/RC-NOEXIS/comprobante',
            [
                'comprobante' => $archivo,
            ],
            [
                'Accept' => 'application/json',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertNotFound()
            ->assertJson([
                'message' => 'Pedido no encontrado',
            ]);

        $this->assertDatabaseCount('pagos_pedidos', 0);
    }

    public function test_rechaza_un_archivo_no_permitido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearPedido('RC-INV123');

        $archivo = UploadedFile::fake()->create(
            'archivo.txt',
            50,
            'text/plain'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->post(
            '/api/pedidos/RC-INV123/comprobante',
            [
                'comprobante' => $archivo,
            ],
            [
                'Accept' => 'application/json',
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
                'comprobante',
            ]);

        $this->assertDatabaseCount('pagos_pedidos', 0);
    }

    public function test_el_comprobante_es_obligatorio(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearPedido('RC-REQ123');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/pedidos/RC-REQ123/comprobante',
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
                'comprobante',
            ]);

        $this->assertDatabaseCount('pagos_pedidos', 0);
    }
}