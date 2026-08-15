<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Crea un usuario para las pruebas de inicio de sesión.
     */
    private function crearUsuario(
        string $rol = 'admin',
        string $estado = 'activo',
        string $email = 'usuario@test.com',
        string $password = 'Clave123'
    ): User {
        return User::create([
            'name' => 'Usuario de prueba',
            'email' => $email,
            'password' => Hash::make($password),
            'rol' => $rol,
            'estado' => $estado,
        ]);
    }

    public function test_usuario_admin_activo_puede_iniciar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'admin',
            estado: 'activo',
            email: 'admin@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'Clave123',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Login exitoso'
            )
            ->assertJsonPath(
                'user.id',
                $usuario->id
            )
            ->assertJsonPath(
                'user.name',
                'Usuario de prueba'
            )
            ->assertJsonPath(
                'user.email',
                'admin@test.com'
            )
            ->assertJsonPath(
                'user.rol',
                'admin'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
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
                'token',
            ]);

        $this->assertNotEmpty(
            $response->json('token')
        );

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $usuario->id,
            'name' => 'rooster-token',
        ]);
    }

    public function test_usuario_cocina_activo_puede_iniciar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearUsuario(
            rol: 'cocina',
            estado: 'activo',
            email: 'cocina@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'cocina@test.com',
            'password' => 'Clave123',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Login exitoso'
            )
            ->assertJsonPath(
                'user.rol',
                'cocina'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            );

        $this->assertNotEmpty(
            $response->json('token')
        );
    }

    public function test_usuario_caja_activo_puede_iniciar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearUsuario(
            rol: 'caja',
            estado: 'activo',
            email: 'caja@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'caja@test.com',
            'password' => 'Clave123',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Login exitoso'
            )
            ->assertJsonPath(
                'user.rol',
                'caja'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            );

        $this->assertNotEmpty(
            $response->json('token')
        );
    }

    public function test_usuario_cliente_activo_puede_iniciar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearUsuario(
            rol: 'cliente',
            estado: 'activo',
            email: 'cliente@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'cliente@test.com',
            'password' => 'Clave123',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Login exitoso'
            )
            ->assertJsonPath(
                'user.rol',
                'cliente'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            );

        $this->assertNotEmpty(
            $response->json('token')
        );
    }

    public function test_usuario_inactivo_no_puede_iniciar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'admin',
            estado: 'inactivo',
            email: 'inactivo@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'inactivo@test.com',
            'password' => 'Clave123',
        ]);

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
                'Tu cuenta está inactiva. Contacta al administrador.'
            );

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $usuario->id,
        ]);
    }

    public function test_contrasena_incorrecta_es_rechazada(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'admin',
            estado: 'activo',
            email: 'password@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'password@test.com',
            'password' => 'ClaveIncorrecta',
        ]);

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
                'Las credenciales no son correctas.'
            );

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $usuario->id,
        ]);
    }

    public function test_correo_inexistente_es_rechazado(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'noexiste@test.com',
            'password' => 'Clave123',
        ]);

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
                'Las credenciales no son correctas.'
            );

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_usuario_con_rol_no_permitido_no_puede_iniciar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'visitante',
            estado: 'activo',
            email: 'visitante@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'visitante@test.com',
            'password' => 'Clave123',
        ]);

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
                'No tienes permiso para acceder.'
            );

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $usuario->id,
        ]);
    }

    public function test_correo_es_obligatorio(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'password' => 'Clave123',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ]);

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_correo_debe_tener_formato_valido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'correo-invalido',
            'password' => 'Clave123',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ]);

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_contrasena_es_obligatoria(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/login', [
            'email' => 'usuario@test.com',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ]);

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }
}