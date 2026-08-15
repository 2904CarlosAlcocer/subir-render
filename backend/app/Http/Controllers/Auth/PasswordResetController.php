<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Throwable;

class PasswordResetController extends Controller
{
    /**
     * Envía el enlace de recuperación al correo del usuario.
     */
    public function enviarEnlace(Request $request): JsonResponse
    {
        $datos = $request->validate(
            [
                'email' => [
                    'required',
                    'email',
                    'max:255',
                ],
            ],
            [
                'email.required' =>
                    'El correo electrónico es obligatorio.',

                'email.email' =>
                    'Debes ingresar un correo electrónico válido.',

                'email.max' =>
                    'El correo electrónico es demasiado largo.',
            ]
        );

        $email = Str::lower(trim($datos['email']));

        try {
            Password::sendResetLink([
                'email' => $email,
            ]);

            return response()->json([
                'message' =>
                    'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
            ]);
        } catch (Throwable $error) {
            Log::error(
                'Error al enviar el enlace de recuperación.',
                [
                    'email' => $email,
                    'error' => $error->getMessage(),
                ]
            );

            return response()->json([
                'message' =>
                    'No fue posible enviar el correo en este momento. Intenta nuevamente.',
            ], 500);
        }
    }

    /**
     * Valida el token y guarda la nueva contraseña.
     */
    public function restablecer(Request $request): JsonResponse
    {
        $datos = $request->validate(
            [
                'token' => [
                    'required',
                    'string',
                ],

                'email' => [
                    'required',
                    'email',
                    'max:255',
                ],

                'password' => [
                    'required',
                    'string',
                    'confirmed',

                    PasswordRule::min(8)
                        ->letters()
                        ->numbers(),
                ],

                /*
                 * Esta regla hace que password_confirmation
                 * también quede guardado dentro de $datos.
                 */
                'password_confirmation' => [
                    'required',
                    'string',
                ],
            ],
            [
                'token.required' =>
                    'El token de recuperación es obligatorio.',

                'token.string' =>
                    'El token de recuperación no es válido.',

                'email.required' =>
                    'El correo electrónico es obligatorio.',

                'email.email' =>
                    'Debes ingresar un correo electrónico válido.',

                'email.max' =>
                    'El correo electrónico es demasiado largo.',

                'password.required' =>
                    'La nueva contraseña es obligatoria.',

                'password.string' =>
                    'La nueva contraseña no es válida.',

                'password.confirmed' =>
                    'Las contraseñas no coinciden.',

                'password.min' =>
                    'La contraseña debe tener al menos 8 caracteres.',

                'password.letters' =>
                    'La contraseña debe contener al menos una letra.',

                'password.numbers' =>
                    'La contraseña debe contener al menos un número.',

                'password_confirmation.required' =>
                    'Debes confirmar la nueva contraseña.',

                'password_confirmation.string' =>
                    'La confirmación de la contraseña no es válida.',
            ]
        );

        $email = Str::lower(trim($datos['email']));

        try {
            $resultado = Password::reset(
                [
                    'token' => $datos['token'],
                    'email' => $email,
                    'password' => $datos['password'],
                    'password_confirmation' =>
                        $datos['password_confirmation'],
                ],
                function (
                    User $usuario,
                    string $password
                ): void {
                    $usuario->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    /*
                     * Cerramos todos los accesos anteriores
                     * que fueron generados con Sanctum.
                     */
                    $usuario->tokens()->delete();

                    event(new PasswordReset($usuario));
                }
            );

            if ($resultado !== Password::PASSWORD_RESET) {
                return response()->json([
                    'message' =>
                        'El enlace de recuperación no es válido, ya fue utilizado o expiró.',

                    'errors' => [
                        'token' => [
                            'Solicita un nuevo enlace de recuperación.',
                        ],
                    ],
                ], 422);
            }

            return response()->json([
                'message' =>
                    'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.',
            ]);
        } catch (Throwable $error) {
            Log::error(
                'Error al restablecer la contraseña.',
                [
                    'email' => $email,
                    'error' => $error->getMessage(),
                ]
            );

            return response()->json([
                'message' =>
                    'No fue posible actualizar la contraseña en este momento.',
            ], 500);
        }
    }
}