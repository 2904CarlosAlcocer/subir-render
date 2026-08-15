<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SeguridadMiddlewareRolesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        /*
        |--------------------------------------------------------------------------
        | RUTAS TEMPORALES PARA PROBAR EL MIDDLEWARE
        |--------------------------------------------------------------------------
        |
        | Estas rutas solamente existen durante las pruebas.
        | Permiten comprobar directamente el funcionamiento de:
        |
        | - es.admin
        | - rol:admin,cocina,caja
        |
        | No modifican routes/api.php.
        |
        */

        Route::middleware([
            'auth:sanctum',
            'es.admin',
        ])->get(
            '/api/testing/solo-administrador',
            function () {
                return response()->json([
                    'message' => 'Acceso administrativo autorizado.',
                ]);
            }
        );

        Route::middleware([
            'auth:sanctum',
            'rol:admin,cocina,caja',
        ])->get(
            '/api/testing/solo-personal',
            function () {
                return response()->json([
                    'message' => 'Acceso del personal autorizado.',
                ]);
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MÉTODO AUXILIAR
    |--------------------------------------------------------------------------
    */

    private function crearUsuario(
        string $rol,
        string $estado = 'activo',
        ?string $email = null
    ): User {
        return User::query()->create([
            'name' => 'Usuario de prueba',
            'email' => $email
                ?? strtolower($rol)
                    . uniqid()
                    . '@rooster.test',
            'password' => Hash::make('Password123!'),
            'rol' => $rol,
            'estado' => $estado,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 1
    |--------------------------------------------------------------------------
    */

    public function test_usuario_no_autenticado_no_puede_consultar_usuarios(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertUnauthorized();
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 2
    |--------------------------------------------------------------------------
    */

    public function test_cliente_no_puede_acceder_a_la_administracion_de_usuarios(): void
    {
        $cliente = $this->crearUsuario(
            'cliente',
            'activo',
            'cliente@rooster.test'
        );

        Sanctum::actingAs($cliente);

        $response = $this->getJson('/api/users');

        $response
            ->assertForbidden()
            ->assertJson([
                'message' => 'No tienes permiso para realizar esta acción.',
                'rol' => 'cliente',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 3
    |--------------------------------------------------------------------------
    */

    public function test_usuario_de_cocina_no_puede_listar_comprobantes_administrativos(): void
    {
        $cocina = $this->crearUsuario(
            'cocina',
            'activo',
            'cocina@rooster.test'
        );

        Sanctum::actingAs($cocina);

        $response = $this->getJson(
            '/api/admin/comprobantes'
        );

        $response
            ->assertForbidden()
            ->assertJson([
                'message' => 'No tienes permiso para realizar esta acción.',
                'rol' => 'cocina',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 4
    |--------------------------------------------------------------------------
    */

    public function test_usuario_de_caja_no_puede_crear_productos(): void
    {
        $caja = $this->crearUsuario(
            'caja',
            'activo',
            'caja@rooster.test'
        );

        Sanctum::actingAs($caja);

        /*
         * No es necesario enviar datos del producto.
         *
         * El middleware debe impedir el acceso antes de que
         * el controlador ejecute sus validaciones.
         */

        $response = $this->postJson(
            '/api/productos',
            []
        );

        $response
            ->assertForbidden()
            ->assertJson([
                'message' => 'No tienes permiso para realizar esta acción.',
                'rol' => 'caja',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 5
    |--------------------------------------------------------------------------
    */

    public function test_alias_administrador_es_aceptado_y_normalizado_a_admin(): void
    {
        $administrador = $this->crearUsuario(
            'Administrador',
            'activo',
            'administrador@rooster.test'
        );

        Sanctum::actingAs($administrador);

        $response = $this->getJson(
            '/api/testing/solo-administrador'
        );

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Acceso administrativo autorizado.',
            ]);

        /*
         * El middleware debe corregir el nombre del rol
         * y guardarlo en la base de datos.
         */

        $this->assertDatabaseHas('users', [
            'id' => $administrador->id,
            'rol' => 'admin',
        ]);

        $this->assertSame(
            'admin',
            $administrador->fresh()->rol
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 6
    |--------------------------------------------------------------------------
    */

    public function test_alias_chef_es_aceptado_y_normalizado_a_cocina(): void
    {
        $chef = $this->crearUsuario(
            'Chef',
            'activo',
            'chef@rooster.test'
        );

        Sanctum::actingAs($chef);

        $response = $this->getJson(
            '/api/testing/solo-personal'
        );

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Acceso del personal autorizado.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $chef->id,
            'rol' => 'cocina',
        ]);

        $this->assertSame(
            'cocina',
            $chef->fresh()->rol
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 7
    |--------------------------------------------------------------------------
    */

    public function test_rol_desconocido_no_puede_acceder_a_rutas_del_personal(): void
    {
        $usuario = $this->crearUsuario(
            'visitante',
            'activo',
            'visitante@rooster.test'
        );

        Sanctum::actingAs($usuario);

        $response = $this->getJson(
            '/api/testing/solo-personal'
        );

        $response
            ->assertForbidden()
            ->assertJson([
                'message' => 'No tienes permiso para realizar esta acción.',
                'rol' => 'visitante',
            ]);

        /*
         * Los roles desconocidos no deben transformarse
         * en un rol autorizado.
         */

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'rol' => 'visitante',
        ]);
    }
}