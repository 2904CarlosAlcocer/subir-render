<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EsAdmin
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        }

        $rolUsuario = User::normalizarRol(
            $usuario->rol
        );

        if ($rolUsuario !== 'admin') {
            return response()->json([
                'message' => 'No tienes permiso de administrador.',
                'rol_usuario' => $rolUsuario,
            ], 403);
        }

        if ($usuario->rol !== $rolUsuario) {
            $usuario->forceFill([
                'rol' => $rolUsuario,
            ])->save();
        }

        return $next($request);
    }
}