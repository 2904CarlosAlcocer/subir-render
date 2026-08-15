<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSessionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Crea un usuario válido para las pruebas de sesión.
     */
    private function crearUsuario(
        string $rol = 'admin',
        string $estado = 'activo',
        string $email = 'sesion@test.com'
    ): User {
        return User::create([
            'name' => 'Usuario de sesión',
            'email' => $email,
            'password' => Hash::make('Clave123'),
            'rol' => $rol,
            'estado' => $estado,
        ]);
    }

    /**
     * Genera un token real de Sanctum.
     */
    private function crearToken(
        User $usuario,
        string $nombre = 'rooster-token'
    ): string {
        return $usuario
            ->createToken($nombre)
            ->plainTextToken;
    }

    public function test_usuario_autenticado_puede_consultar_sus_datos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'admin',
            estado: 'activo',
            email: 'admin.sesion@test.com'
        );

        $token = $this->crearToken($usuario);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this
            ->withToken($token)
            ->getJson('/api/user');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'user.id',
                $usuario->id
            )
            ->assertJsonPath(
                'user.name',
                'Usuario de sesión'
            )
            ->assertJsonPath(
                'user.email',
                'admin.sesion@test.com'
            )
            ->assertJsonPath(
                'user.rol',
                'admin'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            )
            ->assertJsonPath(
                'redirect',
                '/admin'
            )
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'rol',
                    'estado',
                ],
                'redirect',
            ]);
    }

    public function test_cliente_autenticado_recibe_su_perfil_de_cliente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'cliente',
            estado: 'activo',
            email: 'cliente.sesion@test.com'
        );

        $cliente = Cliente::create([
            'user_id' => $usuario->id,
            'nombre' => 'Cliente de sesión',
            'telefono' => '8888-8888',
            'correo' => 'cliente.sesion@test.com',
        ]);

        $token = $this->crearToken(
            $usuario,
            'rooster-cliente'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this
            ->withToken($token)
            ->getJson('/api/user');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'user.id',
                $usuario->id
            )
            ->assertJsonPath(
                'user.rol',
                'cliente'
            )
            ->assertJsonPath(
                'redirect',
                '/'
            )
            ->assertJsonPath(
                'cliente.id',
                $cliente->id
            )
            ->assertJsonPath(
                'cliente.user_id',
                $usuario->id
            )
            ->assertJsonPath(
                'cliente.nombre',
                'Cliente de sesión'
            )
            ->assertJsonPath(
                'cliente.telefono',
                '8888-8888'
            )
            ->assertJsonPath(
                'cliente.correo',
                'cliente.sesion@test.com'
            )
            ->assertJsonStructure([
                'user',
                'redirect',
                'cliente',
            ]);
    }

    public function test_usuario_sin_token_no_puede_consultar_api_user(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/user');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();
    }

    public function test_usuario_autenticado_puede_cerrar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            email: 'logout@test.com'
        );

        $token = $this->crearToken($usuario);

        $this->assertDatabaseHas(
            'personal_access_tokens',
            [
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'rooster-token',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this
            ->withToken($token)
            ->postJson('/api/logout');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Sesión cerrada correctamente'
            );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'rooster-token',
            ]
        );
    }

    public function test_logout_elimina_solamente_el_token_actual(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            email: 'varios.tokens@test.com'
        );

        $primerTokenCreado = $usuario
            ->createToken('token-actual');

        $segundoTokenCreado = $usuario
            ->createToken('token-secundario');

        $tokenActual = $primerTokenCreado->plainTextToken;

        $idTokenActual =
            $primerTokenCreado->accessToken->id;

        $idTokenSecundario =
            $segundoTokenCreado->accessToken->id;

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this
            ->withToken($tokenActual)
            ->postJson('/api/logout');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Sesión cerrada correctamente'
            );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'id' => $idTokenActual,
            ]
        );

        $this->assertDatabaseHas(
            'personal_access_tokens',
            [
                'id' => $idTokenSecundario,
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'token-secundario',
            ]
        );
    }

    public function test_token_deja_de_funcionar_despues_del_logout(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            email: 'token.eliminado@test.com'
        );

        $token = $this->crearToken($usuario);

        /*
        |--------------------------------------------------------------------------
        | ACT - CERRAR SESIÓN
        |--------------------------------------------------------------------------
        */

        $logoutResponse = $this
            ->withToken($token)
            ->postJson('/api/logout');

        /*
        |--------------------------------------------------------------------------
        | ASSERT - LOGOUT CORRECTO
        |--------------------------------------------------------------------------
        */

        $logoutResponse
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Sesión cerrada correctamente'
            );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'rooster-token',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | LIMPIAR AUTENTICACIÓN GUARDADA EN MEMORIA
        |--------------------------------------------------------------------------
        |
        | Laravel puede conservar el usuario autenticado entre dos solicitudes
        | realizadas dentro de una misma prueba.
        |
        */

        $this->app['auth']->forgetGuards();

        /*
        |--------------------------------------------------------------------------
        | ACT - INTENTAR USAR EL TOKEN ELIMINADO
        |--------------------------------------------------------------------------
        */

        $userResponse = $this
            ->withToken($token)
            ->getJson('/api/user');

        /*
        |--------------------------------------------------------------------------
        | ASSERT - TOKEN RECHAZADO
        |--------------------------------------------------------------------------
        */

        $userResponse->assertUnauthorized();
    }

    public function test_usuario_sin_token_no_puede_cerrar_sesion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/logout');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();
    }

    public function test_api_user_normaliza_rol_y_estado_del_usuario(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'Administrador',
            estado: 'ACTIVO',
            email: 'normalizado@test.com'
        );

        $token = $this->crearToken($usuario);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this
            ->withToken($token)
            ->getJson('/api/user');

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'user.rol',
                'admin'
            )
            ->assertJsonPath(
                'user.estado',
                'activo'
            )
            ->assertJsonPath(
                'redirect',
                '/admin'
            );

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'rol' => 'admin',
            'estado' => 'activo',
        ]);
    }
}