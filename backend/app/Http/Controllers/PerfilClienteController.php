<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PerfilClienteController extends Controller
{
    private const ESTADOS_ACTIVOS = [
        'pendiente',
        'confirmado',
        'en_preparacion',
        'listo',
    ];

    /**
     * Devuelve la información del cliente autenticado,
     * todos sus pedidos activos y sus pedidos anteriores.
     *
     * Se conserva "pedido_activo" por compatibilidad con
     * cualquier vista antigua que todavía espere un solo pedido.
     */
    public function mostrar(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if (!$usuario || !$usuario->esCliente()) {
            return response()->json([
                'message' => 'No tienes permiso para consultar este perfil.',
            ], 403);
        }

        $cliente = $usuario->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'Tu cuenta no tiene un perfil de cliente asociado.',
            ], 404);
        }

        $pedidosActivos = $this->obtenerPedidosActivos(
            $cliente->id
        );

        return response()->json([
            'user' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->rolNormalizado(),
            ],

            'cliente' => [
                'id' => $cliente->id,
                'nombre' => $cliente->nombre,
                'correo' => $cliente->correo,
                'telefono' => $cliente->telefono,
                'fecha_registro' => $cliente->fecha_registro,
            ],

            'pedidos_activos' => $pedidosActivos,

            // Compatibilidad con el frontend anterior.
            'pedido_activo' => $pedidosActivos->first(),

            'historial_pedidos' => $this->obtenerHistorialPedidos(
                $cliente->id
            ),
        ]);
    }

    /**
     * Actualiza el correo electrónico y el teléfono
     * del cliente autenticado.
     */
    public function actualizar(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if (!$usuario || !$usuario->esCliente()) {
            return response()->json([
                'message' => 'No tienes permiso para modificar este perfil.',
            ], 403);
        }

        $cliente = $usuario->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'Tu cuenta no tiene un perfil de cliente asociado.',
            ], 404);
        }

        $datos = $request->validate(
            [
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique(
                        'users',
                        'email'
                    )->ignore($usuario->id),
                    Rule::unique(
                        'clientes',
                        'correo'
                    )->ignore($cliente->id),
                ],

                'telefono' => [
                    'nullable',
                    'string',
                    'max:20',
                ],
            ],
            [
                'email.required' =>
                    'El correo electrónico es obligatorio.',

                'email.email' =>
                    'Debes ingresar un correo electrónico válido.',

                'email.max' =>
                    'El correo electrónico es demasiado largo.',

                'email.unique' =>
                    'El correo electrónico ya está registrado.',

                'telefono.string' =>
                    'El número de teléfono no es válido.',

                'telefono.max' =>
                    'El número de teléfono es demasiado largo.',
            ]
        );

        $correo = Str::lower(
            trim($datos['email'])
        );

        $telefono = isset($datos['telefono'])
            ? trim($datos['telefono'])
            : null;

        if ($telefono === '') {
            $telefono = null;
        }

        DB::transaction(function () use (
            $usuario,
            $cliente,
            $correo,
            $telefono
        ) {
            $usuario->update([
                'email' => $correo,
            ]);

            $cliente->update([
                'correo' => $correo,
                'telefono' => $telefono,
            ]);
        });

        $usuario->refresh();
        $cliente->refresh();

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',

            'user' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->rolNormalizado(),
            ],

            'cliente' => [
                'id' => $cliente->id,
                'nombre' => $cliente->nombre,
                'correo' => $cliente->correo,
                'telefono' => $cliente->telefono,
                'fecha_registro' => $cliente->fecha_registro,
            ],
        ]);
    }

    /**
     * Devuelve todos los pedidos activos.
     *
     * Se mantiene el nombre del método y de la ruta para no
     * obligarte a modificar routes/api.php.
     */
    public function pedidoActivo(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if (!$usuario || !$usuario->esCliente()) {
            return response()->json([
                'message' => 'No tienes permiso para consultar estos pedidos.',
            ], 403);
        }

        $cliente = $usuario->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'Tu cuenta no tiene un perfil de cliente asociado.',
            ], 404);
        }

        $pedidosActivos = $this->obtenerPedidosActivos(
            $cliente->id
        );

        return response()->json([
            'pedidos_activos' => $pedidosActivos,

            // Compatibilidad con la respuesta anterior.
            'pedido_activo' => $pedidosActivos->first(),
        ]);
    }

    /**
     * Devuelve los últimos pedidos terminados o cancelados del cliente.
     */
    public function historial(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if (!$usuario || !$usuario->esCliente()) {
            return response()->json([
                'message' => 'No tienes permiso para consultar este historial.',
            ], 403);
        }

        $cliente = $usuario->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'Tu cuenta no tiene un perfil de cliente asociado.',
            ], 404);
        }

        return response()->json([
            'historial_pedidos' => $this->obtenerHistorialPedidos(
                $cliente->id
            ),
        ]);
    }

    /**
     * Obtiene todos los pedidos que todavía están activos.
     *
     * Antes se utilizaba ->first(), por eso únicamente se
     * devolvía el pedido activo más reciente.
     */
    private function obtenerPedidosActivos(
        int $clienteId
    ): Collection {
        return Pedido::query()
            ->with([
                'detalles.producto',
            ])
            ->where(
                'cliente_id',
                $clienteId
            )
            ->whereIn(
                'estado_pedido',
                self::ESTADOS_ACTIVOS
            )
            ->latest('created_at')
            ->get();
    }

    /**
     * Obtiene los últimos diez pedidos que ya no están activos.
     */
    private function obtenerHistorialPedidos(
        int $clienteId
    ) {
        return Pedido::query()
            ->with([
                'detalles.producto',
            ])
            ->where(
                'cliente_id',
                $clienteId
            )
            ->whereNotIn(
                'estado_pedido',
                self::ESTADOS_ACTIVOS
            )
            ->latest('created_at')
            ->limit(10)
            ->get();
    }
}