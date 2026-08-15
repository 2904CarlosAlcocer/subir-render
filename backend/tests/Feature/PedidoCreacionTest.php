<?php

namespace Tests\Feature;

use App\Models\Ingrediente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PedidoCreacionTest extends TestCase
{
    use RefreshDatabase;

    private const MENSAJE_PIZZERIA_CERRADA =
        'La pizzería está cerrada. Nuestro horario para realizar pedidos es de 12:00 p. m. a 10:00 p. m.';

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * Evita que las pruebas intenten enviar notificaciones externas.
         */
        config()->set('services.ntfy.enabled', false);

        /*
         * Se establece una hora abierta por defecto para que las pruebas
         * existentes no dependan de la hora real en que se ejecuten.
         */
        Carbon::setTestNow(
            Carbon::create(
                2026,
                7,
                23,
                15,
                0,
                0,
                'America/Costa_Rica'
            )
        );

    }

    protected function tearDown(): void
    {
        /*
         * Elimina la fecha simulada para no afectar otras pruebas.
         */
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_puede_crear_un_pedido_y_calcular_correctamente_los_extras(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        | Preparar los datos necesarios para realizar el pedido.
        */

        $categoriaId = DB::table('categorias')->insertGetId([
            'nombre' => 'Pizzas',
            'descripcion' => 'Pizzas para pruebas',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $clienteId = DB::table('clientes')->insertGetId([
            'nombre' => 'Cliente de prueba',
            'telefono' => '88888888',
            'correo' => 'cliente@test.com',
            'fecha_registro' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productoId = DB::table('productos')->insertGetId([
            'categoria_id' => $categoriaId,
            'nombre' => 'Pizza Suprema',
            'descripcion' => 'Pizza utilizada para el test',
            'precio' => 5000,
            'imagen' => null,
            'estado' => 'disponible',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        /*
         * Los extras ahora se crean en la base de datos.
         * El backend utiliza sus identificadores y precios reales,
         * sin confiar en precios enviados por el cliente.
         */
        $quesoExtra = Ingrediente::create([
            'nombre' => 'Queso extra',
            'precio_extra' => 1500,
            'estado' => 'disponible',
        ]);

        $tocineta = Ingrediente::create([
            'nombre' => 'Tocineta',
            'precio_extra' => 1500,
            'estado' => 'disponible',
        ]);

        $productos = [
            [
                'producto_id' => $productoId,
                'cantidad' => 2,
                'extras_ids' => [
                    $quesoExtra->id,
                    $tocineta->id,
                ],
                'observaciones' => 'Sin cebolla',
            ],
        ];

        /*
         * Precio base:              ₡5.000
         * Queso extra:              ₡1.500
         * Tocineta:                 ₡1.500
         * Precio unitario final:    ₡8.000
         * Cantidad:                       2
         * Total esperado:          ₡16.000
         */

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        | Enviar la solicitud al endpoint real del sistema.
        */

        $response = $this->postJson('/api/pedidos', [
            'cliente_id' => $clienteId,
            'modalidad_entrega' => 'retiro',
            'metodo_pago' => 'efectivo',
            'productos' => json_encode($productos),
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        | Verificar la respuesta y los registros guardados.
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Pedido creado correctamente'
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

        $pedido = $response->json('pedido');

        $this->assertNotNull($pedido);

        $this->assertMatchesRegularExpression(
            '/^RC-[A-Z0-9]{6}$/',
            $pedido['codigo_tracking']
        );

        $this->assertSame(
            'pendiente',
            $pedido['estado_pedido']
        );

        $this->assertSame(
            'retiro',
            $pedido['modalidad_entrega']
        );

        $this->assertEquals(
            16000,
            (float) $pedido['total']
        );

        /*
         * Comprobar el pedido en la base de datos.
         */
        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido['id'],
            'cliente_id' => $clienteId,
            'codigo_tracking' => $pedido['codigo_tracking'],
            'modalidad_entrega' => 'retiro',
            'estado_pedido' => 'pendiente',
            'total' => '16000.00',
        ]);

        /*
         * Comprobar el detalle del pedido.
         */
        $this->assertDatabaseHas('detalle_pedidos', [
            'pedido_id' => $pedido['id'],
            'producto_id' => $productoId,
            'cantidad' => 2,
            'precio_unitario' => '8000.00',
            'subtotal' => '16000.00',
            'extras' => 'Tamaño: Grande | Extras: Queso extra, Tocineta',
            'observaciones' => 'Sin cebolla',
        ]);

        /*
         * Comprobar la información de pago guardada en MySQL.
         */
        $this->assertDatabaseHas('pagos_pedidos', [
            'pedido_id' => $pedido['id'],
            'metodo_pago' => 'efectivo',
            'estado_pago' => 'no_requiere',
        ]);

        $pago = DB::table('pagos_pedidos')
            ->where('pedido_id', $pedido['id'])
            ->first();

        $this->assertNotNull(
            $pago,
            'No se encontró el pago del pedido en la base de datos.'
        );

        $this->assertNull($pago->comprobante_binario);
        $this->assertNull($pago->fecha_comprobante);
    }

    public function test_bloquea_pedidos_a_las_11_59_de_la_noche(): void
    {
        $this->fijarHoraCostaRica(23, 59);

        $response = $this->postJson(
            '/api/pedidos',
            $this->crearDatosPedidoBasico()
        );

        $response
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                self::MENSAJE_PIZZERIA_CERRADA
            );

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount('detalle_pedidos', 0);
    }

    public function test_permite_pedidos_a_las_12_00_del_mediodia(): void
    {
        $this->fijarHoraCostaRica(12, 0);

        $response = $this->postJson(
            '/api/pedidos',
            $this->crearDatosPedidoBasico()
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Pedido creado correctamente'
            );

        $this->assertDatabaseCount('pedidos', 1);
        $this->assertDatabaseCount('detalle_pedidos', 1);
    }

    public function test_permite_pedidos_a_las_9_59_de_la_noche(): void
    {
        $this->fijarHoraCostaRica(21, 59);

        $response = $this->postJson(
            '/api/pedidos',
            $this->crearDatosPedidoBasico()
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Pedido creado correctamente'
            );

        $this->assertDatabaseCount('pedidos', 1);
        $this->assertDatabaseCount('detalle_pedidos', 1);
    }

    public function test_bloquea_pedidos_a_las_10_00_de_la_noche(): void
    {
        $this->fijarHoraCostaRica(22, 0);

        $response = $this->postJson(
            '/api/pedidos',
            $this->crearDatosPedidoBasico()
        );

        $response
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                self::MENSAJE_PIZZERIA_CERRADA
            );

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount('detalle_pedidos', 0);
    }

    public function test_el_horario_se_evalua_con_la_zona_america_costa_rica(): void
    {
        /*
         * Las 16:00 UTC corresponden a las 10:00 a. m. en Costa Rica.
         * A esa hora la pizzería debe estar cerrada.
         *
         * Si el controlador utilizara UTC directamente, interpretaría
         * las 16:00 como una hora abierta y este test fallaría.
         */
        Carbon::setTestNow(
            Carbon::create(
                2026,
                7,
                23,
                16,
                0,
                0,
                'UTC'
            )
        );

        $this->assertSame(
            'America/Costa_Rica',
            Carbon::now('America/Costa_Rica')
                ->getTimezone()
                ->getName()
        );

        $this->assertSame(
            '10:00:00',
            Carbon::now('America/Costa_Rica')
                ->format('H:i:s')
        );

        $response = $this->postJson(
            '/api/pedidos',
            $this->crearDatosPedidoBasico()
        );

        $response
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                self::MENSAJE_PIZZERIA_CERRADA
            );

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount('detalle_pedidos', 0);
    }

    private function fijarHoraCostaRica(
        int $hora,
        int $minuto
    ): void {
        Carbon::setTestNow(
            Carbon::create(
                2026,
                7,
                23,
                $hora,
                $minuto,
                0,
                'America/Costa_Rica'
            )
        );
    }

    private function crearDatosPedidoBasico(): array
    {
        $categoriaId = DB::table('categorias')->insertGetId([
            'nombre' => 'Bebidas',
            'descripcion' => 'Categoría para probar el horario',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $clienteId = DB::table('clientes')->insertGetId([
            'nombre' => 'Cliente horario',
            'telefono' => '87777777',
            'correo' => 'horario@test.com',
            'fecha_registro' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productoId = DB::table('productos')->insertGetId([
            'categoria_id' => $categoriaId,
            'nombre' => 'Bebida de prueba',
            'descripcion' => 'Producto utilizado para probar el horario',
            'precio' => 1500,
            'imagen' => null,
            'estado' => 'disponible',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productos = [
            [
                'producto_id' => $productoId,
                'cantidad' => 1,
                'extras_ids' => [],
                'observaciones' => null,
            ],
        ];

        return [
            'cliente_id' => $clienteId,
            'modalidad_entrega' => 'retiro',
            'metodo_pago' => 'efectivo',
            'productos' => json_encode($productos),
        ];
    }
}