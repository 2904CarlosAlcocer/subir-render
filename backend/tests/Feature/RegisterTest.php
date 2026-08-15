<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Datos válidos para registrar un cliente.
     */
    private function datosRegistro(
        array $cambios = []
    ): array {
        return array_merge(
            [
                'name' => 'Cliente de prueba',
                'email' => 'cliente@test.com',
                'telefono' => '8888-8888',
                'password' => 'Clave123',
                'password_confirmation' => 'Clave123',
            ],
            $cambios
        );
    }

    public function test_cliente_puede_registrarse_correctamente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'name' => '  Cliente Nuevo  ',
                'email' => 'CLIENTE.NUEVO@TEST.COM',
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT - RESPUESTA
        |--------------------------------------------------------------------------
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Registro exitoso'
            )
            ->assertJsonPath(
                'user.name',
                'Cliente Nuevo'
            )
            ->assertJsonPath(
                'user.email',
                'cliente.nuevo@test.com'
            )
            ->assertJsonPath(
                'user.rol',
                'cliente'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            )
            ->assertJsonPath(
                'cliente.nombre',
                'Cliente Nuevo'
            )
            ->assertJsonPath(
                'cliente.telefono',
                '8888-8888'
            )
            ->assertJsonPath(
                'cliente.correo',
                'cliente.nuevo@test.com'
            )
            ->assertJsonPath(
                'redirect',
                '/'
            )
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'rol',
                    'estado',
                ],
                'cliente' => [
                    'id',
                    'user_id',
                    'nombre',
                    'telefono',
                    'correo',
                ],
                'redirect',
                'token',
            ]);

        $this->assertNotEmpty(
            $response->json('token')
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT - BASE DE DATOS
        |--------------------------------------------------------------------------
        */

        $usuario = User::where(
            'email',
            'cliente.nuevo@test.com'
        )->first();

        $this->assertNotNull($usuario);

        $this->assertSame(
            'Cliente Nuevo',
            $usuario->name
        );

        $this->assertSame(
            'cliente',
            $usuario->rol
        );

        $this->assertSame(
            'activo',
            $usuario->estado
        );

        $this->assertTrue(
            Hash::check(
                'Clave123',
                $usuario->password
            )
        );

        $this->assertDatabaseHas('clientes', [
            'user_id' => $usuario->id,
            'nombre' => 'Cliente Nuevo',
            'telefono' => '8888-8888',
            'correo' => 'cliente.nuevo@test.com',
        ]);

        $this->assertDatabaseHas(
            'personal_access_tokens',
            [
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'rooster-cliente',
            ]
        );
    }

    public function test_registro_no_permite_asignarse_rol_de_administrador(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'email' => 'intento.admin@test.com',
                'rol' => 'admin',
                'estado' => 'inactivo',
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'user.rol',
                'cliente'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            )
            ->assertJsonPath(
                'redirect',
                '/'
            );

        $this->assertDatabaseHas('users', [
            'email' => 'intento.admin@test.com',
            'rol' => 'cliente',
            'estado' => 'activo',
        ]);

        $this->assertDatabaseMissing('users', [
            'email' => 'intento.admin@test.com',
            'rol' => 'admin',
        ]);
    }

    public function test_cliente_puede_registrarse_sin_telefono(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $datos = $this->datosRegistro([
            'email' => 'sin.telefono@test.com',
        ]);

        unset($datos['telefono']);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $datos
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'cliente.telefono',
                null
            );

        $usuario = User::where(
            'email',
            'sin.telefono@test.com'
        )->firstOrFail();

        $this->assertDatabaseHas('clientes', [
            'user_id' => $usuario->id,
            'correo' => 'sin.telefono@test.com',
            'telefono' => null,
        ]);
    }

    public function test_nombre_es_obligatorio_para_registrarse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $datos = $this->datosRegistro();

        unset($datos['name']);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $datos
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
            ])
            ->assertJsonPath(
                'errors.name.0',
                'El nombre es obligatorio.'
            );

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_correo_es_obligatorio_para_registrarse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $datos = $this->datosRegistro();

        unset($datos['email']);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $datos
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ])
            ->assertJsonPath(
                'errors.email.0',
                'El correo electrónico es obligatorio.'
            );

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_correo_debe_tener_formato_valido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'email' => 'correo-invalido',
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ])
            ->assertJsonPath(
                'errors.email.0',
                'Debes ingresar un correo válido.'
            );

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_correo_duplicado_no_puede_registrarse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        User::create([
            'name' => 'Usuario existente',
            'email' => 'cliente@test.com',
            'password' => Hash::make('Clave123'),
            'rol' => 'cliente',
            'estado' => 'activo',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro()
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ])
            ->assertJsonPath(
                'errors.email.0',
                'Ese correo ya está registrado.'
            );

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('clientes', 0);
        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_contrasena_es_obligatoria_para_registrarse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $datos = $this->datosRegistro();

        unset($datos['password']);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $datos
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ])
            ->assertJsonPath(
                'errors.password.0',
                'La contraseña es obligatoria.'
            );

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_contrasena_debe_tener_minimo_seis_caracteres(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'password' => '12345',
                'password_confirmation' => '12345',
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ])
            ->assertJsonPath(
                'errors.password.0',
                'La contraseña debe tener al menos 6 caracteres.'
            );

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_confirmacion_de_contrasena_debe_coincidir(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'password' => 'Clave123',
                'password_confirmation' => 'OtraClave123',
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ])
            ->assertJsonPath(
                'errors.password.0',
                'Las contraseñas no coinciden.'
            );

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_nombre_no_puede_superar_cien_caracteres(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'name' => str_repeat('A', 101),
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
            ]);

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_telefono_no_puede_superar_veinte_caracteres(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/register',
            $this->datosRegistro([
                'telefono' => str_repeat('8', 21),
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'telefono',
            ]);

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('clientes', 0);
    }
}