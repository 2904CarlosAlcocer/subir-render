<?php

namespace App\Http\Controllers;

use App\Models\CajaMovimiento;
use App\Models\CajaSesion;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CajaController extends Controller
{
    private const MOTIVOS_DIFERENCIA = [
        'error_cambio',
        'retiro_no_registrado',
        'gasto_no_registrado',
        'error_cobro',
        'otro',
    ];

    public function actual(Request $request): JsonResponse
    {
        return response()->json(
            $this->construirEstadoActual($request->user())
        );
    }

    public function abrir(Request $request): JsonResponse
    {
        $usuario = $request->user();

        // 🔥 VALIDACIÓN: Solo administrador puede abrir
        if (!$usuario->esAdmin()) {
            return response()->json([
                'message' => 'No tienes permiso para abrir la caja. Solo los administradores pueden hacerlo.',
            ], 403);
        }

        $validated = $request->validate([
            'monto_inicial' => [
                'required',
                'numeric',
                'min:0',
                'max:10000000',
            ],
            'usuario_asignado_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'observaciones_apertura' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ], [
            'monto_inicial.required' => 'Debes indicar el fondo inicial de la caja.',
            'monto_inicial.numeric' => 'El fondo inicial debe ser un número válido.',
            'monto_inicial.min' => 'El fondo inicial no puede ser negativo.',
            'usuario_asignado_id.required' => 'Debes seleccionar un usuario para asignar la caja.',
            'usuario_asignado_id.exists' => 'El usuario seleccionado no existe.',
        ]);

        // 🔥 VALIDACIÓN: El usuario asignado debe ser Admin o Caja
        $usuarioAsignado = User::find($validated['usuario_asignado_id']);
        $rolAsignado = $usuarioAsignado->rolNormalizado();

        if (!in_array($rolAsignado, ['admin', 'caja'])) {
            throw ValidationException::withMessages([
                'usuario_asignado_id' => [
                    'El usuario seleccionado no tiene un rol válido para trabajar en caja (Administrador o Caja).',
                ],
            ]);
        }

        // 🔥 VALIDACIÓN: El usuario asignado debe estar activo
        if ($usuarioAsignado->estado !== 'activo') {
            throw ValidationException::withMessages([
                'usuario_asignado_id' => [
                    'El usuario seleccionado está inactivo.',
                ],
            ]);
        }

        DB::transaction(function () use ($usuario, $validated, $usuarioAsignado) {
            $abierta = CajaSesion::query()
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if ($abierta) {
                throw ValidationException::withMessages([
                    'caja' => [
                        'Ya existe una caja abierta. Debes cerrarla antes de iniciar otra.',
                    ],
                ]);
            }

            CajaSesion::create([
                'usuario_apertura_id' => $usuario->id,
                'usuario_asignado_id' => $validated['usuario_asignado_id'],
                'fecha_apertura' => now(),
                'monto_inicial' => round((float) $validated['monto_inicial'], 2),
                'observaciones_apertura' => trim((string) ($validated['observaciones_apertura'] ?? '')) ?: null,
                'estado' => 'abierta',
            ]);
        });

        return response()->json(
            array_merge(
                [
                    'message' => 'Caja abierta correctamente.',
                    'asignado_a' => $usuarioAsignado->name,
                ],
                $this->construirEstadoActual($usuario)
            ),
            201
        );
    }

    public function movimientos(Request $request): JsonResponse
    {
        $sesion = CajaSesion::query()
            ->where('estado', 'abierta')
            ->latest('fecha_apertura')
            ->first();

        if (!$sesion) {
            return response()->json([
                'data' => [],
            ]);
        }

        $this->autorizarSesion($request, $sesion);

        $movimientos = CajaMovimiento::query()
            ->with('usuario:id,name,email')
            ->where('caja_sesion_id', $sesion->id)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $movimientos,
        ]);
    }

    public function registrarMovimiento(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tipo' => [
                'required',
                Rule::in(['entrada', 'salida']),
            ],
            'monto' => [
                'required',
                'numeric',
                'min:1',
                'max:10000000',
            ],
            'motivo' => [
                'required',
                'string',
                'max:120',
            ],
            'observaciones' => [
                'nullable',
                'string',
                'max:500',
            ],
        ], [
            'tipo.required' => 'Debes indicar si el movimiento es una entrada o una salida.',
            'tipo.in' => 'El tipo de movimiento seleccionado no es válido.',
            'monto.required' => 'Debes indicar el monto del movimiento.',
            'monto.numeric' => 'El monto del movimiento debe ser un número válido.',
            'monto.min' => 'El movimiento debe ser de al menos ₡1.',
            'motivo.required' => 'Debes indicar el motivo del movimiento.',
        ]);

        $usuario = $request->user();
        $movimiento = null;

        DB::transaction(function () use ($request, $usuario, $validated, &$movimiento) {
            $sesion = CajaSesion::query()
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if (!$sesion) {
                throw ValidationException::withMessages([
                    'caja' => ['No hay una caja abierta para registrar movimientos.'],
                ]);
            }

            $this->autorizarSesion($request, $sesion);

            $monto = round((float) $validated['monto'], 2);

            if ($validated['tipo'] === 'salida') {
                $resumen = $this->calcularResumenSesion($sesion);

                if ($monto > $resumen['efectivo_esperado']) {
                    throw ValidationException::withMessages([
                        'monto' => [
                            'La salida supera el efectivo que debería existir actualmente en la gaveta.',
                        ],
                    ]);
                }
            }

            $movimiento = CajaMovimiento::create([
                'caja_sesion_id' => $sesion->id,
                'usuario_id' => $usuario->id,
                'tipo' => $validated['tipo'],
                'monto' => $monto,
                'motivo' => trim($validated['motivo']),
                'observaciones' => trim((string) ($validated['observaciones'] ?? '')) ?: null,
            ])->load('usuario:id,name,email');
        });

        return response()->json([
            'message' => 'Movimiento de caja registrado correctamente.',
            'movimiento' => $movimiento,
            'estado' => $this->construirEstadoActual($usuario),
        ], 201);
    }

    /**
     * Paso de arqueo ciego.
     *
     * El cajero primero cuenta el efectivo sin recibir el monto esperado.
     * Solo después de enviar el conteo, el backend devuelve la comparación.
     */
    public function arqueo(Request $request): JsonResponse
    {
        $usuario = $request->user();

        // 🔥 VALIDACIÓN: Solo administrador puede hacer arqueo
        if (!$usuario->esAdmin()) {
            return response()->json([
                'message' => 'No tienes permiso para realizar el arqueo. Solo los administradores pueden hacerlo.',
            ], 403);
        }

        $validated = $request->validate([
            'efectivo_contado' => [
                'required',
                'numeric',
                'min:0',
                'max:100000000',
            ],
        ], [
            'efectivo_contado.required' => 'Debes indicar cuánto efectivo contaste físicamente.',
            'efectivo_contado.numeric' => 'El efectivo contado debe ser un número válido.',
            'efectivo_contado.min' => 'El efectivo contado no puede ser negativo.',
        ]);

        $sesion = CajaSesion::query()
            ->where('estado', 'abierta')
            ->first();

        if (!$sesion) {
            throw ValidationException::withMessages([
                'caja' => ['No hay una caja abierta para realizar el arqueo.'],
            ]);
        }

        $this->autorizarSesion($request, $sesion);

        $resumen = $this->calcularResumenSesion($sesion);
        $efectivoContado = round((float) $validated['efectivo_contado'], 2);
        $diferencia = round($efectivoContado - $resumen['efectivo_esperado'], 2);

        return response()->json([
            'sesion_id' => $sesion->id,
            'efectivo_esperado' => $resumen['efectivo_esperado'],
            'efectivo_contado' => $efectivoContado,
            'diferencia' => $diferencia,
            'resultado' => $this->resultadoArqueo($diferencia),
            'resumen' => $resumen,
        ]);
    }

    public function cerrar(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if (!$usuario->esAdmin()) {
            return response()->json([
                'message' => 'No tienes permiso para cerrar la caja. Solo los administradores pueden hacerlo.',
            ], 403);
        }

        $validated = $request->validate([
            'efectivo_contado' => [
                'required',
                'numeric',
                'min:0',
                'max:100000000',
            ],
            'efectivo_esperado_previsualizado' => [
                'required',
                'numeric',
                'min:0',
            ],
            'observaciones' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ], [
            'efectivo_contado.required' => 'Debes indicar cuánto efectivo contaste físicamente.',
            'efectivo_contado.numeric' => 'El efectivo contado debe ser un número válido.',
            'efectivo_contado.min' => 'El efectivo contado no puede ser negativo.',
            'efectivo_esperado_previsualizado.required' => 'Debes realizar el arqueo antes de confirmar el cierre.',
        ]);

        $sesion = null;
        $resumenCierre = null;

        DB::transaction(function () use (
            $request,
            $usuario,
            $validated,
            &$sesion,
            &$resumenCierre
        ) {
            $sesion = CajaSesion::query()
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if (!$sesion) {
                throw ValidationException::withMessages([
                    'caja' => ['No hay una caja abierta para cerrar.'],
                ]);
            }

            $this->autorizarSesion($request, $sesion);

            $resumen = $this->calcularResumenSesion($sesion);

            $esperadoPrevisualizado = round(
                (float) $validated['efectivo_esperado_previsualizado'],
                2
            );

            if (
                abs(
                    $esperadoPrevisualizado -
                    $resumen['efectivo_esperado']
                ) > 0.009
            ) {
                abort(
                    409,
                    'La caja cambió después del arqueo. Repite el conteo antes de confirmar el cierre.'
                );
            }

            $efectivoContado = round(
                (float) $validated['efectivo_contado'],
                2
            );

            $diferencia = round(
                $efectivoContado -
                $resumen['efectivo_esperado'],
                2
            );

            /*
             * El resultado del arqueo NO lo decide el frontend.
             * El backend lo calcula nuevamente usando la diferencia real.
             */
            $resultadoArqueo =
                $this->resultadoArqueo($diferencia);

            /*
             * Si existe faltante o sobrante, la observación es obligatoria.
             * Cuando la caja está completa, la observación es opcional.
             */
            if (
                in_array(
                    $resultadoArqueo,
                    ['faltante', 'sobrante'],
                    true
                ) &&
                empty(
                    trim(
                        (string) (
                            $validated['observaciones'] ?? ''
                        )
                    )
                )
            ) {
                throw ValidationException::withMessages([
                    'observaciones' => [
                        'Debes agregar una observación cuando exista un faltante o sobrante.',
                    ],
                ]);
            }

            $sesion->update([
                'usuario_cierre_id' => $usuario->id,
                'fecha_cierre' => now(),
                'ventas_efectivo' => $resumen['efectivo'],
                'ventas_sinpe' => $resumen['sinpe'],
                'ventas_tarjeta' => $resumen['tarjeta'],
                'total_ventas' => $resumen['total_ventas'],
                'cantidad_pedidos' => $resumen['cantidad_pedidos'],
                'entradas_efectivo' => $resumen['entradas_efectivo'],
                'salidas_efectivo' => $resumen['salidas_efectivo'],
                'efectivo_esperado' => $resumen['efectivo_esperado'],
                'efectivo_contado' => $efectivoContado,
                'diferencia' => $diferencia,
                'resultado_arqueo' => $resultadoArqueo,
                'estado' => 'cerrada',
                'observaciones' =>
                    trim(
                        (string) (
                            $validated['observaciones'] ?? ''
                        )
                    ) ?: null,
            ]);

            $sesion = $sesion->fresh([
                'usuarioApertura:id,name,email',
                'usuarioAsignado:id,name,email',
                'usuarioCierre:id,name,email',
            ]);

            $resumenCierre = array_merge(
                $resumen,
                [
                    'efectivo_contado' =>
                        $efectivoContado,
                    'diferencia' =>
                        $diferencia,
                    'resultado_arqueo' =>
                        $resultadoArqueo,
                ]
            );
        });

        return response()->json([
            'message' => 'Caja cerrada correctamente.',
            'sesion' => $sesion,
            'resumen' => $resumenCierre,
        ]);
    }

    public function historial(Request $request): JsonResponse
    {
        $limite = max(
            1,
            min(
                100,
                (int) $request->input('limit', 30)
            )
        );

        $sesiones = CajaSesion::query()
            ->with([
                'usuarioApertura:id,name,email',
                'usuarioAsignado:id,name,email',
                'usuarioCierre:id,name,email',
            ])
            ->orderByDesc('fecha_apertura')
            ->limit($limite)
            ->get()
            ->map(function (CajaSesion $sesion) {
                if ($sesion->estaAbierta()) {
                    $resumen = $this->calcularResumenSesion(
                        $sesion
                    );
                } else {
                    $resumen = [
                        'monto_inicial' =>
                            (float) $sesion->monto_inicial,
                        'efectivo' =>
                            (float) $sesion->ventas_efectivo,
                        'sinpe' =>
                            (float) $sesion->ventas_sinpe,
                        'tarjeta' =>
                            (float) $sesion->ventas_tarjeta,
                        'total_ventas' =>
                            (float) $sesion->total_ventas,
                        'cantidad_pedidos' =>
                            (int) $sesion->cantidad_pedidos,
                        'entradas_efectivo' =>
                            (float) $sesion->entradas_efectivo,
                        'salidas_efectivo' =>
                            (float) $sesion->salidas_efectivo,
                        'efectivo_esperado' =>
                            (float) $sesion->efectivo_esperado,
                        'efectivo_contado' =>
                            $sesion->efectivo_contado !== null
                                ? (float) $sesion->efectivo_contado
                                : null,
                        'diferencia' =>
                            $sesion->diferencia !== null
                                ? (float) $sesion->diferencia
                                : null,
                        'resultado_arqueo' =>
                            $sesion->resultado_arqueo ?? 'pendiente',
                        'motivo_diferencia' =>
                            $sesion->motivo_diferencia,
                        'detalle_diferencia' =>
                            $sesion->detalle_diferencia,
                    ];
                }

                $movimientos = CajaMovimiento::query()
                    ->with('usuario:id,name,email')
                    ->where('caja_sesion_id', $sesion->id)
                    ->orderBy('created_at')
                    ->get();

                return [
                    'sesion' => $sesion,
                    'resumen' => $resumen,
                    'movimientos' => $movimientos,
                ];
            });

        return response()->json([
            'data' => $sesiones,
            'resumen_hoy' => $this->calcularResumenPeriodo(
                now()->copy()->startOfDay(),
                now()
            ),
        ]);
    }

    private function construirEstadoActual(?User $usuario = null): array
    {
        $sesion = CajaSesion::query()
            ->with([
                'usuarioApertura:id,name,email',
                'usuarioAsignado:id,name,email',
                'usuarioCierre:id,name,email',
            ])
            ->where('estado', 'abierta')
            ->latest('fecha_apertura')
            ->first();

        $puedeOperar = false;

        if ($sesion && $usuario) {
            $puedeOperar = $sesion->usuarioPuedeOperar($usuario);
        }

        return [
            'abierta' => $sesion !== null,
            'sesion' => $sesion,
            'puede_operar' => $puedeOperar,
            'resumen' => $sesion
                ? $this->calcularResumenSesion($sesion)
                : $this->resumenVacio(0),
            'resumen_hoy' => $this->calcularResumenPeriodo(
                now()->copy()->startOfDay(),
                now()
            ),
        ];
    }

    private function calcularResumenSesion(
        CajaSesion $sesion
    ): array {
        $query = $this->consultaVentasBase()
            ->where(
                'pedidos.caja_sesion_id',
                $sesion->id
            )
            ->where(
                'pagos_pedidos.estado_pago',
                'pagado'
            );

        $movimientos = CajaMovimiento::query()
            ->where('caja_sesion_id', $sesion->id)
            ->selectRaw(
                "tipo, COALESCE(SUM(monto), 0) AS total"
            )
            ->groupBy('tipo')
            ->pluck('total', 'tipo');

        $entradas = round(
            (float) ($movimientos['entrada'] ?? 0),
            2
        );

        $salidas = round(
            (float) ($movimientos['salida'] ?? 0),
            2
        );

        return $this->calcularResumenDesdeQuery(
            $query,
            (float) $sesion->monto_inicial,
            $entradas,
            $salidas
        );
    }

    private function calcularResumenPeriodo(
        $inicio,
        $fin
    ): array {
        $query = $this->consultaVentasBase()
            ->whereBetween(
                DB::raw(
                    'COALESCE(pagos_pedidos.fecha_pago, pedidos.created_at)'
                ),
                [$inicio, $fin]
            )
            ->where(
                'pagos_pedidos.estado_pago',
                'pagado'
            );

        return $this->calcularResumenDesdeQuery(
            $query,
            0,
            0,
            0
        );
    }

    private function consultaVentasBase()
    {
        return Pedido::query()
            ->join(
                'pagos_pedidos',
                'pagos_pedidos.pedido_id',
                '=',
                'pedidos.id'
            );
    }

    private function calcularResumenDesdeQuery(
        $query,
        float $montoInicial,
        float $entradas,
        float $salidas
    ): array {
        $porMetodo = (clone $query)
            ->selectRaw(
                'pagos_pedidos.metodo_pago AS metodo_pago, COALESCE(SUM(pedidos.total), 0) AS total'
            )
            ->groupBy('pagos_pedidos.metodo_pago')
            ->pluck('total', 'metodo_pago');

        $efectivo = round(
            (float) ($porMetodo['efectivo'] ?? 0),
            2
        );

        $sinpe = round(
            (float) ($porMetodo['sinpe'] ?? 0),
            2
        );

        $tarjeta = round(
            (float) ($porMetodo['tarjeta'] ?? 0),
            2
        );

        $cantidadPedidos = (clone $query)
            ->distinct()
            ->count('pedidos.id');

        $totalVentas = round(
            $efectivo + $sinpe + $tarjeta,
            2
        );

        $efectivoEsperado = round(
            $montoInicial
            + $efectivo
            + $entradas
            - $salidas,
            2
        );

        return [
            'monto_inicial' => round(
                $montoInicial,
                2
            ),
            'efectivo' => $efectivo,
            'sinpe' => $sinpe,
            'tarjeta' => $tarjeta,
            'total_ventas' => $totalVentas,
            'cantidad_pedidos' => $cantidadPedidos,
            'entradas_efectivo' => round($entradas, 2),
            'salidas_efectivo' => round($salidas, 2),
            'efectivo_esperado' => $efectivoEsperado,
        ];
    }

    private function resumenVacio(
        float $montoInicial
    ): array {
        return [
            'monto_inicial' => $montoInicial,
            'efectivo' => 0,
            'sinpe' => 0,
            'tarjeta' => 0,
            'total_ventas' => 0,
            'cantidad_pedidos' => 0,
            'entradas_efectivo' => 0,
            'salidas_efectivo' => 0,
            'efectivo_esperado' => $montoInicial,
        ];
    }

    private function autorizarSesion(
        Request $request,
        CajaSesion $sesion
    ): void {
        $usuario = $request->user();
        $rol = $usuario->rolNormalizado();

        // Administrador siempre puede operar
        if ($rol === 'admin') {
            return;
        }

        // Caja solo puede operar si está asignado
        if ($rol === 'caja') {
            if ((int) $sesion->usuario_asignado_id !== (int) $usuario->id) {
                abort(
                    403,
                    'Esta caja está asignada a otro usuario. No tienes permiso para operarla.'
                );
            }
            return;
        }

        abort(
            403,
            'No tienes permiso para operar esta caja.'
        );
    }

    private function resultadoArqueo(
        float $diferencia
    ): string {
        if (abs($diferencia) < 0.01) {
            return 'completo';
        }

        return $diferencia < 0
            ? 'faltante'
            : 'sobrante';
    }
}