<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClienteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Crea un usuario completo para superar correctamente
     * los middleware de autenticación y roles.
     */
    private function crearUsuario(
        string $rol = 'admin',
        string $email = 'admin.clientes@test.com',
        string $estado = 'activo'
    ): User {
        return User::create([
            'name' => 'Usuario de clientes',
            'email' => $email,
            'password' => Hash::make('Clave123'),
            'rol' => $rol,
            'estado' => $estado,
        ]);
    }

    /**
     * Crea un cliente directamente en la base de datos.
     */
    private function crearCliente(
        string $nombre = 'Cliente de prueba',
        ?string $telefono = '8888-8888',
        ?string $correo = 'cliente@test.com'
    ): Cliente {
        return Cliente::create([
            'nombre' => $nombre,
            'telefono' => $telefono,
            'correo' => $correo,
        ]);
    }

    public function test_listado_de_clientes_es_publico_y_ordenado_por_nombre(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearCliente(
            nombre: 'Zule',
            correo: 'zule@test.com'
        );

        $this->crearCliente(
            nombre: 'Ana',
            correo: 'ana@test.com'
        );

        $this->crearCliente(
            nombre: 'Carlos',
            correo: 'carlos@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson('/api/clientes');

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
                'Ana'
            )
            ->assertJsonPath(
                '1.nombre',
                'Carlos'
            )
            ->assertJsonPath(
                '2.nombre',
                'Zule'
            );
    }

    public function test_consulta_individual_de_cliente_es_publica(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $cliente = $this->crearCliente(
            nombre: 'Cliente consultado',
            telefono: '8777-7777',
            correo: 'consultado@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson(
            "/api/clientes/{$cliente->id}"
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertOk()
            ->assertJsonPath(
                'id',
                $cliente->id
            )
            ->assertJsonPath(
                'nombre',
                'Cliente consultado'
            )
            ->assertJsonPath(
                'telefono',
                '8777-7777'
            )
            ->assertJsonPath(
                'correo',
                'consultado@test.com'
            );
    }

    public function test_consulta_de_cliente_inexistente_devuelve_404(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->getJson(
            '/api/clientes/999999'
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertNotFound();
    }

    public function test_usuario_sin_autenticar_no_puede_crear_clientes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => 'Cliente no autorizado',
            'telefono' => '8888-8888',
            'correo' => 'noautorizado@test.com',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseMissing('clientes', [
            'correo' => 'noautorizado@test.com',
        ]);
    }

    public function test_usuario_que_no_es_admin_no_puede_crear_clientes(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $usuario = $this->crearUsuario(
            rol: 'caja',
            email: 'caja.clientes@test.com'
        );

        Sanctum::actingAs($usuario);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => 'Cliente desde caja',
            'telefono' => '8888-8888',
            'correo' => 'caja.creacion@test.com',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertForbidden();

        $this->assertDatabaseMissing('clientes', [
            'correo' => 'caja.creacion@test.com',
        ]);
    }

    public function test_administrador_puede_crear_cliente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => 'Nuevo Cliente',
            'telefono' => '8888-1111',
            'correo' => 'nuevo.cliente@test.com',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'nombre',
                'Nuevo Cliente'
            )
            ->assertJsonPath(
                'telefono',
                '8888-1111'
            )
            ->assertJsonPath(
                'correo',
                'nuevo.cliente@test.com'
            )
            ->assertJsonStructure([
                'id',
                'nombre',
                'telefono',
                'correo',
                'created_at',
                'updated_at',
            ]);

        $this->assertDatabaseHas('clientes', [
            'nombre' => 'Nuevo Cliente',
            'telefono' => '8888-1111',
            'correo' => 'nuevo.cliente@test.com',
        ]);
    }

    public function test_nombre_es_obligatorio_al_crear_cliente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'telefono' => '8888-8888',
            'correo' => 'sin.nombre@test.com',
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

        $this->assertDatabaseMissing('clientes', [
            'correo' => 'sin.nombre@test.com',
        ]);
    }

    public function test_correo_de_cliente_debe_tener_formato_valido(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => 'Correo inválido',
            'telefono' => '8888-8888',
            'correo' => 'correo-invalido',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'correo',
            ]);

        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_correo_de_cliente_no_puede_repetirse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $this->crearCliente(
            nombre: 'Cliente existente',
            correo: 'repetido@test.com'
        );

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => 'Segundo cliente',
            'telefono' => '8777-7777',
            'correo' => 'repetido@test.com',
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'correo',
            ]);

        $this->assertDatabaseCount('clientes', 1);
    }

    public function test_nombre_y_telefono_respetan_sus_limites_maximos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => str_repeat('A', 101),
            'telefono' => str_repeat('8', 21),
            'correo' => 'limites@test.com',
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
                'telefono',
            ]);

        $this->assertDatabaseMissing('clientes', [
            'correo' => 'limites@test.com',
        ]);
    }

    public function test_telefono_y_correo_pueden_ser_nulos(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->postJson('/api/clientes', [
            'nombre' => 'Cliente sin contacto',
            'telefono' => null,
            'correo' => null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response
            ->assertCreated()
            ->assertJsonPath(
                'nombre',
                'Cliente sin contacto'
            )
            ->assertJsonPath(
                'telefono',
                null
            )
            ->assertJsonPath(
                'correo',
                null
            );

        $this->assertDatabaseHas('clientes', [
            'nombre' => 'Cliente sin contacto',
            'telefono' => null,
            'correo' => null,
        ]);
    }

    public function test_usuario_sin_autenticar_no_puede_actualizar_cliente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $cliente = $this->crearCliente(
            nombre: 'Nombre original',
            correo: 'original@test.com'
        );

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/clientes/{$cliente->id}",
            [
                'nombre' => 'Nombre alterado',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertUnauthorized();

        $this->assertDatabaseHas('clientes', [
            'id' => $cliente->id,
            'nombre' => 'Nombre original',
        ]);
    }

    public function test_usuario_que_no_es_admin_no_puede_actualizar_cliente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $cliente = $this->crearCliente(
            nombre: 'Nombre protegido',
            correo: 'protegido@test.com'
        );

        $usuario = $this->crearUsuario(
            rol: 'cocina',
            email: 'cocina.clientes@test.com'
        );

        Sanctum::actingAs($usuario);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/clientes/{$cliente->id}",
            [
                'nombre' => 'Nombre alterado',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ASSERT
        |--------------------------------------------------------------------------
        */

        $response->assertForbidden();

        $this->assertDatabaseHas('clientes', [
            'id' => $cliente->id,
            'nombre' => 'Nombre protegido',
        ]);
    }

    public function test_administrador_puede_actualizar_parcialmente_cliente(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $cliente = $this->crearCliente(
            nombre: 'Cliente original',
            telefono: '8888-0000',
            correo: 'cliente.original@test.com'
        );

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/clientes/{$cliente->id}",
            [
                'nombre' => 'Cliente actualizado',
                'telefono' => '8999-9999',
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
                'id',
                $cliente->id
            )
            ->assertJsonPath(
                'nombre',
                'Cliente actualizado'
            )
            ->assertJsonPath(
                'telefono',
                '8999-9999'
            )
            ->assertJsonPath(
                'correo',
                'cliente.original@test.com'
            );

        $this->assertDatabaseHas('clientes', [
            'id' => $cliente->id,
            'nombre' => 'Cliente actualizado',
            'telefono' => '8999-9999',
            'correo' => 'cliente.original@test.com',
        ]);
    }

    public function test_cliente_puede_conservar_su_mismo_correo_al_actualizarse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $cliente = $this->crearCliente(
            nombre: 'Cliente mismo correo',
            telefono: '8888-8888',
            correo: 'mismo.correo@test.com'
        );

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/clientes/{$cliente->id}",
            [
                'nombre' => 'Nombre actualizado',
                'correo' => 'mismo.correo@test.com',
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
                'nombre',
                'Nombre actualizado'
            )
            ->assertJsonPath(
                'correo',
                'mismo.correo@test.com'
            );

        $this->assertDatabaseHas('clientes', [
            'id' => $cliente->id,
            'nombre' => 'Nombre actualizado',
            'correo' => 'mismo.correo@test.com',
        ]);
    }

    public function test_cliente_no_puede_usar_correo_de_otro_cliente_al_actualizarse(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ARRANGE
        |--------------------------------------------------------------------------
        */

        $primerCliente = $this->crearCliente(
            nombre: 'Primer cliente',
            correo: 'primero@test.com'
        );

        $segundoCliente = $this->crearCliente(
            nombre: 'Segundo cliente',
            correo: 'segundo@test.com'
        );

        $admin = $this->crearUsuario();

        Sanctum::actingAs($admin);

        /*
        |--------------------------------------------------------------------------
        | ACT
        |--------------------------------------------------------------------------
        */

        $response = $this->putJson(
            "/api/clientes/{$primerCliente->id}",
            [
                'correo' => 'segundo@test.com',
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
                'correo',
            ]);

        $this->assertDatabaseHas('clientes', [
            'id' => $primerCliente->id,
            'correo' => 'primero@test.com',
        ]);

        $this->assertDatabaseHas('clientes', [
            'id' => $segundoCliente->id,
            'correo' => 'segundo@test.com',
        ]);
    }
}