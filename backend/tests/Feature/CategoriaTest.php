<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoriaTest extends TestCase
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
            'email' => "{$rol}@categorias.test",
            'rol' => $rol,
            'estado' => 'activo',
        ]);

        Sanctum::actingAs($usuario, ['*']);
    }

    /**
     * Crea una categoría para las pruebas.
     */
    private function crearCategoria(
        string $nombre = 'Pizzas',
        string $estado = 'activa',
        ?string $descripcion = 'Categoría de prueba'
    ): Categoria {
        return Categoria::create([
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
        ]);
    }

    public function test_publico_puede_listar_categorias_ordenadas_por_nombre(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearCategoria(
            'Pizzas',
            'activa'
        );

        $this->crearCategoria(
            'Bebidas',
            'inactiva'
        );

        $this->crearCategoria(
            'Hamburguesas',
            'activa'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/categorias');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonPath(
                '0.nombre',
                'Bebidas'
            )
            ->assertJsonPath(
                '0.estado',
                'inactiva'
            )
            ->assertJsonPath(
                '1.nombre',
                'Hamburguesas'
            )
            ->assertJsonPath(
                '2.nombre',
                'Pizzas'
            );
    }

    public function test_admin_puede_crear_categoria(): void
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

        $response = $this->postJson('/api/categorias', [
            'nombre' => 'Postres',
            'descripcion' => 'Postres del restaurante',
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
                'Categoría creada correctamente'
            )
            ->assertJsonPath(
                'categoria.nombre',
                'Postres'
            )
            ->assertJsonPath(
                'categoria.descripcion',
                'Postres del restaurante'
            )
            ->assertJsonPath(
                'categoria.estado',
                'activa'
            )
            ->assertJsonStructure([
                'message',
                'categoria' => [
                    'id',
                    'nombre',
                    'descripcion',
                    'estado',
                    'created_at',
                    'updated_at',
                ],
            ]);

        $this->assertDatabaseHas('categorias', [
            'nombre' => 'Postres',
            'descripcion' => 'Postres del restaurante',
            'estado' => 'activa',
        ]);
    }

    public function test_no_permite_crear_categoria_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/categorias', [
            'nombre' => 'Postres',
            'descripcion' => 'Categoría no autorizada',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseMissing('categorias', [
            'nombre' => 'Postres',
        ]);
    }

    public function test_usuario_no_admin_no_puede_crear_categoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->autenticarComo('caja');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/categorias', [
            'nombre' => 'Postres',
            'descripcion' => 'Categoría prohibida',
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

        $this->assertDatabaseMissing('categorias', [
            'nombre' => 'Postres',
        ]);
    }

    public function test_nombre_es_obligatorio_al_crear_categoria(): void
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

        $response = $this->postJson('/api/categorias', [
            'descripcion' => 'Categoría sin nombre',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'nombre',
            ]);
    }

    public function test_admin_puede_actualizar_categoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria(
            'Nombre anterior',
            'activa',
            'Descripción anterior'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/categorias/{$categoria->id}",
            [
                'nombre' => 'Nombre actualizado',
                'descripcion' => 'Descripción actualizada',
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
                'Categoría actualizada correctamente'
            )
            ->assertJsonPath(
                'categoria.id',
                $categoria->id
            )
            ->assertJsonPath(
                'categoria.nombre',
                'Nombre actualizado'
            )
            ->assertJsonPath(
                'categoria.descripcion',
                'Descripción actualizada'
            )
            ->assertJsonPath(
                'categoria.estado',
                'activa'
            );

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'nombre' => 'Nombre actualizado',
            'descripcion' => 'Descripción actualizada',
            'estado' => 'activa',
        ]);
    }

    public function test_nombre_es_obligatorio_al_actualizar_categoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria(
            'Categoría original'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/categorias/{$categoria->id}",
            [
                'descripcion' => 'Sin nombre',
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
                'nombre',
            ]);

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'nombre' => 'Categoría original',
        ]);
    }

    public function test_no_permite_actualizar_categoria_sin_autenticacion(): void
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

        $response = $this->putJson(
            "/api/categorias/{$categoria->id}",
            [
                'nombre' => 'Cambio no autorizado',
                'descripcion' => null,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'nombre' => 'Pizzas',
        ]);
    }

    public function test_usuario_no_admin_no_puede_actualizar_categoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria();

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/categorias/{$categoria->id}",
            [
                'nombre' => 'Cambio prohibido',
                'descripcion' => null,
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

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'nombre' => 'Pizzas',
        ]);
    }

    public function test_admin_puede_desactivar_y_reactivar_categoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria(
            'Categoría alternable',
            'activa'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT Y ASSERT: ACTIVA A INACTIVA
        |--------------------------------------------------------------------------
        */

        $responseInactiva = $this->patchJson(
            "/api/categorias/{$categoria->id}/toggle-estado"
        );

        $responseInactiva
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Estado actualizado'
            )
            ->assertJsonPath(
                'categoria.estado',
                'inactiva'
            );

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'estado' => 'inactiva',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ACT Y ASSERT: INACTIVA A ACTIVA
        |--------------------------------------------------------------------------
        */

        $responseActiva = $this->patchJson(
            "/api/categorias/{$categoria->id}/toggle-estado"
        );

        $responseActiva
            ->assertOk()
            ->assertJsonPath(
                'categoria.estado',
                'activa'
            );

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'estado' => 'activa',
        ]);
    }

    public function test_usuario_no_admin_no_puede_cambiar_estado_de_categoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $categoria = $this->crearCategoria(
            'Categoría protegida',
            'activa'
        );

        $this->autenticarComo('cliente');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/categorias/{$categoria->id}/toggle-estado"
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

        $this->assertDatabaseHas('categorias', [
            'id' => $categoria->id,
            'estado' => 'activa',
        ]);
    }

    public function test_devuelve_404_al_modificar_categoria_inexistente(): void
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

        $response = $this->putJson(
            '/api/categorias/99999',
            [
                'nombre' => 'Categoría inexistente',
                'descripcion' => null,
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