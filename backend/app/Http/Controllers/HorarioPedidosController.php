<?php

namespace App\Http\Controllers;

use App\Services\HorarioPedidosService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class HorarioPedidosController extends Controller
{
    public function estado(HorarioPedidosService $servicio)
    {
        return response()->json(
            $servicio->estadoActual()
        );
    }

    public function index(HorarioPedidosService $servicio)
    {
        return response()->json(
            $servicio->configuracionCompleta()
        );
    }

    public function actualizarSemanal(
        Request $request,
        HorarioPedidosService $servicio
    ) {
        $validated = $request->validate([
            'horarios' => ['required', 'array', 'size:7'],
            'horarios.*.dia_semana' => ['required', 'integer', 'between:0,6', 'distinct'],
            'horarios.*.nombre_dia' => ['required', 'string', 'max:20'],
            'horarios.*.hora_apertura' => ['required', 'date_format:H:i'],
            'horarios.*.hora_ultimo_pedido' => ['required', 'date_format:H:i'],
            'horarios.*.hora_cierre' => ['required', 'date_format:H:i'],
            'horarios.*.activo' => ['required', 'boolean'],
        ]);

        $validator = Validator::make([], []);

        $validator->after(function ($validator) use ($validated) {
            foreach ($validated['horarios'] as $indice => $horario) {
                if (!$horario['activo']) {
                    continue;
                }

                $apertura = Carbon::createFromFormat('H:i', $horario['hora_apertura']);
                $ultimoPedido = Carbon::createFromFormat('H:i', $horario['hora_ultimo_pedido']);
                $cierre = Carbon::createFromFormat('H:i', $horario['hora_cierre']);

                if (!$ultimoPedido->greaterThan($apertura)) {
                    $validator->errors()->add(
                        "horarios.$indice.hora_ultimo_pedido",
                        'La hora del último pedido debe ser posterior a la apertura.'
                    );
                }

                if (!$cierre->greaterThan($ultimoPedido)) {
                    $validator->errors()->add(
                        "horarios.$indice.hora_cierre",
                        'La hora de cierre debe ser posterior al último pedido.'
                    );
                }
            }
        });

        $validator->validate();

        $servicio->actualizarHorariosSemanales($validated['horarios']);

        return response()->json([
            'message' => 'Horario semanal actualizado correctamente.',
            'data' => $servicio->configuracionCompleta(),
        ]);
    }

    public function extenderHoy(
        Request $request,
        HorarioPedidosService $servicio
    ) {
        $validated = $request->validate([
            'minutos' => [
                'nullable',
                'integer',
                Rule::in([15, 30, 60]),
                'required_without:hora',
            ],
            'hora' => [
                'nullable',
                'date_format:H:i',
                'required_without:minutos',
            ],
        ]);

        try {
            $servicio->extenderHoy(
                $validated['minutos'] ?? null,
                $validated['hora'] ?? null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'El horario de hoy se extendió correctamente.',
            'data' => $servicio->configuracionCompleta(),
        ]);
    }

    public function pausar(
        Request $request,
        HorarioPedidosService $servicio
    ) {
        $validated = $request->validate([
            'motivo' => ['nullable', 'string', 'max:255'],
        ]);

        $servicio->pausarHoy(
            $validated['motivo'] ?? null,
            $request->user()?->id,
        );

        return response()->json([
            'message' => 'Los pedidos fueron pausados temporalmente.',
            'data' => $servicio->configuracionCompleta(),
        ]);
    }

    public function reanudar(
        Request $request,
        HorarioPedidosService $servicio
    ) {
        $servicio->reanudarHoy($request->user()?->id);

        return response()->json([
            'message' => 'La recepción de pedidos fue reanudada.',
            'data' => $servicio->configuracionCompleta(),
        ]);
    }

    public function cancelarExtension(
        Request $request,
        HorarioPedidosService $servicio
    ) {
        $servicio->cancelarExtensionHoy($request->user()?->id);

        return response()->json([
            'message' => 'La extensión de hoy fue cancelada.',
            'data' => $servicio->configuracionCompleta(),
        ]);
    }
}
