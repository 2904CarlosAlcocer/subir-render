<?php

namespace App\Http\Controllers;

use App\Models\MensajeContacto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MensajeContactoController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GUARDAR MENSAJE PÚBLICO
    |--------------------------------------------------------------------------
    |
    | Este método se utiliza desde el formulario público de contacto.
    | No requiere que el cliente haya iniciado sesión.
    |
    */

    public function store(
        Request $request
    ): JsonResponse {
        $datos = $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'min:2',
                    'max:120',
                ],

                'telefono' => [
                    'required',
                    'string',
                    'min:8',
                    'max:30',
                    'regex:/^[0-9+\-\s()]+$/',

                    /*
                     * Verifica la cantidad real de números,
                     * ignorando espacios, guiones y paréntesis.
                     */
                    function (
                        string $attribute,
                        mixed $value,
                        \Closure $fail
                    ): void {
                        $digitos = preg_replace(
                            '/\D+/',
                            '',
                            (string) $value
                        );

                        $cantidadDigitos = strlen(
                            (string) $digitos
                        );

                        if (
                            $cantidadDigitos < 8 ||
                            $cantidadDigitos > 15
                        ) {
                            $fail(
                                'El teléfono debe contener entre 8 y 15 números.'
                            );
                        }
                    },
                ],

                'correo' => [
                    'nullable',
                    'string',
                    'email',
                    'max:150',
                ],

                'asunto' => [
                    'nullable',
                    'string',
                    'min:3',
                    'max:120',
                ],

                'mensaje' => [
                    'required',
                    'string',
                    'min:10',
                    'max:3000',
                ],
            ],
            [
                'nombre.required' =>
                    'El nombre es obligatorio.',

                'nombre.string' =>
                    'El nombre debe ser texto.',

                'nombre.min' =>
                    'El nombre debe tener al menos 2 caracteres.',

                'nombre.max' =>
                    'El nombre no puede superar los 120 caracteres.',

                'telefono.required' =>
                    'El teléfono es obligatorio.',

                'telefono.string' =>
                    'El teléfono no tiene un formato válido.',

                'telefono.min' =>
                    'El teléfono debe contener al menos 8 caracteres.',

                'telefono.max' =>
                    'El teléfono no puede superar los 30 caracteres.',

                'telefono.regex' =>
                    'El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +.',

                'correo.string' =>
                    'El correo electrónico debe ser texto.',

                'correo.email' =>
                    'Debes ingresar un correo electrónico válido.',

                'correo.max' =>
                    'El correo electrónico no puede superar los 150 caracteres.',

                'asunto.string' =>
                    'El asunto debe ser texto.',

                'asunto.min' =>
                    'El asunto debe tener al menos 3 caracteres.',

                'asunto.max' =>
                    'El asunto no puede superar los 120 caracteres.',

                'mensaje.required' =>
                    'El mensaje es obligatorio.',

                'mensaje.string' =>
                    'El mensaje debe ser texto.',

                'mensaje.min' =>
                    'El mensaje debe tener al menos 10 caracteres.',

                'mensaje.max' =>
                    'El mensaje no puede superar los 3000 caracteres.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR INFORMACIÓN
        |--------------------------------------------------------------------------
        */

        $nombre = Str::squish(
            $datos['nombre']
        );

        $telefono = preg_replace(
            '/\s+/',
            ' ',
            trim($datos['telefono'])
        );

        $correo = !empty($datos['correo'])
            ? Str::lower(
                trim($datos['correo'])
            )
            : null;

        $asunto = !empty($datos['asunto'])
            ? Str::squish(
                $datos['asunto']
            )
            : 'Consulta general';

        $mensajeTexto = trim(
            $datos['mensaje']
        );

        /*
        |--------------------------------------------------------------------------
        | EVITAR ENVÍOS DUPLICADOS
        |--------------------------------------------------------------------------
        |
        | Impide que un doble clic o una conexión lenta guarden exactamente
        | el mismo mensaje más de una vez durante un periodo corto.
        |
        */

        $mensajeDuplicado =
            MensajeContacto::query()
                ->where(
                    'telefono',
                    $telefono
                )
                ->where(
                    'mensaje',
                    $mensajeTexto
                )
                ->where(
                    'created_at',
                    '>=',
                    Carbon::now()
                        ->subSeconds(30)
                )
                ->exists();

        if ($mensajeDuplicado) {
            return response()->json(
                [
                    'message' =>
                        'Este mensaje ya fue enviado. Espera unos segundos antes de intentarlo nuevamente.',
                ],
                429
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREAR MENSAJE
        |--------------------------------------------------------------------------
        */

        $mensajeContacto =
            MensajeContacto::create([
                'nombre' =>
                    $nombre,

                'telefono' =>
                    $telefono,

                'correo' =>
                    $correo,

                'asunto' =>
                    $asunto,

                'mensaje' =>
                    $mensajeTexto,

                'estado' =>
                    MensajeContacto::ESTADO_NUEVO,

                'ip_address' =>
                    $request->ip(),

                'user_agent' =>
                    $request->userAgent()
                        ? mb_substr(
                            $request->userAgent(),
                            0,
                            1000
                        )
                        : null,
            ]);

        return response()->json(
            [
                'message' =>
                    'Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo lo antes posible.',

                'mensaje_contacto' => [
                    'id' =>
                        $mensajeContacto->id,

                    'estado' =>
                        $mensajeContacto->estado,

                    'created_at' =>
                        $mensajeContacto->created_at,
                ],
            ],
            201
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LISTAR MENSAJES PARA ADMINISTRACIÓN
    |--------------------------------------------------------------------------
    |
    | Permite buscar, filtrar, ordenar y paginar los mensajes.
    |
    */

    public function index(
        Request $request
    ): JsonResponse {
        $filtros = $request->validate(
            [
                'estado' => [
                    'nullable',
                    'string',

                    Rule::in(
                        MensajeContacto::ESTADOS
                    ),
                ],

                'buscar' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'orden' => [
                    'nullable',
                    'string',

                    Rule::in([
                        'reciente',
                        'antiguo',
                    ]),
                ],

                'por_pagina' => [
                    'nullable',
                    'integer',
                    'min:5',
                    'max:50',
                ],
            ],
            [
                'estado.in' =>
                    'El estado seleccionado no es válido.',

                'buscar.string' =>
                    'La búsqueda debe ser texto.',

                'buscar.max' =>
                    'La búsqueda no puede superar los 100 caracteres.',

                'orden.in' =>
                    'El orden seleccionado no es válido.',

                'por_pagina.integer' =>
                    'La cantidad por página debe ser un número entero.',

                'por_pagina.min' =>
                    'La cantidad mínima por página es 5.',

                'por_pagina.max' =>
                    'La cantidad máxima por página es 50.',
            ]
        );

        $query = MensajeContacto::query()
            ->with([
                'atendidoPor:id,name,email',
            ]);

        /*
        |--------------------------------------------------------------------------
        | FILTRAR POR ESTADO
        |--------------------------------------------------------------------------
        */

        if (!empty($filtros['estado'])) {
            $query->where(
                'estado',
                $filtros['estado']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | BUSCAR
        |--------------------------------------------------------------------------
        */

        if (!empty($filtros['buscar'])) {
            $buscar = trim(
                $filtros['buscar']
            );

            $query->where(
                function ($consulta) use (
                    $buscar
                ): void {
                    $consulta
                        ->where(
                            'nombre',
                            'like',
                            "%{$buscar}%"
                        )
                        ->orWhere(
                            'telefono',
                            'like',
                            "%{$buscar}%"
                        )
                        ->orWhere(
                            'correo',
                            'like',
                            "%{$buscar}%"
                        )
                        ->orWhere(
                            'asunto',
                            'like',
                            "%{$buscar}%"
                        )
                        ->orWhere(
                            'mensaje',
                            'like',
                            "%{$buscar}%"
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ORDENAR
        |--------------------------------------------------------------------------
        */

        $orden = $filtros['orden']
            ?? 'reciente';

        if ($orden === 'antiguo') {
            $query->orderBy(
                'created_at',
                'asc'
            );
        } else {
            $query->orderBy(
                'created_at',
                'desc'
            );
        }

        $porPagina = (int) (
            $filtros['por_pagina']
            ?? 15
        );

        $mensajes = $query->paginate(
            $porPagina
        );

        return response()->json(
            $mensajes
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RESUMEN PARA CONTADOR Y NOTIFICACIONES
    |--------------------------------------------------------------------------
    |
    | Esta ruta será consultada automáticamente por el Dashboard.
    | Utiliza una sola consulta para contar todos los estados.
    |
    */

    public function resumen(): JsonResponse
    {
        $resumen =
            MensajeContacto::query()
                ->selectRaw(
                    'COUNT(*) AS total'
                )
                ->selectRaw(
                    'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) AS nuevos',
                    [
                        MensajeContacto::ESTADO_NUEVO,
                    ]
                )
                ->selectRaw(
                    'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) AS leidos',
                    [
                        MensajeContacto::ESTADO_LEIDO,
                    ]
                )
                ->selectRaw(
                    'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) AS atendidos',
                    [
                        MensajeContacto::ESTADO_ATENDIDO,
                    ]
                )
                ->selectRaw(
                    'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) AS archivados',
                    [
                        MensajeContacto::ESTADO_ARCHIVADO,
                    ]
                )
                ->selectRaw(
                    'MAX(id) AS ultimo_mensaje_id'
                )
                ->first();

        $ultimoNuevo =
            MensajeContacto::query()
                ->where(
                    'estado',
                    MensajeContacto::ESTADO_NUEVO
                )
                ->latest('created_at')
                ->first([
                    'id',
                    'nombre',
                    'telefono',
                    'asunto',
                    'mensaje',
                    'created_at',
                ]);

        return response()->json([
            'total' =>
                (int) ($resumen->total ?? 0),

            'nuevos' =>
                (int) ($resumen->nuevos ?? 0),

            'leidos' =>
                (int) ($resumen->leidos ?? 0),

            'atendidos' =>
                (int) ($resumen->atendidos ?? 0),

            'archivados' =>
                (int) ($resumen->archivados ?? 0),

            'ultimo_mensaje_id' =>
                $resumen->ultimo_mensaje_id
                    ? (int) $resumen
                        ->ultimo_mensaje_id
                    : null,

            'ultimo_nuevo' =>
                $ultimoNuevo,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MOSTRAR UN MENSAJE
    |--------------------------------------------------------------------------
    |
    | Al abrir un mensaje nuevo, automáticamente pasa a estado leído.
    |
    */

    public function show(
        MensajeContacto $mensaje
    ): JsonResponse {
        if ($mensaje->esNuevo()) {
            $mensaje->marcarComoLeido();
        }

        $mensaje->refresh();

        $mensaje->load([
            'atendidoPor:id,name,email',
        ]);

        return response()->json([
            'mensaje_contacto' =>
                $mensaje,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR ESTADO
    |--------------------------------------------------------------------------
    */

    public function updateEstado(
        Request $request,
        MensajeContacto $mensaje
    ): JsonResponse {
        $datos = $request->validate(
            [
                'estado' => [
                    'required',
                    'string',

                    Rule::in(
                        MensajeContacto::ESTADOS
                    ),
                ],
            ],
            [
                'estado.required' =>
                    'Debes seleccionar un estado.',

                'estado.string' =>
                    'El estado debe ser texto.',

                'estado.in' =>
                    'El estado seleccionado no es válido.',
            ]
        );

        $nuevoEstado =
            $datos['estado'];

        $usuario =
            $request->user();

        switch ($nuevoEstado) {
            case MensajeContacto::ESTADO_NUEVO:
                /*
                 * Reabrir completamente el mensaje.
                 */
                $mensaje->forceFill([
                    'estado' =>
                        MensajeContacto::ESTADO_NUEVO,

                    'leido_at' =>
                        null,

                    'atendido_at' =>
                        null,

                    'archivado_at' =>
                        null,

                    'atendido_por_user_id' =>
                        null,
                ])->save();

                break;

            case MensajeContacto::ESTADO_LEIDO:
                /*
                 * Devolver el mensaje a pendientes de atención.
                 */
                $mensaje->forceFill([
                    'estado' =>
                        MensajeContacto::ESTADO_LEIDO,

                    'leido_at' =>
                        $mensaje->leido_at
                        ?? Carbon::now(),

                    'atendido_at' =>
                        null,

                    'archivado_at' =>
                        null,

                    'atendido_por_user_id' =>
                        null,
                ])->save();

                break;

            case MensajeContacto::ESTADO_ATENDIDO:
                $mensaje->marcarComoAtendido(
                    $usuario
                );

                break;

            case MensajeContacto::ESTADO_ARCHIVADO:
                $mensaje->archivar();

                break;
        }

        $mensaje->refresh();

        $mensaje->load([
            'atendidoPor:id,name,email',
        ]);

        return response()->json([
            'message' =>
                'El estado del mensaje fue actualizado correctamente.',

            'mensaje_contacto' =>
                $mensaje,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RESTAURAR MENSAJE ARCHIVADO
    |--------------------------------------------------------------------------
    */

    public function restaurar(
        MensajeContacto $mensaje
    ): JsonResponse {
        if (!$mensaje->estaArchivado()) {
            return response()->json(
                [
                    'message' =>
                        'El mensaje seleccionado no está archivado.',
                ],
                422
            );
        }

        $mensaje->restaurar();

        $mensaje->refresh();

        $mensaje->load([
            'atendidoPor:id,name,email',
        ]);

        return response()->json([
            'message' =>
                'El mensaje fue restaurado correctamente.',

            'mensaje_contacto' =>
                $mensaje,
        ]);
    }
}