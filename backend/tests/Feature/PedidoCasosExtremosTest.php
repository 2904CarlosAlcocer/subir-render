<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PedidoCasosExtremosTest extends TestCase
{
    use RefreshDatabase;

    private string $rutaMetadata;
    private bool $metadataExistia;
    private ?string $respaldoMetadata = null;

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * Evita que las pruebas intenten enviar notificaciones externas.
         */
        config()->set('services.ntfy.enabled', false);

        /*
         * Estas pruebas validan pedidos y no el horario comercial.
         * Se fija una hora abierta para que no dependan de la hora real.
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

        /*
        |--------------------------------------------------------------------------
        | PROTEGER EL ARCHIVO REAL DE METADATA
        |--------------------------------------------------------------------------
        |
        | El controlador guarda el método de pago y los comprobantes en un
        | archivo JSON. Durante las pruebas trabajamos con un archivo vacío
        | y al finalizar restauramos el contenido original.
        |
        */

        $this->rutaMetadata = storage_path(
            'app/pedidos_metadata.json'
        );

        $this->metadataExistia = file_exists(
            $this->rutaMetadata
        );

        if ($this->metadataExistia) {
            $contenido = file_get_contents(
                $this->rutaMetadata
            );

            $this->respaldoMetadata = $contenido !== false
                ? $contenido
                : '[]';
        }

        if (!is_dir(dirname($this->rutaMetadata))) {
            mkdir(
                dirname($this->rutaMetadata),
                0755,
                true
            );
        }

        file_put_contents(
            $this->rutaMetadata,
            '[]'
        );
    }

    protected function tearDown(): void
    {
        /*
         * Elimina la fecha simulada para no afectar otras pruebas.
         */
        Carbon::setTestNow();

        /*
        |--------------------------------------------------------------------------
        | RESTAURAR EL ARCHIVO ORIGINAL
        |--------------------------------------------------------------------------
        */

        if ($this->metadataExistia) {
            file_put_contents(
                $this->rutaMetadata,
                $this->respaldoMetadata ?? '[]'
            );
        } elseif (file_exists($this->rutaMetadata)) {
            unlink($this->rutaMetadata);
        }

        parent::tearDown();
    }

    /*
    |--------------------------------------------------------------------------
    | MÉTODOS AUXILIARES
    |--------------------------------------------------------------------------
    */

    private function crearCategoria(
        array $datos = []
    ): int {
        return DB::table('categorias')->insertGetId(
            array_merge([
                'nombre' => 'Pizzas',
                'descripcion' => 'Categoría para pruebas',
                'estado' => 'activa',
                'created_at' => now(),
                'updated_at' => now(),
            ], $datos)
        );
    }

    private function crearCliente(
        array $datos = []
    ): int {
        return DB::table('clientes')->insertGetId(
            array_merge([
                'nombre' => 'Cliente de pruebas',
                'telefono' => '88888888',
                'correo' => 'cliente@example.com',
                'fecha_registro' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ], $datos)
        );
    }

    private function crearProducto(
        int $categoriaId,
        array $datos = []
    ): int {
        return DB::table('productos')->insertGetId(
            array_merge([
                'categoria_id' => $categoriaId,
                'nombre' => 'Pizza de prueba',
                'descripcion' => 'Producto para pruebas',
                'precio' => 5000,
                'imagen' => null,
                'estado' => 'disponible',
                'created_at' => now(),
                'updated_at' => now(),
            ], $datos)
        );
    }

    private function crearIngrediente(
        string $nombre,
        float $precioExtra = 1500,
        string $estado = 'disponible'
    ): int {
        return DB::table('ingredientes')->insertGetId([
            'nombre' => $nombre,
            'precio_extra' => $precioExtra,
            'estado' => $estado,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function datosPedido(
        int $clienteId,
        array $productos
    ): array {
        return [
            'cliente_id' => $clienteId,
            'modalidad_entrega' => 'retiro',
            'metodo_pago' => 'efectivo',
            'productos' => json_encode($productos),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 1
    |--------------------------------------------------------------------------
    */

    public function test_rechaza_productos_con_json_invalido(): void
    {
        $clienteId = $this->crearCliente();

        $response = $this->postJson('/api/pedidos', [
            'cliente_id' => $clienteId,
            'modalidad_entrega' => 'retiro',
            'metodo_pago' => 'efectivo',
            'productos' => 'esto no es un json',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 2
    |--------------------------------------------------------------------------
    */

    public function test_no_permite_crear_un_pedido_sin_productos(): void
    {
        $clienteId = $this->crearCliente();

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                []
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 3
    |--------------------------------------------------------------------------
    */

    public function test_no_permite_un_producto_inexistente(): void
    {
        $clienteId = $this->crearCliente();

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => 999999,
                        'cantidad' => 1,
                    ],
                ]
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos.0.producto_id',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );

        $this->assertMetadataVacia();
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 4
    |--------------------------------------------------------------------------
    */

    public function test_no_permite_comprar_un_producto_no_disponible(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $productoId = $this->crearProducto(
            $categoriaId,
            [
                'nombre' => 'Pizza agotada',
                'estado' => 'no_disponible',
            ]
        );

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $productoId,
                        'cantidad' => 1,
                    ],
                ]
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos.0.producto_id',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 5
    |--------------------------------------------------------------------------
    */

    public function test_no_permite_una_cantidad_igual_a_cero(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $productoId = $this->crearProducto(
            $categoriaId
        );

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $productoId,
                        'cantidad' => 0,
                    ],
                ]
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos.0.cantidad',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 6
    |--------------------------------------------------------------------------
    */

    public function test_no_permite_una_cantidad_negativa(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $productoId = $this->crearProducto(
            $categoriaId
        );

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $productoId,
                        'cantidad' => -2,
                    ],
                ]
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos.0.cantidad',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 7
    |--------------------------------------------------------------------------
    */

    public function test_no_permite_una_cantidad_no_numerica(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $productoId = $this->crearProducto(
            $categoriaId
        );

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $productoId,
                        'cantidad' => 'dos',
                    ],
                ]
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'productos.0.cantidad',
            ]);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount(
            'detalle_pedidos',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 8
    |--------------------------------------------------------------------------
    */

    public function test_ignora_el_precio_enviado_por_el_cliente(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $productoId = $this->crearProducto(
            $categoriaId,
            [
                'nombre' => 'Pizza Especial',
                'precio' => 4200,
            ]
        );

        /*
         * El cliente intenta cambiar el precio a ₡1.
         * El backend debe ignorarlo y utilizar ₡4.200.
         */

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $productoId,
                        'cantidad' => 2,
                        'precio' => 1,
                        'precio_unitario' => 1,
                        'subtotal' => 2,
                    ],
                ]
            )
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Pedido creado correctamente'
            );

        $pedidoId = $response->json('pedido.id');

        $this->assertEquals(
            8400,
            (float) $response->json(
                'pedido.total'
            )
        );

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'total' => '8400.00',
        ]);

        $this->assertDatabaseHas(
            'detalle_pedidos',
            [
                'pedido_id' => $pedidoId,
                'producto_id' => $productoId,
                'cantidad' => 2,
                'precio_unitario' => '4200.00',
                'subtotal' => '8400.00',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 9
    |--------------------------------------------------------------------------
    */

    public function test_calcula_el_total_de_varios_productos_con_extras(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $pizzaId = $this->crearProducto(
            $categoriaId,
            [
                'nombre' => 'Pizza Suprema',
                'precio' => 5000,
            ]
        );

        $bebidaId = $this->crearProducto(
            $categoriaId,
            [
                'nombre' => 'Bebida natural',
                'precio' => 3500,
            ]
        );

        $quesoExtraId = $this->crearIngrediente(
            'Queso extra'
        );

        $tocinetaId = $this->crearIngrediente(
            'Tocineta'
        );

        /*
         * Primer producto:
         *
         * Precio base:              ₡5.000
         * Dos extras:               ₡3.000
         * Precio unitario:          ₡8.000
         * Cantidad:                       2
         * Subtotal:                ₡16.000
         *
         * Segundo producto:
         *
         * Precio unitario:          ₡3.500
         * Cantidad:                       3
         * Subtotal:                ₡10.500
         *
         * Total esperado:          ₡26.500
         */

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $pizzaId,
                        'cantidad' => 2,
                        'extras_ids' => [
                            $quesoExtraId,
                            $tocinetaId,
                        ],
                    ],
                    [
                        'producto_id' => $bebidaId,
                        'cantidad' => 3,
                    ],
                ]
            )
        );

        $response
            ->assertCreated()
            ->assertJsonCount(
                2,
                'pedido.detalles'
            );

        $pedidoId = $response->json('pedido.id');

        $this->assertEquals(
            26500,
            (float) $response->json(
                'pedido.total'
            )
        );

        $this->assertDatabaseHas(
            'detalle_pedidos',
            [
                'pedido_id' => $pedidoId,
                'producto_id' => $pizzaId,
                'cantidad' => 2,
                'precio_unitario' => '8000.00',
                'subtotal' => '16000.00',
            ]
        );

        $this->assertDatabaseHas(
            'detalle_pedidos',
            [
                'pedido_id' => $pedidoId,
                'producto_id' => $bebidaId,
                'cantidad' => 3,
                'precio_unitario' => '3500.00',
                'subtotal' => '10500.00',
            ]
        );

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedidoId,
            'total' => '26500.00',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 10
    |--------------------------------------------------------------------------
    */

    public function test_no_cobra_extras_cuando_el_texto_solo_contiene_comas_y_espacios(): void
    {
        $categoriaId = $this->crearCategoria();
        $clienteId = $this->crearCliente();

        $productoId = $this->crearProducto(
            $categoriaId,
            [
                'nombre' => 'Pizza sin extras reales',
                'precio' => 5000,
            ]
        );

        $response = $this->postJson(
            '/api/pedidos',
            $this->datosPedido(
                $clienteId,
                [
                    [
                        'producto_id' => $productoId,
                        'cantidad' => 2,
                        'extras' => ' ,  , ',
                    ],
                ]
            )
        );

        $response->assertCreated();

        $pedidoId = $response->json('pedido.id');

        /*
         * Las comas vacías no representan extras.
         * El total debe continuar siendo 5000 × 2.
         */

        $this->assertEquals(
            10000,
            (float) $response->json(
                'pedido.total'
            )
        );

        $this->assertDatabaseHas(
            'detalle_pedidos',
            [
                'pedido_id' => $pedidoId,
                'producto_id' => $productoId,
                'cantidad' => 2,
                'precio_unitario' => '5000.00',
                'subtotal' => '10000.00',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AUXILIAR PARA METADATA
    |--------------------------------------------------------------------------
    */

    private function assertMetadataVacia(): void
    {
        $contenido = file_get_contents(
            $this->rutaMetadata
        );

        $metadata = json_decode(
            $contenido ?: '[]',
            true
        );

        $this->assertSame(
            [],
            $metadata,
            'La metadata debía permanecer vacía.'
        );
    }
}