<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Ingrediente;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductoTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Autentica un usuario de prueba con el rol indicado.
     */
    private function autenticarComo(string $rol): void
    {
        $usuario = new User();

        $usuario->forceFill([
            'id' => 999,
            'name' => 'Usuario autenticado',
            'email' => "{$rol}@productos.test",
            'rol' => $rol,
            'estado' => 'activo',
        ]);

        Sanctum::actingAs($usuario, ['*']);
    }

    /**
     * Crea una imagen PNG válida sin depender de la extensión GD.
     */
    private function crearImagenFalsa(
        string $nombre = 'producto.png'
    ): UploadedFile {
        $contenido = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6nAAAAABJRU5ErkJggg=='
        );

        return UploadedFile::fake()->createWithContent(
            $nombre,
            $contenido
        );
    }

    /**
     * Crea una categoría para las pruebas.
     */
    private function crearCategoria(
        string $nombre = 'Pizzas',
        string $estado = 'activa'
    ): Categoria {
        return Categoria::create([
            'nombre' => $nombre,
            'descripcion' => "Categoría {$nombre}",
            'estado' => $estado,
        ]);
    }

    /**
     * Crea un ingrediente para las pruebas.
     */
    private function crearIngrediente(
        string $nombre = 'Queso',
        string $estado = 'disponible'
    ): Ingrediente {
        return Ingrediente::create([
            'nombre' => $nombre,
            'estado' => $estado,
        ]);
    }

    /**
     * Crea un producto para las pruebas.
     */
    private function crearProducto(
        Categoria $categoria,
        string $nombre = 'Pizza Suprema',
        string $estado = 'disponible',
        float $precio = 8500
    ): Producto {
        return Producto::create([
            'categoria_id' => $categoria->id,
            'nombre' => $nombre,
            'descripcion' => "Descripción de {$nombre}",
            'precio' => $precio,
            'imagen' => null,
            'estado' => $estado,
        ]);
    }

    public function test_publico_lista_solo_productos_disponibles_con_sus_datos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria('Pizzas');

        $queso = $this->crearIngrediente(
            'Queso mozzarella',
            'disponible'
        );

        $ingredienteAgotado = $this->crearIngrediente(
            'Ingrediente agotado',
            'agotado'
        );

        $productoDisponible = $this->crearProducto(
            $categoria,
            'Pizza disponible',
            'disponible'
        );

        $productoDisponible->ingredientes()->attach($queso->id);

        $this->crearProducto(
            $categoria,
            'Pizza agotada',
            'agotado'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/productos');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath(
                '0.nombre',
                'Pizza disponible'
            )
            ->assertJsonPath(
                '0.estado',
                'disponible'
            )
            ->assertJsonPath(
                '0.categoria.nombre',
                'Pizzas'
            )
            ->assertJsonPath(
                '0.ingredientes.0.nombre',
                'Queso mozzarella'
            )
            ->assertJsonPath(
                '0.ingredientes_base.0.nombre',
                'Queso mozzarella'
            )
            ->assertJsonPath(
                '0.es_pizza',
                true
            )
            ->assertJsonPath(
                '0.imagen_url',
                null
            )
            ->assertJsonCount(
                1,
                '0.extras_disponibles'
            )
            ->assertJsonPath(
                '0.extras_disponibles.0.nombre',
                'Queso mozzarella'
            )
            ->assertJsonPath(
                '0.extras_disponibles.0.precio_extra',
                1500
            )
            ->assertJsonMissing([
                'nombre' => 'Pizza agotada',
            ])
            ->assertJsonMissing([
                'nombre' => $ingredienteAgotado->nombre,
            ]);
    }

    public function test_no_permite_listar_productos_admin_sin_autenticacion(): void
    {
        $response = $this->getJson('/api/admin/productos');

        $response->assertUnauthorized();
    }

    public function test_usuario_no_admin_no_puede_listar_productos_admin(): void
    {
        $this->autenticarComo('cocina');

        $response = $this->getJson('/api/admin/productos');

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'No tienes permiso para realizar esta acción.'
            );
    }

    public function test_admin_puede_listar_productos_disponibles_y_agotados(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();

        $this->crearProducto(
            $categoria,
            'Pizza disponible',
            'disponible'
        );

        $this->crearProducto(
            $categoria,
            'Pizza agotada',
            'agotado'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/admin/productos');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment([
                'nombre' => 'Pizza disponible',
                'estado' => 'disponible',
            ])
            ->assertJsonFragment([
                'nombre' => 'Pizza agotada',
                'estado' => 'agotado',
            ]);
    }

    public function test_admin_puede_crear_un_producto(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria('Hamburguesas');

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/productos', [
            'categoria_id' => $categoria->id,
            'nombre' => 'Hamburguesa especial',
            'descripcion' => 'Hamburguesa con papas',
            'precio' => 6500,
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Producto creado correctamente'
            )
            ->assertJsonPath(
                'producto.nombre',
                'Hamburguesa especial'
            )
            ->assertJsonPath(
                'producto.descripcion',
                'Hamburguesa con papas'
            )
            ->assertJsonPath(
                'producto.estado',
                'disponible'
            )
            ->assertJsonPath(
                'producto.categoria.nombre',
                'Hamburguesas'
            )
            ->assertJsonPath(
                'producto.es_pizza',
                false
            )
            ->assertJsonPath(
                'producto.imagen_url',
                null
            )
            ->assertJsonStructure([
                'message',
                'producto' => [
                    'id',
                    'categoria_id',
                    'nombre',
                    'descripcion',
                    'precio',
                    'imagen',
                    'estado',
                    'categoria',
                    'ingredientes',
                    'ingredientes_base',
                    'es_pizza',
                    'imagen_url',
                ],
            ]);

        $this->assertDatabaseHas('productos', [
            'categoria_id' => $categoria->id,
            'nombre' => 'Hamburguesa especial',
            'descripcion' => 'Hamburguesa con papas',
            'estado' => 'disponible',
        ]);
    }

    public function test_admin_puede_crear_producto_con_imagen_e_ingredientes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Storage::fake('public');

        $categoria = $this->crearCategoria();

        $queso = $this->crearIngrediente('Queso');
        $jamon = $this->crearIngrediente('Jamón');

        $imagen = $this->crearImagenFalsa(
            'pizza.png'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->post(
            '/api/productos',
            [
                'categoria_id' => $categoria->id,
                'nombre' => 'Pizza con ingredientes',
                'descripcion' => 'Pizza de prueba',
                'precio' => 9000,
                'imagen' => $imagen,
                'ingredientes' => [
                    $queso->id,
                    $jamon->id,
                ],
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
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Producto creado correctamente'
            )
            ->assertJsonPath(
                'producto.nombre',
                'Pizza con ingredientes'
            )
            ->assertJsonCount(
                2,
                'producto.ingredientes'
            )
            ->assertJsonPath(
                'producto.es_pizza',
                true
            );

        $producto = Producto::where(
            'nombre',
            'Pizza con ingredientes'
        )->firstOrFail();

        $this->assertNotNull($producto->imagen);

        Storage::disk('public')->assertExists(
            $producto->imagen
        );

        $this->assertDatabaseHas('producto_ingredientes', [
            'producto_id' => $producto->id,
            'ingrediente_id' => $queso->id,
        ]);

        $this->assertDatabaseHas('producto_ingredientes', [
            'producto_id' => $producto->id,
            'ingrediente_id' => $jamon->id,
        ]);
    }

    public function test_no_permite_crear_producto_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/productos', [
            'categoria_id' => $categoria->id,
            'nombre' => 'Producto no autorizado',
            'precio' => 5000,
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseMissing('productos', [
            'nombre' => 'Producto no autorizado',
        ]);
    }

    public function test_usuario_no_admin_no_puede_crear_productos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();

        $this->autenticarComo('caja');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/productos', [
            'categoria_id' => $categoria->id,
            'nombre' => 'Producto prohibido',
            'precio' => 5000,
        ]);

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

        $this->assertDatabaseMissing('productos', [
            'nombre' => 'Producto prohibido',
        ]);
    }

    public function test_valida_campos_obligatorios_al_crear_producto(): void
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

        $response = $this->postJson('/api/productos', []);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'categoria_id',
                'nombre',
                'precio',
            ]);
    }

    public function test_rechaza_categoria_ingrediente_y_precio_invalidos(): void
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

        $response = $this->postJson('/api/productos', [
            'categoria_id' => 99999,
            'nombre' => 'Producto inválido',
            'precio' => -100,
            'ingredientes' => [
                99999,
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'categoria_id',
                'precio',
                'ingredientes.0',
            ]);

        $this->assertDatabaseMissing('productos', [
            'nombre' => 'Producto inválido',
        ]);
    }

    public function test_rechaza_archivo_que_no_es_imagen(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Storage::fake('public');

        $categoria = $this->crearCategoria();

        $archivo = UploadedFile::fake()->create(
            'documento.pdf',
            100,
            'application/pdf'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->post(
            '/api/productos',
            [
                'categoria_id' => $categoria->id,
                'nombre' => 'Producto con archivo inválido',
                'precio' => 5000,
                'imagen' => $archivo,
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
                'imagen',
            ]);

        $this->assertDatabaseMissing('productos', [
            'nombre' => 'Producto con archivo inválido',
        ]);
    }

    public function test_admin_puede_actualizar_producto_y_sincronizar_ingredientes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoriaOriginal = $this->crearCategoria(
            'Pizzas'
        );

        $categoriaNueva = $this->crearCategoria(
            'Combos'
        );

        $ingredienteAnterior = $this->crearIngrediente(
            'Ingrediente anterior'
        );

        $ingredienteNuevo = $this->crearIngrediente(
            'Ingrediente nuevo'
        );

        $producto = $this->crearProducto(
            $categoriaOriginal,
            'Producto original'
        );

        $producto->ingredientes()->attach(
            $ingredienteAnterior->id
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            "/api/productos/{$producto->id}",
            [
                'categoria_id' => $categoriaNueva->id,
                'nombre' => 'Producto actualizado',
                'descripcion' => 'Descripción actualizada',
                'precio' => 10500,
                'ingredientes' => [
                    $ingredienteNuevo->id,
                ],
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
                'Producto actualizado correctamente'
            )
            ->assertJsonPath(
                'producto.id',
                $producto->id
            )
            ->assertJsonPath(
                'producto.nombre',
                'Producto actualizado'
            )
            ->assertJsonPath(
                'producto.categoria.nombre',
                'Combos'
            )
            ->assertJsonCount(
                1,
                'producto.ingredientes'
            )
            ->assertJsonPath(
                'producto.ingredientes.0.id',
                $ingredienteNuevo->id
            );

        $this->assertDatabaseHas('productos', [
            'id' => $producto->id,
            'categoria_id' => $categoriaNueva->id,
            'nombre' => 'Producto actualizado',
            'descripcion' => 'Descripción actualizada',
        ]);

        $this->assertDatabaseHas('producto_ingredientes', [
            'producto_id' => $producto->id,
            'ingrediente_id' => $ingredienteNuevo->id,
        ]);

        $this->assertDatabaseMissing('producto_ingredientes', [
            'producto_id' => $producto->id,
            'ingrediente_id' => $ingredienteAnterior->id,
        ]);
    }

    public function test_valida_campos_obligatorios_al_actualizar_producto(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();
        $producto = $this->crearProducto($categoria);

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            "/api/productos/{$producto->id}",
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
                'categoria_id',
                'nombre',
                'precio',
            ]);

        $this->assertDatabaseHas('productos', [
            'id' => $producto->id,
            'nombre' => 'Pizza Suprema',
            'estado' => 'disponible',
        ]);
    }

    public function test_admin_puede_reemplazar_imagen_del_producto(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Storage::fake('public');

        $categoria = $this->crearCategoria();

        Storage::disk('public')->put(
            'productos/imagen-anterior.jpg',
            'imagen anterior'
        );

        $producto = Producto::create([
            'categoria_id' => $categoria->id,
            'nombre' => 'Producto con imagen',
            'descripcion' => 'Producto para actualizar',
            'precio' => 7000,
            'imagen' => 'productos/imagen-anterior.jpg',
            'estado' => 'disponible',
        ]);

        $imagenNueva = $this->crearImagenFalsa(
            'imagen-nueva.png'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->post(
            "/api/productos/{$producto->id}",
            [
                'categoria_id' => $categoria->id,
                'nombre' => 'Producto con imagen nueva',
                'descripcion' => 'Imagen actualizada',
                'precio' => 7500,
                'imagen' => $imagenNueva,
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
                'Producto actualizado correctamente'
            )
            ->assertJsonPath(
                'producto.nombre',
                'Producto con imagen nueva'
            );

        $producto->refresh();

        $this->assertNotNull($producto->imagen);
        $this->assertNotSame(
            'productos/imagen-anterior.jpg',
            $producto->imagen
        );

        Storage::disk('public')->assertMissing(
            'productos/imagen-anterior.jpg'
        );

        Storage::disk('public')->assertExists(
            $producto->imagen
        );
    }

    public function test_admin_puede_cambiar_producto_de_disponible_a_agotado_y_de_regreso(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();

        $producto = $this->crearProducto(
            $categoria,
            'Producto para alternar',
            'disponible'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT Y ASSERT: DISPONIBLE A AGOTADO
        |--------------------------------------------------------------------------
        */

        $responseAgotado = $this->patchJson(
            "/api/productos/{$producto->id}/toggle-estado"
        );

        $responseAgotado
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Estado actualizado'
            )
            ->assertJsonPath(
                'producto.estado',
                'agotado'
            );

        $this->assertDatabaseHas('productos', [
            'id' => $producto->id,
            'estado' => 'agotado',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ACT Y ASSERT: AGOTADO A DISPONIBLE
        |--------------------------------------------------------------------------
        */

        $responseDisponible = $this->patchJson(
            "/api/productos/{$producto->id}/toggle-estado"
        );

        $responseDisponible
            ->assertOk()
            ->assertJsonPath(
                'producto.estado',
                'disponible'
            );

        $this->assertDatabaseHas('productos', [
            'id' => $producto->id,
            'estado' => 'disponible',
        ]);
    }

    public function test_no_permite_cambiar_estado_de_producto_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();
        $producto = $this->crearProducto($categoria);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/productos/{$producto->id}/toggle-estado"
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseHas('productos', [
            'id' => $producto->id,
            'estado' => 'disponible',
        ]);
    }

    public function test_usuario_no_admin_no_puede_cambiar_estado_de_producto(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();
        $producto = $this->crearProducto($categoria);

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/productos/{$producto->id}/toggle-estado"
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

        $this->assertDatabaseHas('productos', [
            'id' => $producto->id,
            'estado' => 'disponible',
        ]);
    }

    public function test_devuelve_404_al_actualizar_producto_inexistente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/productos/99999',
            [
                'categoria_id' => $categoria->id,
                'nombre' => 'Producto inexistente',
                'precio' => 5000,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertNotFound();
    }
}