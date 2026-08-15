<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        /*
        |--------------------------------------------------------------------------
        | DESACTIVAR THROTTLE EN ESTAS PRUEBAS
        |--------------------------------------------------------------------------
        |
        | Evita que varias pruebas consecutivas reciban 429.
        | El funcionamiento del controlador sigue probándose normalmente.
        |
        */

        $this->withoutMiddleware(
            ThrottleRequests::class
        );
    }

    /**
     * Crea un usuario válido para recuperación de contraseña.
     */
    private function crearUsuario(
        string $email = 'recuperacion@test.com',
        string $password = 'ClaveActual123',
        string $estado = 'activo'
    ): User {
        return User::create([
            'name' => 'Usuario recuperación',
            'email' => $email,
            'password' => Hash::make($password),
            'rol' => 'cliente',
            'estado' => $estado,
        ]);
    }

    /**
     * Datos válidos para restablecer una contraseña.
     */
    private function datosRestablecimiento(
        string $token,
        string $email,
        array $cambios = []
    ): array {
        return array_merge(
            [
                'token' => $token,
                'email' => $email,
                'password' => 'NuevaClave123',
                'password_confirmation' => 'NuevaClave123',
            ],
            $cambios
        );
    }

    public function test_correo_es_obligatorio_para_solicitar_recuperacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/forgot-password',
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
                'email',
            ]);

        $this->assertDatabaseCount(
            'password_reset_tokens',
            0
        );
    }

    public function test_correo_de_recuperacion_debe_tener_formato_valido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/forgot-password',
            [
                'email' => 'correo-invalido',
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
                'email',
            ]);

        $this->assertDatabaseCount(
            'password_reset_tokens',
            0
        );
    }

    public function test_usuario_registrado_recibe_notificacion_de_recuperacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Notification::fake();

        $usuario = $this->crearUsuario(
            email: 'enlace@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/forgot-password',
            [
                'email' => 'enlace@test.com',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertOk();

        Notification::assertSentTo(
            $usuario,
            ResetPasswordNotification::class
        );

        $this->assertDatabaseHas(
            'password_reset_tokens',
            [
                'email' => 'enlace@test.com',
            ]
        );
    }

    public function test_correo_se_busca_sin_importar_mayusculas(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Notification::fake();

        $usuario = $this->crearUsuario(
            email: 'mayusculas@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/forgot-password',
            [
                'email' => 'MAYUSCULAS@TEST.COM',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertOk();

        Notification::assertSentTo(
            $usuario,
            ResetPasswordNotification::class
        );

        $this->assertDatabaseHas(
            'password_reset_tokens',
            [
                'email' => 'mayusculas@test.com',
            ]
        );
    }

    public function test_correo_inexistente_no_genera_token_de_recuperacion(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Notification::fake();

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/forgot-password',
            [
                'email' => 'noexiste@test.com',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        |
        | Algunos controladores responden 200 para no revelar que el usuario
        | no existe y otros responden 422. Ambos comportamientos son válidos,
        | siempre que no se cree un token ni se envíe una notificación.
        |
        */

        $this->assertContains(
            $response->getStatusCode(),
            [200, 422]
        );

        Notification::assertNothingSent();

        $this->assertDatabaseMissing(
            'password_reset_tokens',
            [
                'email' => 'noexiste@test.com',
            ]
        );
    }

    public function test_token_es_obligatorio_para_restablecer_contrasena(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/reset-password',
            [
                'email' => 'usuario@test.com',
                'password' => 'NuevaClave123',
                'password_confirmation' => 'NuevaClave123',
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
                'token',
            ]);
    }

    public function test_correo_es_obligatorio_para_restablecer_contrasena(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/reset-password',
            [
                'token' => 'token-de-prueba',
                'password' => 'NuevaClave123',
                'password_confirmation' => 'NuevaClave123',
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
                'email',
            ]);
    }

    public function test_contrasena_es_obligatoria_para_restablecerla(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/reset-password',
            [
                'token' => 'token-de-prueba',
                'email' => 'usuario@test.com',
                'password_confirmation' => 'NuevaClave123',
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
                'password',
            ]);
    }

    public function test_contrasena_nueva_debe_tener_minimo_ocho_caracteres(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/reset-password',
            [
                'token' => 'token-de-prueba',
                'email' => 'usuario@test.com',
                'password' => 'Clave1',
                'password_confirmation' => 'Clave1',
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
                'password',
            ]);
    }

    public function test_confirmacion_de_contrasena_es_obligatoria_y_debe_coincidir(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT - CONFIRMACIÓN AUSENTE
        |--------------------------------------------------------------------------
        */

        $sinConfirmacion = $this->postJson(
            '/api/reset-password',
            [
                'token' => 'token-de-prueba',
                'email' => 'usuario@test.com',
                'password' => 'NuevaClave123',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $sinConfirmacion
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ]);

        /*
        |--------------------------------------------------------------------------
        | ACT - CONFIRMACIÓN DIFERENTE
        |--------------------------------------------------------------------------
        */

        $confirmacionDiferente = $this->postJson(
            '/api/reset-password',
            [
                'token' => 'token-de-prueba',
                'email' => 'usuario@test.com',
                'password' => 'NuevaClave123',
                'password_confirmation' => 'OtraClave123',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $confirmacionDiferente
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ]);
    }

    public function test_token_invalido_no_cambia_la_contrasena(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            email: 'token.invalido@test.com',
            password: 'ClaveActual123'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/reset-password',
            $this->datosRestablecimiento(
                token: 'token-totalmente-invalido',
                email: 'token.invalido@test.com'
            )
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $this->assertContains(
            $response->getStatusCode(),
            [400, 422]
        );

        $usuario->refresh();

        $this->assertTrue(
            Hash::check(
                'ClaveActual123',
                $usuario->password
            )
        );

        $this->assertFalse(
            Hash::check(
                'NuevaClave123',
                $usuario->password
            )
        );
    }

    public function test_token_valido_restablece_contrasena_y_cierra_sesiones(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        Event::fake([
            PasswordReset::class,
        ]);

        $usuario = $this->crearUsuario(
            email: 'restablecer@test.com',
            password: 'ClaveActual123'
        );

        $usuario
            ->createToken('sesion-anterior');

        $token = Password::broker()
            ->createToken($usuario);

        $this->assertDatabaseHas(
            'personal_access_tokens',
            [
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'sesion-anterior',
            ]
        );

        $this->assertDatabaseHas(
            'password_reset_tokens',
            [
                'email' => 'restablecer@test.com',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson(
            '/api/reset-password',
            $this->datosRestablecimiento(
                token: $token,
                email: 'restablecer@test.com'
            )
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertOk();

        $usuario->refresh();

        $this->assertTrue(
            Hash::check(
                'NuevaClave123',
                $usuario->password
            )
        );

        $this->assertFalse(
            Hash::check(
                'ClaveActual123',
                $usuario->password
            )
        );

        $this->assertDatabaseMissing(
            'password_reset_tokens',
            [
                'email' => 'restablecer@test.com',
            ]
        );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'tokenable_type' => User::class,
                'tokenable_id' => $usuario->id,
                'name' => 'sesion-anterior',
            ]
        );

        Event::assertDispatched(
            PasswordReset::class,
            function (PasswordReset $evento) use ($usuario) {
                return $evento->user->is($usuario);
            }
        );
    }

    public function test_token_de_recuperacion_no_puede_utilizarse_dos_veces(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            email: 'token.unico@test.com',
            password: 'ClaveActual123'
        );

        $token = Password::broker()
            ->createToken($usuario);

        /*
        |--------------------------------------------------------------------------
        | ACT - PRIMER USO
        |--------------------------------------------------------------------------
        */

        $primeraRespuesta = $this->postJson(
            '/api/reset-password',
            $this->datosRestablecimiento(
                token: $token,
                email: 'token.unico@test.com'
            )
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT - PRIMER USO CORRECTO
        |--------------------------------------------------------------------------
        */

        $primeraRespuesta->assertOk();

        $usuario->refresh();

        $this->assertTrue(
            Hash::check(
                'NuevaClave123',
                $usuario->password
            )
        );

        /*
        |--------------------------------------------------------------------------
        | ACT - SEGUNDO USO DEL MISMO TOKEN
        |--------------------------------------------------------------------------
        */

        $segundaRespuesta = $this->postJson(
            '/api/reset-password',
            $this->datosRestablecimiento(
                token: $token,
                email: 'token.unico@test.com',
                cambios: [
                    'password' => 'OtraClave456',
                    'password_confirmation' => 'OtraClave456',
                ]
            )
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT - TOKEN RECHAZADO
        |--------------------------------------------------------------------------
        */

        $this->assertContains(
            $segundaRespuesta->getStatusCode(),
            [400, 422]
        );

        $usuario->refresh();

        $this->assertTrue(
            Hash::check(
                'NuevaClave123',
                $usuario->password
            )
        );

        $this->assertFalse(
            Hash::check(
                'OtraClave456',
                $usuario->password
            )
        );
    }
}