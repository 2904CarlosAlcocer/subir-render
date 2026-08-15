<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RolMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles
    ): Response {
        $usuario = $request->user();

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR AUTENTICACIÓN
        |--------------------------------------------------------------------------
        */

        if (!$usuario) {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR ESTADO DEL USUARIO
        |--------------------------------------------------------------------------
        |
        | Aunque el token de Sanctum sea válido, una cuenta inactiva no debe
        | conservar acceso al sistema.
        |
        */

        $estadoUsuario = strtolower(
            trim((string) $usuario->estado)
        );

        /*
         * Normalizar el estado almacenado.
         *
         * Ejemplos:
         *
         * ACTIVO    → activo
         * Inactivo  → inactivo
         */

        if ($usuario->estado !== $estadoUsuario) {
            $usuario->forceFill([
                'estado' => $estadoUsuario,
            ])->save();
        }

        if ($estadoUsuario !== 'activo') {
            /*
             * Elimina todos los tokens anteriores para cerrar
             * cualquier sesión que permaneciera abierta.
             */
            $usuario->tokens()->delete();

            return response()->json([
                'message' =>
                    'Tu cuenta está inactiva. Contacta al administrador.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR ROLES RECIBIDOS
        |--------------------------------------------------------------------------
        |
        | Ejemplos:
        |
        | rol:admin
        | rol:admin,cocina,caja
        |
        */

        $rolesPermitidos = array_map(
            fn ($rol) => $this->normalizarRol($rol),
            $roles
        );

        /*
        |--------------------------------------------------------------------------
        | COMPATIBILIDAD CON ALIAS ANTIGUOS
        |--------------------------------------------------------------------------
        |
        | Permite seguir utilizando:
        |
        | es.admin
        | es.cocina
        | es.caja
        | es.cliente
        |
        */

        if (empty($rolesPermitidos)) {
            $middlewaresRuta =
                $request->route()?->gatherMiddleware() ?? [];

            $rolesPorAlias = [
                'es.admin' => 'admin',
                'es.cocina' => 'cocina',
                'es.caja' => 'caja',
                'es.cliente' => 'cliente',
            ];

            foreach (
                $rolesPorAlias as $alias => $rol
            ) {
                if (
                    in_array(
                        $alias,
                        $middlewaresRuta,
                        true
                    )
                ) {
                    $rolesPermitidos[] = $rol;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR ROL DEL USUARIO
        |--------------------------------------------------------------------------
        */

        $rolUsuario = $this->normalizarRol(
            $usuario->rol
        );

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR PERMISO
        |--------------------------------------------------------------------------
        */

        $tienePermiso =
            !empty($rolesPermitidos) &&
            in_array(
                $rolUsuario,
                $rolesPermitidos,
                true
            );

        if (!$tienePermiso) {
            /*
             * Las rutas de pedidos utilizan:
             *
             * rol:admin,cocina,caja
             *
             * Cuando un cliente intenta entrar,
             * devolvemos el mensaje específico
             * esperado para gestión de pedidos.
             */

            $esRutaGestionPedidos =
                $this->esRutaGestionPedidos(
                    $request,
                    $rolesPermitidos
                );

            $mensaje = $esRutaGestionPedidos
                ? 'No tienes permiso para gestionar pedidos.'
                : 'No tienes permiso para realizar esta acción.';

            return response()->json([
                'message' => $mensaje,
                'rol' => $rolUsuario,
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | CORREGIR ROL EN LA BASE DE DATOS
        |--------------------------------------------------------------------------
        |
        | Ejemplos:
        |
        | Administrador → admin
        | Cocinero → cocina
        | Cajero → caja
        |
        */

        if (
            strtolower(
                trim((string) $usuario->rol)
            ) !== $rolUsuario
        ) {
            $usuario->forceFill([
                'rol' => $rolUsuario,
            ])->save();
        }

        return $next($request);
    }

    /**
     * Determina si la solicitud pertenece a las rutas
     * de gestión de pedidos para el personal.
     */
    private function esRutaGestionPedidos(
        Request $request,
        array $rolesPermitidos
    ): bool {
        $rolesGestionPedidos = [
            'admin',
            'cocina',
            'caja',
        ];

        sort($rolesPermitidos);
        sort($rolesGestionPedidos);

        $usaRolesGestionPedidos =
            $rolesPermitidos === $rolesGestionPedidos;

        $ruta = trim(
            (string) $request->path(),
            '/'
        );

        $esRutaPedidos =
            $ruta === 'api/pedidos' ||
            (
                str_starts_with(
                    $ruta,
                    'api/pedidos/'
                ) &&
                str_ends_with(
                    $ruta,
                    '/estado'
                )
            );

        return
            $usaRolesGestionPedidos &&
            $esRutaPedidos;
    }

    /**
     * Convierte variantes de nombres de roles
     * al valor utilizado oficialmente por el sistema.
     */
    private function normalizarRol(
        ?string $rol
    ): string {
        $rol = strtolower(
            trim((string) $rol)
        );

        return match ($rol) {
            'admin',
            'administrador' => 'admin',

            'cocina',
            'cocinero',
            'chef' => 'cocina',

            'caja',
            'cajero' => 'caja',

            'cliente' => 'cliente',

            default => $rol,
        };
    }
}