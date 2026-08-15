<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GestionaPedidos
{
    /**
     * Permite gestionar pedidos únicamente al personal autorizado.
     */
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $usuario = $request->user();

        $rolesPermitidos = [
            'admin',
            'cocina',
            'caja',
        ];

        if (
            !$usuario ||
            !in_array($usuario->rol, $rolesPermitidos, true)
        ) {
            return response()->json([
                'message' =>
                    'No tienes permiso para gestionar pedidos.',
            ], 403);
        }

        return $next($request);
    }
}