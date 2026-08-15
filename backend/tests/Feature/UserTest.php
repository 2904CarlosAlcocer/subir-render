<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTest extends TestCase
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
            'email' => "{$rol}@autenticado.test",
            'rol' => $rol,
            'estado' => 'activo',
        ]);

        Sanctum::actingAs($usuario, ['*']);
    }

    /**
     * Crea un usuario real en la base de datos.
     */
    private function crearUsuario(
        string $rol = 'cocina',
        string $estado = 'activo',
        string $email = 'usuario@test.com',
        string $name = 'Usuario de prueba'
    ): User {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('Clave123'),
            'rol' => $rol,
            'estado' => $estado,
        ]);
    }

    public function test_no_permite_listar_usuarios_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/users');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();
    }

    public function test_solo_admin_puede_listar_usuarios(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearUsuario(
            rol: 'admin',
            email: 'admin@test.com',
            name: 'Administrador'
        );

        $this->crearUsuario(
            rol: 'cocina',
            email: 'cocina@test.com',
            name: 'Cocina'
        );

        $this->crearUsuario(
            rol: 'caja',
            email: 'caja@test.com',
            name: 'Caja'
        );

        $this->crearUsuario(
            rol: 'cliente',
            email: 'cliente@test.com',
            name: 'Cliente'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/users');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonFragment([
                'name' => 'Administrador',
                'email' => 'admin@test.com',
                'rol' => 'admin',
                'estado' => 'activo',
            ])
            ->assertJsonFragment([
                'name' => 'Cocina',
                'email' => 'cocina@test.com',
                'rol' => 'cocina',
                'estado' => 'activo',
            ])
            ->assertJsonFragment([
                'name' => 'Caja',
                'email' => 'caja@test.com',
                'rol' => 'caja',
                'estado' => 'activo',
            ])
            ->assertJsonMissing([
                'email' => 'cliente@test.com',
            ]);
    }

    public function test_cocina_no_puede_listar_usuarios(): void
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

        $response = $this->getJson('/api/users');

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

    public function test_caja_no_puede_listar_usuarios(): void
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

        $response = $this->getJson('/api/users');

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

    public function test_cliente_no_puede_listar_usuarios(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->autenticarComo('cliente');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/users');

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

    public function test_admin_puede_crear_usuario_de_personal(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Nuevo Cocinero',
            'email' => 'nuevo.cocina@test.com',
            'password' => 'Clave123',
            'rol' => 'cocina',
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
                'Usuario creado correctamente'
            )
            ->assertJsonPath(
                'user.name',
                'Nuevo Cocinero'
            )
            ->assertJsonPath(
                'user.email',
                'nuevo.cocina@test.com'
            )
            ->assertJsonPath(
                'user.rol',
                'cocina'
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
            ])
            ->assertJsonMissing([
                'password' => 'Clave123',
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Nuevo Cocinero',
            'email' => 'nuevo.cocina@test.com',
            'rol' => 'cocina',
            'estado' => 'activo',
        ]);

        $usuario = User::where(
            'email',
            'nuevo.cocina@test.com'
        )->firstOrFail();

        $this->assertTrue(
            Hash::check('Clave123', $usuario->password)
        );

        $this->assertNotSame(
            'Clave123',
            $usuario->password
        );
    }

    public function test_no_permite_crear_usuario_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/users', [
            'name' => 'Usuario Nuevo',
            'email' => 'nuevo@test.com',
            'password' => 'Clave123',
            'rol' => 'caja',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseMissing('users', [
            'email' => 'nuevo@test.com',
        ]);
    }

    public function test_usuario_no_admin_no_puede_crear_usuarios(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Usuario Nuevo',
            'email' => 'nuevo@test.com',
            'password' => 'Clave123',
            'rol' => 'caja',
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

        $this->assertDatabaseMissing('users', [
            'email' => 'nuevo@test.com',
        ]);
    }

    public function test_no_permite_crear_usuario_con_correo_repetido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearUsuario(
            rol: 'caja',
            email: 'repetido@test.com'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/users', [
            'name' => 'Otro Usuario',
            'email' => 'repetido@test.com',
            'password' => 'Clave123',
            'rol' => 'cocina',
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

        $this->assertDatabaseCount('users', 1);
    }

    public function test_no_permite_crear_usuario_con_rol_invalido(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Usuario Inválido',
            'email' => 'invalido@test.com',
            'password' => 'Clave123',
            'rol' => 'cliente',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'rol',
            ]);

        $this->assertDatabaseMissing('users', [
            'email' => 'invalido@test.com',
        ]);
    }

    public function test_nombre_es_obligatorio_al_crear_usuario(): void
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

        $response = $this->postJson('/api/users', [
            'email' => 'sin.nombre@test.com',
            'password' => 'Clave123',
            'rol' => 'caja',
        ]);

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
    }

    public function test_correo_es_obligatorio_al_crear_usuario(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Sin Correo',
            'password' => 'Clave123',
            'rol' => 'caja',
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
    }

    public function test_correo_debe_tener_formato_valido_al_crear_usuario(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Correo Inválido',
            'email' => 'correo-invalido',
            'password' => 'Clave123',
            'rol' => 'caja',
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
    }

    public function test_contrasena_es_obligatoria_al_crear_usuario(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Sin Contraseña',
            'email' => 'sin.password@test.com',
            'rol' => 'caja',
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
    }

    public function test_contrasena_debe_tener_minimo_seis_caracteres(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Contraseña Corta',
            'email' => 'password.corto@test.com',
            'password' => '12345',
            'rol' => 'cocina',
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

        $this->assertDatabaseMissing('users', [
            'email' => 'password.corto@test.com',
        ]);
    }

    public function test_rol_es_obligatorio_al_crear_usuario(): void
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

        $response = $this->postJson('/api/users', [
            'name' => 'Sin Rol',
            'email' => 'sin.rol@test.com',
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
                'rol',
            ]);
    }

    public function test_admin_puede_desactivar_un_usuario_activo(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'cocina',
            estado: 'activo',
            email: 'activo@test.com'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/users/{$usuario->id}/toggle-estado"
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
                'Estado actualizado'
            )
            ->assertJsonPath(
                'user.id',
                $usuario->id
            )
            ->assertJsonPath(
                'user.estado',
                'inactivo'
            );

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'estado' => 'inactivo',
        ]);
    }

    public function test_admin_puede_activar_un_usuario_inactivo(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'caja',
            estado: 'inactivo',
            email: 'inactivo@test.com'
        );

        $this->autenticarComo('admin');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/users/{$usuario->id}/toggle-estado"
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
                'Estado actualizado'
            )
            ->assertJsonPath(
                'user.id',
                $usuario->id
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            );

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'estado' => 'activo',
        ]);
    }

    public function test_no_permite_cambiar_estado_sin_autenticacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'cocina',
            estado: 'activo',
            email: 'protegido@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/users/{$usuario->id}/toggle-estado"
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'estado' => 'activo',
        ]);
    }

    public function test_usuario_no_admin_no_puede_cambiar_estado(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'caja',
            estado: 'activo',
            email: 'objetivo@test.com'
        );

        $this->autenticarComo('cocina');

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->patchJson(
            "/api/users/{$usuario->id}/toggle-estado"
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

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'estado' => 'activo',
        ]);
    }

    public function test_devuelve_404_al_cambiar_estado_de_usuario_inexistente(): void
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

        $response = $this->patchJson(
            '/api/users/99999/toggle-estado'
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertNotFound();
    }
}