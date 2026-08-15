<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SeguridadUsuariosRecuperacionTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'ClaveSegura123';

    private const MENSAJE_RECUPERACION =
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

    /*
    |--------------------------------------------------------------------------
    | MÉTODOS AUXILIARES
    |--------------------------------------------------------------------------
    */

    private function crearUsuario(
        string $rol = 'cliente',
        string $estado = 'activo',
        ?string $email = null
    ): User {
        return User::query()->create([
            'name' => 'Usuario de prueba',
            'email' => $email
                ?? 'usuario' . uniqid() . '@rooster.test',
            'password' => Hash::make(self::PASSWORD),
            'rol' => $rol,
            'estado' => $estado,
        ]);
    }

    private function datosLogin(
        string $email,
        string $password = self::PASSWORD
    ): array {
        return [
            'email' => $email,
            'password' => $password,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 1
    |--------------------------------------------------------------------------
    */

    public function test_usuario_inactivo_no_puede_iniciar_sesion(): void
    {
        $usuario = $this->crearUsuario(
            'cliente',
            'inactivo',
            'inactivo@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ])
            ->assertJsonPath(
                'errors.email.0',
                'Tu cuenta está inactiva. Contacta al administrador.'
            );

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 2
    |--------------------------------------------------------------------------
    */

    public function test_usuario_con_estado_desconocido_no_puede_iniciar_sesion(): void
    {
        $usuario = $this->crearUsuario(
            'cliente',
            'suspendido',
            'suspendido@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ])
            ->assertJsonPath(
                'errors.email.0',
                'Tu cuenta está inactiva. Contacta al administrador.'
            );

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 3
    |--------------------------------------------------------------------------
    */

    public function test_login_normaliza_el_estado_activo_con_mayusculas_y_espacios(): void
    {
        $usuario = $this->crearUsuario(
            'cliente',
            ' ACTIVO ',
            'estado@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Login exitoso'
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
            'id' => $usuario->id,
            'estado' => 'activo',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 4
    |--------------------------------------------------------------------------
    */

    public function test_login_acepta_el_correo_con_mayusculas_y_espacios(): void
    {
        $usuario = $this->crearUsuario(
            'cliente',
            'activo',
            'correo@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin(
                '  CORREO@ROOSTER.TEST  '
            )
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'user.id',
                $usuario->id
            )
            ->assertJsonPath(
                'user.email',
                'correo@rooster.test'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 5
    |--------------------------------------------------------------------------
    */

    public function test_login_normaliza_administrador_y_devuelve_su_ruta(): void
    {
        $usuario = $this->crearUsuario(
            'Administrador',
            'activo',
            'administrador-login@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'user.rol',
                'admin'
            )
            ->assertJsonPath(
                'redirect',
                '/admin'
            );

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'rol' => 'admin',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 6
    |--------------------------------------------------------------------------
    */

    public function test_login_normaliza_chef_y_devuelve_la_ruta_de_cocina(): void
    {
        $usuario = $this->crearUsuario(
            'Chef',
            'activo',
            'chef-login@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'user.rol',
                'cocina'
            )
            ->assertJsonPath(
                'redirect',
                '/cocina'
            );

        $this->assertDatabaseHas('users', [
            'id' => $usuario->id,
            'rol' => 'cocina',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 7
    |--------------------------------------------------------------------------
    */

    public function test_usuario_con_rol_desconocido_no_puede_iniciar_sesion(): void
    {
        $usuario = $this->crearUsuario(
            'supervisor',
            'activo',
            'supervisor@rooster.test'
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ])
            ->assertJsonPath(
                'errors.email.0',
                'No tienes permiso para acceder.'
            );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'tokenable_id' => $usuario->id,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 8
    |--------------------------------------------------------------------------
    */

    public function test_login_exitoso_elimina_tokens_anteriores_y_deja_uno_nuevo(): void
    {
        $usuario = $this->crearUsuario(
            'admin',
            'activo',
            'tokens@rooster.test'
        );

        $usuario->createToken('token-viejo-uno');
        $usuario->createToken('token-viejo-dos');

        $this->assertSame(
            2,
            DB::table('personal_access_tokens')
                ->where(
                    'tokenable_id',
                    $usuario->id
                )
                ->count()
        );

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin($usuario->email)
        );

        $response
            ->assertOk()
            ->assertJsonStructure([
                'message',
                'user',
                'redirect',
                'token',
            ]);

        $tokens = DB::table('personal_access_tokens')
            ->where(
                'tokenable_id',
                $usuario->id
            )
            ->get();

        $this->assertCount(1, $tokens);

        $this->assertSame(
            'rooster-token',
            $tokens->first()->name
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 9
    |--------------------------------------------------------------------------
    */

    public function test_login_fallido_no_elimina_los_tokens_anteriores(): void
    {
        $usuario = $this->crearUsuario(
            'admin',
            'activo',
            'token-conservado@rooster.test'
        );

        $token = $usuario->createToken(
            'token-que-debe-conservarse'
        );

        $tokenId = $token
            ->accessToken
            ->id;

        $response = $this->postJson(
            '/api/login',
            $this->datosLogin(
                $usuario->email,
                'PasswordIncorrecto999'
            )
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ]);

        $this->assertDatabaseHas(
            'personal_access_tokens',
            [
                'id' => $tokenId,
                'tokenable_id' => $usuario->id,
                'name' => 'token-que-debe-conservarse',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 10
    |--------------------------------------------------------------------------
    */

    public function test_recuperacion_no_revela_si_el_correo_esta_registrado(): void
    {
        Notification::fake();

        $usuario = $this->crearUsuario(
            'cliente',
            'activo',
            'recuperacion@rooster.test'
        );

        $respuestaRegistrado = $this
            ->withServerVariables([
                'REMOTE_ADDR' => '10.10.10.10',
            ])
            ->postJson('/api/forgot-password', [
                'email' => $usuario->email,
            ]);

        $respuestaNoRegistrado = $this
            ->withServerVariables([
                'REMOTE_ADDR' => '10.10.10.11',
            ])
            ->postJson('/api/forgot-password', [
                'email' => 'no-existe@rooster.test',
            ]);

        $respuestaRegistrado
            ->assertOk()
            ->assertJsonPath(
                'message',
                self::MENSAJE_RECUPERACION
            );

        $respuestaNoRegistrado
            ->assertOk()
            ->assertJsonPath(
                'message',
                self::MENSAJE_RECUPERACION
            );

        $this->assertSame(
            $respuestaRegistrado->json('message'),
            $respuestaNoRegistrado->json('message')
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 11
    |--------------------------------------------------------------------------
    */

    public function test_recuperacion_de_contrasena_bloquea_la_sexta_solicitud_en_un_minuto(): void
    {
        Notification::fake();

        $usuario = $this->crearUsuario(
            'cliente',
            'activo',
            'limite-recuperacion@rooster.test'
        );

        /*
         * La ruta utiliza throttle:5,1.
         * Las primeras cinco solicitudes deben permitirse.
         */

        for ($intento = 1; $intento <= 5; $intento++) {
            $this
                ->withServerVariables([
                    'REMOTE_ADDR' => '10.20.20.20',
                ])
                ->postJson('/api/forgot-password', [
                    'email' => $usuario->email,
                ])
                ->assertOk();
        }

        /*
         * La sexta solicitud debe bloquearse.
         */

        $this
            ->withServerVariables([
                'REMOTE_ADDR' => '10.20.20.20',
            ])
            ->postJson('/api/forgot-password', [
                'email' => $usuario->email,
            ])
            ->assertStatus(429);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 12
    |--------------------------------------------------------------------------
    */

    public function test_restauracion_bloquea_la_solicitud_numero_once_en_un_minuto(): void
    {
        $usuario = $this->crearUsuario(
            'cliente',
            'activo',
            'limite-reset@rooster.test'
        );

        $datos = [
            'token' => 'token-invalido',
            'email' => $usuario->email,
            'password' => 'NuevaClave123',
            'password_confirmation' => 'NuevaClave123',
        ];

        /*
         * La ruta utiliza throttle:10,1.
         *
         * Las primeras diez solicitudes llegan al controlador.
         * Como el token es inválido, deben responder 422.
         */

        for ($intento = 1; $intento <= 10; $intento++) {
            $this
                ->withServerVariables([
                    'REMOTE_ADDR' => '10.30.30.30',
                ])
                ->postJson(
                    '/api/reset-password',
                    $datos
                )
                ->assertUnprocessable();
        }

        /*
         * La solicitud número once debe ser bloqueada
         * directamente por el middleware throttle.
         */

        $this
            ->withServerVariables([
                'REMOTE_ADDR' => '10.30.30.30',
            ])
            ->postJson(
                '/api/reset-password',
                $datos
            )
            ->assertStatus(429);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST 13
    |--------------------------------------------------------------------------
    */

    public function test_usuario_inactivo_con_token_existente_no_puede_entrar_a_rutas_administrativas(): void
    {
        $usuario = $this->crearUsuario(
            'admin',
            'inactivo',
            'admin-inactivo@rooster.test'
        );

        /*
         * Simulamos un token creado antes de que el administrador
         * desactivara la cuenta.
         */

        $token = $usuario
            ->createToken('token-anterior')
            ->plainTextToken;

        $response = $this
            ->withHeader(
                'Authorization',
                'Bearer ' . $token
            )
            ->getJson('/api/users');

        $response
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Tu cuenta está inactiva. Contacta al administrador.'
            );
    }
}