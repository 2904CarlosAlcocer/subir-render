<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Ruta principal de cada rol.
     */
    private const RUTAS_POR_ROL = [
        'admin' => '/admin',
        'cocina' => '/cocina',
        'caja' => '/caja',
        'cliente' => '/',
    ];

    /**
     * Cantidad máxima de intentos incorrectos.
     */
    private const MAXIMO_INTENTOS_LOGIN = 3;

    /**
     * Tiempo de bloqueo en segundos.
     */
    private const SEGUNDOS_BLOQUEO_LOGIN = 60;

    /**
     * Inicio de sesión.
     */
    public function login(
        Request $request
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | VALIDAR DATOS
        |--------------------------------------------------------------------------
        */

        $datos = $request->validate(
            [
                'email' => [
                    'required',
                    'email',
                    'max:150',
                ],

                'password' => [
                    'required',
                    'string',
                ],
            ],
            [
                'email.required' =>
                    'El correo electrónico es obligatorio.',

                'email.email' =>
                    'Debes ingresar un correo electrónico válido.',

                'email.max' =>
                    'El correo electrónico es demasiado largo.',

                'password.required' =>
                    'La contraseña es obligatoria.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR CORREO
        |--------------------------------------------------------------------------
        */

        $email = Str::lower(
            trim($datos['email'])
        );

        /*
        |--------------------------------------------------------------------------
        | CREAR CLAVE DEL LIMITADOR
        |--------------------------------------------------------------------------
        |
        | Se combina el correo con la dirección IP.
        |
        | De esta forma, los intentos se controlan según la cuenta y
        | el dispositivo o red desde donde se intenta ingresar.
        |
        */

        $claveIntentos = sprintf(
            'login:%s|%s',
            $email,
            $request->ip()
        );

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR BLOQUEO ACTIVO
        |--------------------------------------------------------------------------
        */

        if (
            RateLimiter::tooManyAttempts(
                $claveIntentos,
                self::MAXIMO_INTENTOS_LOGIN
            )
        ) {
            $segundosRestantes =
                RateLimiter::availableIn(
                    $claveIntentos
                );

            return response()->json(
                [
                    'message' =>
                        'Demasiados intentos fallidos. Espera antes de volver a intentarlo.',

                    'bloqueado' => true,

                    'retry_after' =>
                        $segundosRestantes,

                    'attempts_remaining' => 0,
                ],
                429
            );
        }

        /*
        |--------------------------------------------------------------------------
        | BUSCAR USUARIO
        |--------------------------------------------------------------------------
        */

        $user = User::whereRaw(
            'LOWER(email) = ?',
            [$email]
        )->first();

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR CREDENCIALES
        |--------------------------------------------------------------------------
        */

        $credencialesCorrectas =
            $user !== null &&
            Hash::check(
                $datos['password'],
                $user->password
            );

        if (!$credencialesCorrectas) {
            /*
             * Registrar un intento incorrecto.
             */
            RateLimiter::hit(
                $claveIntentos,
                self::SEGUNDOS_BLOQUEO_LOGIN
            );

            $intentosRealizados =
                RateLimiter::attempts(
                    $claveIntentos
                );

            $intentosRestantes = max(
                0,
                self::MAXIMO_INTENTOS_LOGIN -
                    $intentosRealizados
            );

            /*
             * Si alcanzó el tercer intento, se bloquea
             * inmediatamente durante 60 segundos.
             */
            if ($intentosRestantes === 0) {
                return response()->json(
                    [
                        'message' =>
                            'Demasiados intentos fallidos. El acceso fue bloqueado temporalmente durante 60 segundos.',

                        'bloqueado' => true,

                        'retry_after' =>
                            self::SEGUNDOS_BLOQUEO_LOGIN,

                        'attempts_remaining' => 0,
                    ],
                    429
                );
            }

            return response()->json(
                [
                    'message' =>
                        'El correo o la contraseña son incorrectos.',

                    'bloqueado' => false,

                    'retry_after' => 0,

                    'attempts_remaining' =>
                        $intentosRestantes,
                ],
                422
            );
        }

        /*
        |--------------------------------------------------------------------------
        | LIMPIAR INTENTOS
        |--------------------------------------------------------------------------
        |
        | Si las credenciales son correctas, se elimina cualquier intento
        | fallido anterior asociado al correo y a la dirección IP.
        |
        */

        RateLimiter::clear(
            $claveIntentos
        );

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR ROL Y ESTADO
        |--------------------------------------------------------------------------
        */

        $rol = User::normalizarRol(
            $user->rol
        );

        $estado = Str::lower(
            trim((string) $user->estado)
        );

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR ROL PERMITIDO
        |--------------------------------------------------------------------------
        */

        if (
            !array_key_exists(
                $rol,
                self::RUTAS_POR_ROL
            )
        ) {
            throw ValidationException::withMessages([
                'email' => [
                    'No tienes permiso para acceder.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR ESTADO
        |--------------------------------------------------------------------------
        */

        if ($estado !== 'activo') {
            throw ValidationException::withMessages([
                'email' => [
                    'Tu cuenta está inactiva. Contacta al administrador.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | GUARDAR ROL Y ESTADO NORMALIZADOS
        |--------------------------------------------------------------------------
        */

        if (
            $user->rol !== $rol ||
            $user->estado !== $estado
        ) {
            $user->forceFill([
                'rol' => $rol,
                'estado' => $estado,
            ])->save();
        }

        /*
        |--------------------------------------------------------------------------
        | ELIMINAR TOKENS ANTERIORES
        |--------------------------------------------------------------------------
        */

        $user->tokens()->delete();

        /*
        |--------------------------------------------------------------------------
        | CREAR TOKEN
        |--------------------------------------------------------------------------
        */

        $token = $user
            ->createToken('rooster-token')
            ->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'rol' => $rol,
                'estado' => $estado,
            ],

            'redirect' =>
                self::RUTAS_POR_ROL[$rol],

            'token' => $token,
        ]);
    }

    /**
     * Registro público para clientes.
     */
    public function register(
        Request $request
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR DATOS ANTES DE VALIDAR
        |--------------------------------------------------------------------------
        |
        | Elimina espacios innecesarios y convierte el correo a minúsculas
        | para evitar cuentas duplicadas por diferencias de formato.
        |
        */

        $nombre = trim(
            (string) $request->input('name', '')
        );

        $email = Str::lower(
            trim(
                (string) $request->input('email', '')
            )
        );

        $telefonoIngresado = trim(
            (string) $request->input('telefono', '')
        );

        $telefono = $telefonoIngresado !== ''
            ? $telefonoIngresado
            : null;

        $request->merge([
            'name' => $nombre,
            'email' => $email,
            'telefono' => $telefono,
        ]);

        /*
        |--------------------------------------------------------------------------
        | VALIDACIÓN
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate(
            [
                'name' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'email' => [
                    'required',
                    'email',
                    'max:150',
                    'unique:users,email',
                ],

                'telefono' => [
                    'nullable',
                    'string',
                    'max:20',
                ],

                'password' => [
                    'required',
                    'string',
                    'min:6',
                    'confirmed',
                ],
            ],
            [
                'name.required' =>
                    'El nombre es obligatorio.',

                'name.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'email.required' =>
                    'El correo electrónico es obligatorio.',

                'email.email' =>
                    'Debes ingresar un correo válido.',

                'email.max' =>
                    'El correo electrónico es demasiado largo.',

                'email.unique' =>
                    'Ese correo ya está registrado.',

                'telefono.max' =>
                    'El teléfono no puede superar los 20 caracteres.',

                'password.required' =>
                    'La contraseña es obligatoria.',

                'password.min' =>
                    'La contraseña debe tener al menos 6 caracteres.',

                'password.confirmed' =>
                    'Las contraseñas no coinciden.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | CREAR CUENTA Y VINCULAR PERFIL DE CLIENTE
        |--------------------------------------------------------------------------
        |
        | Si Caja ya registró a esta persona con el mismo correo y todavía
        | tiene user_id NULL, se reutiliza ese cliente en lugar de duplicarlo.
        |
        | La cuenta y el perfil se guardan dentro de una transacción.
        |
        */

        [$user, $cliente] = DB::transaction(
            function () use (
                $validated,
                $nombre,
                $email,
                $telefono
            ) {
                /*
                 * Bloqueamos el registro durante la operación para evitar
                 * que dos solicitudes intenten vincularlo simultáneamente.
                 */
                $clienteExistente = Cliente::whereNotNull(
                    'correo'
                )
                    ->whereRaw(
                        'LOWER(TRIM(correo)) = ?',
                        [$email]
                    )
                    ->lockForUpdate()
                    ->first();

                /*
                 * Este caso indicaría datos inconsistentes:
                 * el cliente ya está relacionado con otra cuenta.
                 */
                if (
                    $clienteExistente &&
                    $clienteExistente->user_id !== null
                ) {
                    throw ValidationException::withMessages([
                        'email' => [
                            'Este cliente ya tiene una cuenta vinculada.',
                        ],
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | CREAR USUARIO
                |--------------------------------------------------------------------------
                */

                $user = User::create([
                    'name' => $nombre,
                    'email' => $email,
                    'password' =>
                        $validated['password'],
                    'rol' => 'cliente',
                    'estado' => 'activo',
                ]);

                /*
                |--------------------------------------------------------------------------
                | VINCULAR O CREAR CLIENTE
                |--------------------------------------------------------------------------
                */

                if ($clienteExistente) {
                    $clienteExistente->update([
                        'user_id' => $user->id,
                        'nombre' => $nombre,

                        /*
                         * Si el cliente no escribió teléfono al registrarse,
                         * se conserva el teléfono agregado anteriormente
                         * desde CajaDashboard.
                         */
                        'telefono' =>
                            $telefono
                            ?? $clienteExistente->telefono,

                        'correo' => $email,
                    ]);

                    $cliente = $clienteExistente->fresh();
                } else {
                    $cliente = Cliente::create([
                        'user_id' => $user->id,
                        'nombre' => $nombre,
                        'telefono' => $telefono,
                        'correo' => $email,
                    ]);
                }

                return [
                    $user,
                    $cliente,
                ];
            }
        );

        /*
        |--------------------------------------------------------------------------
        | CREAR TOKEN DEL CLIENTE
        |--------------------------------------------------------------------------
        */

        $token = $user
            ->createToken('rooster-cliente')
            ->plainTextToken;

        return response()->json([
            'message' => 'Registro exitoso',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'rol' => 'cliente',
                'estado' => 'activo',
            ],

            'cliente' => $cliente,

            'redirect' => '/',

            'token' => $token,
        ], 201);
    }

    /**
     * Cierra la sesión actual.
     */
    public function logout(
        Request $request
    ): JsonResponse {
        $request
            ->user()
            ?->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' =>
                'Sesión cerrada correctamente',
        ]);
    }

    /**
     * Información del usuario autenticado.
     */
    public function me(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        $rol = User::normalizarRol(
            $user->rol
        );

        $estado = Str::lower(
            trim((string) $user->estado)
        );

        /*
         * Corrige usuarios que ya tenían
         * una sesión iniciada.
         */
        if (
            $user->rol !== $rol ||
            $user->estado !== $estado
        ) {
            $user->forceFill([
                'rol' => $rol,
                'estado' => $estado,
            ])->save();
        }

        $respuesta = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'rol' => $rol,
                'estado' => $estado,
            ],

            'redirect' =>
                self::RUTAS_POR_ROL[$rol] ?? '/',
        ];

        if ($rol === 'cliente') {
            $respuesta['cliente'] =
                Cliente::where(
                    'user_id',
                    $user->id
                )->first();
        }

        return response()->json(
            $respuesta
        );
    }
}