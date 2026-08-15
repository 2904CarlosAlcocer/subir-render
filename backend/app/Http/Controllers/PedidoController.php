<?php

namespace App\Http\Controllers;

use App\Jobs\EnviarNotificacionNtfyJob;
use App\Models\Acompanamiento;
use App\Models\CajaSesion;
use App\Models\Ingrediente;
use App\Models\OpcionPasta;
use App\Models\PagoPedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Services\HorarioPedidosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PedidoController extends Controller
{
    private const COSTO_EMPAQUE_RETIRO = 500.00;

    public function index(Request $request)
    {
        $query = Pedido::with(
            'detalles.producto',
            'cliente',
            'pago'
        )->orderBy('created_at', 'desc');

        if ($request->has('estado')) {
            $query->where('estado_pedido', $request->estado);
        }

        return response()->json($query->get());
    }

    public function store(Request $request, HorarioPedidosService $horarioPedidos)
    {
        $estadoHorario = $horarioPedidos->estadoActual();

        if (!$estadoHorario['acepta_pedidos']) {
            return response()->json([
                'message' => $estadoHorario['mensaje'],
                'codigo' => 'PEDIDOS_CERRADOS',
                'horario' => $estadoHorario,
            ], 422);
        }

        $usuario = auth('sanctum')->user();
        $rol = $usuario ? $usuario->rolNormalizado() : null;

        if ($usuario && !in_array($rol, ['admin', 'caja', 'cliente'], true)) {
            return response()->json([
                'message' => 'No tienes permiso para crear pedidos.',
            ], 403);
        }

        $validated = $request->validate([
            'cliente_id' => [
                'nullable',
                'integer',
                'exists:clientes,id',
            ],
            'modalidad_entrega' => [
                'required',
                Rule::in(['consumo_local', 'retiro']),
            ],
            'metodo_pago' => [
                'nullable',
                Rule::in(['sinpe', 'efectivo', 'tarjeta']),
            ],
            'productos' => [
                'required',
                'json',
            ],
            'comprobante' => [
                'nullable',
                'file',
                'max:5120',
                'mimes:pdf,jpg,jpeg,png,gif',
            ],
        ]);

        if ($usuario && $rol === 'cliente') {
            $cliente = $usuario->cliente()->first();

            if (!$cliente) {
                throw ValidationException::withMessages([
                    'cliente_id' => ['Tu cuenta no tiene un perfil de cliente asociado.'],
                ]);
            }

            $clienteId = $cliente->id;
            $canal = 'web';
            $creadoPorUserId = $usuario->id;
        } else {
            if (empty($validated['cliente_id'])) {
                throw ValidationException::withMessages([
                    'cliente_id' => ['Debes seleccionar un cliente para crear el pedido.'],
                ]);
            }

            $clienteId = (int) $validated['cliente_id'];
            $canal = $usuario ? 'caja' : 'web';
            $creadoPorUserId = $usuario?->id;
        }

        $productos = json_decode($validated['productos'], true);

        $validatorProductos = Validator::make(
            ['productos' => $productos],
            [
                'productos' => ['required', 'array', 'min:1'],
                'productos.*' => ['required', 'array'],
                'productos.*.producto_id' => [
                    'required',
                    'integer',
                    Rule::exists('productos', 'id')->where(fn($query) => $query->where('estado', 'disponible')),
                ],
                'productos.*.cantidad' => ['required', 'integer', 'min:1'],
                'productos.*.tamano_pizza' => ['nullable', 'string', Rule::in(['grande', 'personal'])],
                'productos.*.extras' => ['nullable', 'string', 'max:1000'],
                'productos.*.extras_ids' => ['nullable', 'array'],
                'productos.*.extras_ids.*' => ['integer', Rule::exists('ingredientes', 'id')->where(fn($query) => $query->where('estado', 'disponible'))],
                'productos.*.pasta' => ['nullable', 'array'],
                'productos.*.pasta.tipo_pasta_id' => ['nullable', 'integer'],
                'productos.*.pasta.proteina_ids' => ['nullable', 'array'],
                'productos.*.pasta.proteina_ids.*' => ['integer'],
                'productos.*.pasta.salsa_id' => ['nullable', 'integer'],
                'productos.*.pasta.ingrediente_ids' => ['nullable', 'array'],
                'productos.*.pasta.ingrediente_ids.*' => ['integer'],
                'productos.*.acompanamientos_ids' => ['nullable', 'array'],
                'productos.*.acompanamientos_ids.*' => ['integer'],
                'productos.*.observaciones' => ['nullable', 'string', 'max:2000'],
                'productos.*.alergias' => ['nullable', 'string', 'max:255'],
            ],
            [
                'productos.required' => 'Debes agregar al menos un producto.',
                'productos.array' => 'La lista de productos no tiene un formato válido.',
                'productos.min' => 'Debes agregar al menos un producto.',
                'productos.*.array' => 'Uno de los productos no tiene un formato válido.',
                'productos.*.producto_id.required' => 'El producto es obligatorio.',
                'productos.*.producto_id.integer' => 'El identificador del producto no es válido.',
                'productos.*.producto_id.exists' => 'El producto seleccionado no existe o no está disponible.',
                'productos.*.cantidad.required' => 'La cantidad es obligatoria.',
                'productos.*.cantidad.integer' => 'La cantidad debe ser un número entero.',
                'productos.*.cantidad.min' => 'La cantidad debe ser mayor o igual a uno.',
                'productos.*.tamano_pizza.string' => 'El tamaño de la pizza no tiene un formato válido.',
                'productos.*.tamano_pizza.in' => 'El tamaño de pizza seleccionado no es válido.',
                'productos.*.extras.string' => 'Los extras deben enviarse como texto.',
                'productos.*.extras.max' => 'La descripción de los extras es demasiado larga.',
                'productos.*.extras_ids.array' => 'Los identificadores de los extras deben enviarse como una lista.',
                'productos.*.extras_ids.*.integer' => 'Uno de los extras seleccionados no tiene un identificador válido.',
                'productos.*.extras_ids.*.distinct' => 'No puedes seleccionar el mismo extra más de una vez.',
                'productos.*.extras_ids.*.exists' => 'Uno de los extras seleccionados no existe o no está disponible.',
                'productos.*.pasta.array' => 'La personalización de la pasta no tiene un formato válido.',
                'productos.*.pasta.tipo_pasta_id.integer' => 'El tipo de pasta seleccionado no es válido.',
                'productos.*.pasta.proteina_ids.array' => 'Las proteínas deben enviarse como una lista.',
                'productos.*.pasta.proteina_ids.*.integer' => 'Una de las proteínas seleccionadas no es válida.',
                'productos.*.pasta.proteina_ids.*.distinct' => 'No puedes seleccionar la misma proteína más de una vez.',
                'productos.*.pasta.salsa_id.integer' => 'La salsa seleccionada no es válida.',
                'productos.*.pasta.ingrediente_ids.array' => 'Los ingredientes de la pasta deben enviarse como una lista.',
                'productos.*.pasta.ingrediente_ids.*.integer' => 'Uno de los ingredientes de la pasta no es válido.',
                'productos.*.pasta.ingrediente_ids.*.distinct' => 'No puedes seleccionar el mismo ingrediente de pasta más de una vez.',
                'productos.*.acompanamientos_ids.array' => 'Los acompañamientos deben enviarse como una lista.',
                'productos.*.acompanamientos_ids.*.integer' => 'Uno de los acompañamientos seleccionados no es válido.',
                'productos.*.acompanamientos_ids.*.distinct' => 'No puedes seleccionar el mismo acompañamiento más de una vez.',
                'productos.*.observaciones.string' => 'Las observaciones deben enviarse como texto.',
                'productos.*.observaciones.max' => 'Las observaciones son demasiado largas.',
                'productos.*.alergias.string' => 'Las alergias deben enviarse como texto.',
                'productos.*.alergias.max' => 'La información de alergias es demasiado larga.',
            ]
        );

        $validatorProductos->validate();

        $pedido = DB::transaction(function () use ($validated, $productos, $request, $clienteId, $canal, $creadoPorUserId) {
            $total = 0;
            $detalles = [];

            foreach ($productos as $item) {
                $producto = Producto::query()
                    ->with('categoria')
                    ->where('id', $item['producto_id'])
                    ->where('estado', 'disponible')
                    ->lockForUpdate()
                    ->firstOrFail();

                $resultadoPersonalizacion = $this->resolverPersonalizacionProducto($producto, $item);

                $precioBase = (float) ($resultadoPersonalizacion['precio_base'] ?? $producto->precio);

                $precioUnitario = round($precioBase + $resultadoPersonalizacion['total_adicional'], 2);

                $cantidad = (int) $item['cantidad'];

                $subtotal = round($precioUnitario * $cantidad, 2);

                $total = round($total + $subtotal, 2);

                Log::info('Precio de línea calculado desde la base de datos.', [
                    'producto_id' => $producto->id,
                    'producto' => $producto->nombre,
                    'tipo_personalizacion' => $producto->tipo_personalizacion,
                    'tamano_pizza' => $resultadoPersonalizacion['personalizacion']['tamano_pizza'] ?? null,
                    'precio_base' => $precioBase,
                    'total_adicional' => $resultadoPersonalizacion['total_adicional'],
                    'precio_unitario' => $precioUnitario,
                    'cantidad' => $cantidad,
                    'subtotal' => $subtotal,
                ]);

                $detalles[] = [
                    'producto_id' => $producto->id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotal,
                    'extras' => $resultadoPersonalizacion['texto'],
                    'alergias' => $item['alergias'] ?? null,
                    'observaciones' => $item['observaciones'] ?? null,
                    'personalizacion' => $resultadoPersonalizacion['personalizacion'],
                ];
            }

            $costoEmpaque = $validated['modalidad_entrega'] === 'retiro' ? self::COSTO_EMPAQUE_RETIRO : 0.00;

            $total = round($total + $costoEmpaque, 2);

            $cajaSesion = CajaSesion::query()
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if ($canal === 'caja' && !$cajaSesion) {
                throw ValidationException::withMessages([
                    'caja' => ['Debes realizar la apertura de caja antes de registrar ventas desde el POS.'],
                ]);
            }

            $pedido = Pedido::create([
                'cliente_id' => $clienteId,
                'codigo_tracking' => 'RC-' . strtoupper(Str::random(6)),
                'modalidad_entrega' => $validated['modalidad_entrega'],
                'canal' => $canal,
                'creado_por_user_id' => $creadoPorUserId,
                'caja_sesion_id' => $cajaSesion?->id,
                'estado_pedido' => 'pendiente',
                'costo_empaque' => $costoEmpaque,
                'total' => $total,
            ]);

            $this->guardarPago($pedido->id, $validated['metodo_pago'] ?? null);

            if (isset($validated['metodo_pago']) && $validated['metodo_pago'] === 'sinpe' && $request->hasFile('comprobante')) {
                $this->guardarComprobanteEnDB($request->file('comprobante'), $pedido->id);
            }

            foreach ($detalles as $detalle) {
                $pedido->detalles()->create($detalle);
            }

            return $pedido;
        });

        $pedido->load('detalles.producto', 'cliente', 'creador', 'pago');

        EnviarNotificacionNtfyJob::dispatch($pedido->id)->afterCommit();

        return response()->json([
            'message' => 'Pedido creado correctamente',
            'pedido' => $pedido,
        ], 201);
    }

    private function resolverPersonalizacionProducto(Producto $producto, array $item): array
    {
        $tipo = $producto->tipo_personalizacion;
        $tamanoPizza = $item['tamano_pizza'] ?? null;

        if (!$producto->es_pizza && $tamanoPizza !== null && $tamanoPizza !== '') {
            throw ValidationException::withMessages([
                'productos' => ['El tamaño solamente puede seleccionarse en productos de la categoría Pizzas.'],
            ]);
        }

        if ($tipo === Producto::PERSONALIZACION_PASTA) {
            $this->rechazarExtrasDePizza($item, 'Las opciones de pizza no pueden utilizarse en una pasta personalizada.');
            $this->rechazarAcompanamientos($item, 'Los acompañamientos de carnes no pueden utilizarse en una pasta personalizada.');
            return $this->resolverPasta($item);
        }

        if ($tipo === Producto::PERSONALIZACION_ACOMPANAMIENTOS) {
            $this->rechazarExtrasDePizza($item, 'Los ingredientes extras de pizza no pueden utilizarse en este producto.');
            $this->rechazarPasta($item, 'Las opciones de pasta no pueden utilizarse en un producto de carnes.');
            return $this->resolverAcompanamientos($item);
        }

        if ($tipo !== null && $tipo !== '') {
            throw ValidationException::withMessages([
                'productos' => ['El producto tiene un tipo de personalización no reconocido.'],
            ]);
        }

        $this->rechazarPasta($item, 'Este producto no admite personalización de pasta.');
        $this->rechazarAcompanamientos($item, 'Este producto no admite acompañamientos seleccionables.');

        return $this->resolverExtrasActuales($producto, $item);
    }

    private function resolverExtrasActuales(Producto $producto, array $item): array
    {
        $ingredientesExtras = $this->resolverIngredientesExtras($item);

        $totalAdicional = round((float) $ingredientesExtras->sum(fn(Ingrediente $ingrediente) => (float) $ingrediente->precio_extra), 2);

        if (!$producto->es_pizza) {
            $texto = $ingredientesExtras->isNotEmpty() ? $ingredientesExtras->pluck('nombre')->implode(', ') : null;

            return [
                'precio_base' => (float) $producto->precio,
                'texto' => $texto,
                'total_adicional' => $totalAdicional,
                'personalizacion' => null,
            ];
        }

        $tamanoPizza = $item['tamano_pizza'] ?? 'grande';
        $tamanoPizza = strtolower(trim((string) $tamanoPizza));

        if ($tamanoPizza === '') {
            $tamanoPizza = 'grande';
        }

        if (!in_array($tamanoPizza, ['grande', 'personal'], true)) {
            throw ValidationException::withMessages([
                'productos' => ['El tamaño de pizza seleccionado no es válido.'],
            ]);
        }

        $precioBase = (float) $producto->precio;
        $tamanoTexto = 'Grande';

        if ($tamanoPizza === 'personal') {
            $precioPersonal = $producto->precio_personal;

            if ($precioPersonal === null || (float) $precioPersonal <= 0) {
                throw ValidationException::withMessages([
                    'productos' => ['La pizza seleccionada no cuenta con precio para tamaño personal.'],
                ]);
            }

            $precioBase = (float) $precioPersonal;
            $tamanoTexto = 'Personal';
        }

        $nombresExtras = $ingredientesExtras->pluck('nombre')->values();

        $partesTexto = ['Tamaño: ' . $tamanoTexto];

        if ($nombresExtras->isNotEmpty()) {
            $partesTexto[] = 'Extras: ' . $nombresExtras->implode(', ');
        }

        $extrasPersonalizacion = $ingredientesExtras->map(function (Ingrediente $ingrediente): array {
            return [
                'id' => (int) $ingrediente->id,
                'nombre' => $ingrediente->nombre,
                'precio_aplicado' => (float) $ingrediente->precio_extra,
            ];
        })->values()->all();

        return [
            'precio_base' => $precioBase,
            'texto' => implode(' | ', $partesTexto),
            'total_adicional' => $totalAdicional,
            'personalizacion' => [
                'tipo' => 'pizza',
                'tamano_pizza' => $tamanoPizza,
                'tamano_texto' => $tamanoTexto,
                'precio_base_aplicado' => $precioBase,
                'extras' => $extrasPersonalizacion,
                'total_adicional' => $totalAdicional,
            ],
        ];
    }

    private function resolverPasta(array $item): array
    {
        $pasta = $item['pasta'] ?? null;

        if (!is_array($pasta)) {
            throw ValidationException::withMessages([
                'productos' => ['Debes seleccionar la composición de la pasta.'],
            ]);
        }

        $tipoPastaId = $pasta['tipo_pasta_id'] ?? null;

        if (!is_int($tipoPastaId) && !ctype_digit((string) $tipoPastaId)) {
            throw ValidationException::withMessages([
                'productos' => ['Debes seleccionar un tipo de pasta válido.'],
            ]);
        }

        $tipoPasta = $this->resolverOpcionPastaUnica((int) $tipoPastaId, OpcionPasta::GRUPO_TIPO_PASTA, 'El tipo de pasta seleccionado no existe o está agotado.');

        $proteinas = $this->resolverOpcionesPastaMultiples($pasta['proteina_ids'] ?? [], OpcionPasta::GRUPO_PROTEINA, 'Una de las proteínas seleccionadas no existe o está agotada.');

        $salsa = null;
        $salsaId = $pasta['salsa_id'] ?? null;

        if ($salsaId !== null && $salsaId !== '') {
            $salsa = $this->resolverOpcionPastaUnica((int) $salsaId, OpcionPasta::GRUPO_SALSA, 'La salsa seleccionada no existe o está agotada.');
        }

        $ingredientes = $this->resolverOpcionesPastaMultiples($pasta['ingrediente_ids'] ?? [], OpcionPasta::GRUPO_INGREDIENTE, 'Uno de los ingredientes de la pasta no existe o está agotado.');

        $totalAdicional = round(
            (float) $tipoPasta->precio_extra
            + (float) $proteinas->sum(fn(OpcionPasta $opcion) => (float) $opcion->precio_extra)
            + ($salsa ? (float) $salsa->precio_extra : 0)
            + (float) $ingredientes->sum(fn(OpcionPasta $opcion) => (float) $opcion->precio_extra),
            2
        );

        $proteinasTexto = $proteinas->isNotEmpty() ? $proteinas->pluck('nombre')->implode(', ') : 'Sin proteína';
        $salsaTexto = $salsa ? $salsa->nombre : 'Sin salsa';
        $ingredientesTexto = $ingredientes->isNotEmpty() ? $ingredientes->pluck('nombre')->implode(', ') : 'Sin ingredientes adicionales';

        $texto = implode(' | ', [
            'Tipo de pasta: ' . $tipoPasta->nombre,
            'Proteínas: ' . $proteinasTexto,
            'Salsa: ' . $salsaTexto,
            'Ingredientes adicionales: ' . $ingredientesTexto,
        ]);

        return [
            'texto' => $texto,
            'total_adicional' => $totalAdicional,
            'personalizacion' => [
                'tipo' => Producto::PERSONALIZACION_PASTA,
                'tipo_pasta' => $this->datosOpcionPasta($tipoPasta),
                'proteinas' => $proteinas->map(fn(OpcionPasta $opcion) => $this->datosOpcionPasta($opcion))->values()->all(),
                'salsa' => $salsa ? $this->datosOpcionPasta($salsa) : null,
                'ingredientes' => $ingredientes->map(fn(OpcionPasta $opcion) => $this->datosOpcionPasta($opcion))->values()->all(),
                'total_adicional' => $totalAdicional,
            ],
        ];
    }

    private function resolverOpcionPastaUnica(int $id, string $grupo, string $mensajeError): OpcionPasta
    {
        $opcion = OpcionPasta::query()
            ->where('id', $id)
            ->where('grupo', $grupo)
            ->where('estado', OpcionPasta::ESTADO_DISPONIBLE)
            ->lockForUpdate()
            ->first();

        if (!$opcion) {
            throw ValidationException::withMessages([
                'productos' => [$mensajeError],
            ]);
        }

        return $opcion;
    }

    private function resolverOpcionesPastaMultiples(array $ids, string $grupo, string $mensajeError): Collection
    {
        $idsNormalizados = $this->normalizarIdsUnicos($ids, 'No puedes repetir una opción dentro de la pasta.');

        if ($idsNormalizados->isEmpty()) {
            return collect();
        }

        $opcionesPorId = OpcionPasta::query()
            ->whereIn('id', $idsNormalizados)
            ->where('grupo', $grupo)
            ->where('estado', OpcionPasta::ESTADO_DISPONIBLE)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($opcionesPorId->count() !== $idsNormalizados->count()) {
            throw ValidationException::withMessages([
                'productos' => [$mensajeError],
            ]);
        }

        return $idsNormalizados->map(fn($id) => $opcionesPorId->get($id));
    }

    private function datosOpcionPasta(OpcionPasta $opcion): array
    {
        return [
            'id' => $opcion->id,
            'grupo' => $opcion->grupo,
            'nombre' => $opcion->nombre,
            'precio_aplicado' => (float) $opcion->precio_extra,
        ];
    }

    private function resolverAcompanamientos(array $item): array
    {
        $ids = $this->normalizarIdsUnicos($item['acompanamientos_ids'] ?? [], 'No puedes seleccionar el mismo acompañamiento más de una vez.');

        if ($ids->isEmpty()) {
            return [
                'texto' => 'Acompañamientos incluidos: Ninguno | Acompañamientos adicionales: Ninguno',
                'total_adicional' => 0,
                'personalizacion' => [
                    'tipo' => Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    'acompanamientos' => [],
                    'total_adicional' => 0,
                ],
            ];
        }

        $acompanamientosPorId = Acompanamiento::query()
            ->whereIn('id', $ids)
            ->where('estado', Acompanamiento::ESTADO_DISPONIBLE)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($acompanamientosPorId->count() !== $ids->count()) {
            throw ValidationException::withMessages([
                'productos' => ['Uno de los acompañamientos no existe o está agotado.'],
            ]);
        }

        $acompanamientosOrdenados = $ids->map(fn($id) => $acompanamientosPorId->get($id));

        $snapshot = [];
        $incluidos = [];
        $adicionales = [];
        $totalAdicional = 0;

        foreach ($acompanamientosOrdenados as $indice => $acompanamiento) {
            $esIncluido = $indice < 2;
            $precioAplicado = $esIncluido ? 0 : (float) $acompanamiento->precio_extra;
            $totalAdicional += $precioAplicado;

            $snapshot[] = [
                'id' => $acompanamiento->id,
                'nombre' => $acompanamiento->nombre,
                'orden_seleccion' => $indice + 1,
                'incluido' => $esIncluido,
                'precio_configurado' => (float) $acompanamiento->precio_extra,
                'precio_aplicado' => $precioAplicado,
            ];

            if ($esIncluido) {
                $incluidos[] = $acompanamiento->nombre;
            } else {
                $adicionales[] = $acompanamiento->nombre . ' (+₡' . number_format($precioAplicado, 0, ',', '.') . ')';
            }
        }

        $totalAdicional = round($totalAdicional, 2);

        $texto = implode(' | ', [
            'Acompañamientos incluidos: ' . ($incluidos ? implode(', ', $incluidos) : 'Ninguno'),
            'Acompañamientos adicionales: ' . ($adicionales ? implode(', ', $adicionales) : 'Ninguno'),
        ]);

        return [
            'texto' => $texto,
            'total_adicional' => $totalAdicional,
            'personalizacion' => [
                'tipo' => Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                'acompanamientos' => $snapshot,
                'total_adicional' => $totalAdicional,
            ],
        ];
    }

    private function rechazarExtrasDePizza(array $item, string $mensaje): void
    {
        $ids = collect($item['extras_ids'] ?? [])->filter(fn($id) => $id !== null && $id !== '');
        $texto = trim((string) ($item['extras'] ?? ''));

        if ($ids->isNotEmpty() || $texto !== '') {
            throw ValidationException::withMessages([
                'productos' => [$mensaje],
            ]);
        }
    }

    private function rechazarPasta(array $item, string $mensaje): void
    {
        $pasta = $item['pasta'] ?? null;

        if (is_array($pasta) && collect($pasta)->filter(fn($valor) => $valor !== null && $valor !== '' && $valor !== [])->isNotEmpty()) {
            throw ValidationException::withMessages([
                'productos' => [$mensaje],
            ]);
        }
    }

    private function rechazarAcompanamientos(array $item, string $mensaje): void
    {
        $ids = collect($item['acompanamientos_ids'] ?? [])->filter(fn($id) => $id !== null && $id !== '');

        if ($ids->isNotEmpty()) {
            throw ValidationException::withMessages([
                'productos' => [$mensaje],
            ]);
        }
    }

    private function normalizarIdsUnicos(array $ids, string $mensajeDuplicado): Collection
    {
        $normalizados = collect($ids)
            ->filter(fn($id) => $id !== null && $id !== '')
            ->map(fn($id) => (int) $id)
            ->values();

        if ($normalizados->count() !== $normalizados->unique()->count()) {
            throw ValidationException::withMessages([
                'productos' => [$mensajeDuplicado],
            ]);
        }

        return $normalizados->unique()->values();
    }

    private function resolverIngredientesExtras(array $item): Collection
    {
        $ids = collect($item['extras_ids'] ?? [])
            ->filter(fn($id) => $id !== null && $id !== '')
            ->map(fn($id) => (int) $id)
            ->values();

        if ($ids->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages([
                'productos' => ['No puedes seleccionar el mismo ingrediente extra más de una vez en una pizza.'],
            ]);
        }

        if ($ids->isNotEmpty()) {
            $ingredientesPorId = Ingrediente::query()
                ->whereIn('id', $ids)
                ->where('estado', 'disponible')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($ingredientesPorId->count() !== $ids->count()) {
                throw ValidationException::withMessages([
                    'productos' => ['Uno de los ingredientes extras no existe o ya no está disponible.'],
                ]);
            }

            return $ids->map(fn($id) => $ingredientesPorId->get($id));
        }

        $extrasTexto = trim((string) ($item['extras'] ?? ''));

        if ($extrasTexto === '') {
            return collect();
        }

        $nombres = collect(explode(',', $extrasTexto))
            ->map(fn($nombre) => trim($nombre))
            ->filter(fn($nombre) => $nombre !== '')
            ->values();

        if ($nombres->isEmpty()) {
            return collect();
        }

        $nombresNormalizados = $nombres->map(fn($nombre) => mb_strtolower(trim($nombre)));

        if ($nombresNormalizados->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages([
                'productos' => ['No puedes seleccionar el mismo ingrediente extra más de una vez en una pizza.'],
            ]);
        }

        $ingredientesPorNombre = Ingrediente::query()
            ->whereIn('nombre', $nombres)
            ->where('estado', 'disponible')
            ->lockForUpdate()
            ->get()
            ->keyBy(fn(Ingrediente $ingrediente) => mb_strtolower(trim($ingrediente->nombre)));

        $ingredientesOrdenados = $nombres->map(fn($nombre) => $ingredientesPorNombre->get(mb_strtolower(trim($nombre))));

        if ($ingredientesOrdenados->contains(fn($ingrediente) => $ingrediente === null)) {
            throw ValidationException::withMessages([
                'productos' => ['Uno de los ingredientes extras no existe o ya no está disponible.'],
            ]);
        }

        return $ingredientesOrdenados;
    }

    private function guardarPago(int $pedidoId, ?string $metodoPago): void
    {
        if ($metodoPago === null) {
            PagoPedido::create([
                'pedido_id' => $pedidoId,
                'metodo_pago' => null,
                'estado_pago' => 'pendiente',
            ]);
            return;
        }

        $estadoPago = $metodoPago === 'sinpe' ? 'pendiente_comprobante' : 'no_requiere';

        PagoPedido::create([
            'pedido_id' => $pedidoId,
            'metodo_pago' => $metodoPago,
            'estado_pago' => $estadoPago,
        ]);
    }

    private function guardarComprobanteEnDB($file, int $pedidoId): void
    {
        $contenido = file_get_contents($file->getRealPath());

        if ($contenido === false) {
            throw new \RuntimeException('No se pudo leer el archivo del comprobante.');
        }

        $pago = PagoPedido::where('pedido_id', $pedidoId)->first();

        if (!$pago) {
            throw new \RuntimeException('No se encontró el registro de pago para el pedido.');
        }

        $pago->update([
            'comprobante_binario' => $contenido,
            'comprobante_nombre' => $file->getClientOriginalName(),
            'comprobante_mime' => $file->getMimeType(),
            'comprobante_tamano' => $file->getSize(),
            'fecha_comprobante' => now(),
            'estado_pago' => 'pendiente_verificacion',
        ]);
    }

    private function obtenerComprobanteDeDB(int $pedidoId): ?array
    {
        $pago = PagoPedido::where('pedido_id', $pedidoId)->first();

        if (!$pago || $pago->comprobante_binario === null) {
            return null;
        }

        return [
            'contenido' => $pago->comprobante_binario,
            'nombre' => $pago->comprobante_nombre,
            'mime' => $pago->comprobante_mime,
            'tamano' => $pago->comprobante_tamano,
            'estado_pago' => $pago->estado_pago,
            'fecha_comprobante' => $pago->fecha_comprobante,
            'fecha_verificacion' => $pago->fecha_verificacion,
        ];
    }

    public function listarComprobantes()
    {
        $pagos = PagoPedido::with('pedido.cliente')
            ->whereNotNull('comprobante_binario')
            ->orderBy('created_at', 'desc')
            ->get();

        $resultado = [];

        foreach ($pagos as $pago) {
            $pedido = $pago->pedido;

            if (!$pedido) {
                continue;
            }

            $resultado[] = [
                'pedido_id' => $pedido->id,
                'codigo_tracking' => $pedido->codigo_tracking,
                'cliente_nombre' => $pedido->cliente?->nombre ?? 'Sin cliente',
                'metodo_pago' => $pago->metodo_pago,
                'comprobante' => $pago->comprobante_nombre,
                'comprobante_url' => route('api.pagos.comprobante', ['pago' => $pago->id]),
                'estado_pago' => $pago->estado_pago,
                'fecha' => $pago->fecha_comprobante ?? $pago->created_at,
            ];
        }

        return response()->json($resultado);
    }

    public function verificarComprobante($pedidoId, Request $request)
    {
        $validated = $request->validate([
            'estado' => ['required', Rule::in(['verificado', 'rechazado'])],
        ]);

        $pago = PagoPedido::where('pedido_id', $pedidoId)->first();

        if (!$pago) {
            return response()->json([
                'message' => 'No se encontró información de pago para este pedido.',
            ], 404);
        }

        $pago->update([
            'estado_pago' => $validated['estado'],
            'fecha_verificacion' => now(),
        ]);

        return response()->json([
            'message' => 'Estado actualizado correctamente',
        ]);
    }

    public function pedidoPublico($codigo)
    {
        $pedido = Pedido::with('cliente', 'detalles.producto', 'pago')
            ->where('codigo_tracking', strtoupper($codigo))
            ->first();

        if (!$pedido) {
            return response()->json([
                'message' => 'Pedido no encontrado',
            ], 404);
        }

        $pago = $pedido->pago;

        return response()->json([
            'pedido' => [
                'id' => $pedido->id,
                'codigo_tracking' => $pedido->codigo_tracking,
                'cliente' => $pedido->cliente,
                'costo_empaque' => $pedido->costo_empaque,
                'total' => $pedido->total,
                'estado_pedido' => $pedido->estado_pedido,
                'modalidad_entrega' => $pedido->modalidad_entrega,
                'detalles' => $pedido->detalles->map(function ($detalle) {
                    return [
                        'producto' => $detalle->producto,
                        'cantidad' => $detalle->cantidad,
                        'precio_unitario' => $detalle->precio_unitario,
                        'subtotal' => $detalle->subtotal,
                        'extras' => $detalle->extras,
                        'observaciones' => $detalle->observaciones,
                        'personalizacion' => $detalle->personalizacion,
                    ];
                }),
                'metodo_pago' => $pago?->metodo_pago ?? null,
                'estado_pago' => $pago?->estado_pago ?? null,
                'comprobante' => $pago?->comprobante_nombre ?? null,
                'comprobante_url' => $pago?->comprobante_binario ? route('api.pagos.comprobante', ['pago' => $pago->id]) : null,
            ],
        ]);
    }

    public function subirComprobante(Request $request, $codigo)
    {
        $request->validate([
            'comprobante' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $pedido = Pedido::where('codigo_tracking', strtoupper($codigo))->first();

        if (!$pedido) {
            return response()->json([
                'message' => 'Pedido no encontrado',
            ], 404);
        }

        $archivo = $request->file('comprobante');
        $contenido = file_get_contents($archivo->getRealPath());

        if ($contenido === false) {
            return response()->json([
                'message' => 'No se pudo leer el archivo del comprobante.',
            ], 500);
        }

        $pago = PagoPedido::firstOrCreate(
            ['pedido_id' => $pedido->id],
            ['metodo_pago' => 'sinpe']
        );

        $pago->update([
            'comprobante_binario' => $contenido,
            'comprobante_nombre' => $archivo->getClientOriginalName(),
            'comprobante_mime' => $archivo->getMimeType(),
            'comprobante_tamano' => $archivo->getSize(),
            'fecha_comprobante' => now(),
            'estado_pago' => 'pendiente_verificacion',
        ]);

        return response()->json([
            'message' => 'Comprobante subido correctamente',
            'archivo' => route('api.pagos.comprobante', ['pago' => $pago->id]),
        ]);
    }

    public function descargarComprobante(PagoPedido $pago): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        if ($pago->comprobante_binario === null) {
            return response()->json([
                'message' => 'Este pago no tiene un comprobante asociado.',
            ], 404);
        }

        $nombre = $pago->comprobante_nombre ?? 'comprobante.pdf';
        $mime = $pago->comprobante_mime ?? 'application/octet-stream';

        $stream = fopen('php://memory', 'r+');
        fwrite($stream, $pago->comprobante_binario);
        rewind($stream);

        return response()->stream(
            function () use ($stream) {
                fpassthru($stream);
                fclose($stream);
            },
            200,
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . $nombre . '"',
                'Content-Length' => strlen($pago->comprobante_binario),
                'Cache-Control' => 'private, max-age=0, must-revalidate',
            ]
        );
    }

    public function updateEstado(Request $request, Pedido $pedido)
    {
        $validated = $request->validate([
            'estado_pedido' => ['required', Rule::in(['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado'])],
        ]);

        $pedido->update(['estado_pedido' => $validated['estado_pedido']]);

        return response()->json([
            'message' => 'Estado actualizado',
            'pedido' => $pedido->load('detalles.producto', 'cliente', 'pago'),
        ]);
    }

    public function buscarPorTracking($codigo)
    {
        $pedido = Pedido::with('detalles.producto', 'cliente', 'pago')
            ->where('codigo_tracking', strtoupper($codigo))
            ->first();

        if (!$pedido) {
            return response()->json([
                'message' => 'No se encontró ningún pedido con ese código.',
            ], 404);
        }

        return response()->json($pedido);
    }

    /**
     * |--------------------------------------------------------------------------
     * | OBTENER PEDIDOS PENDIENTES PARA CAJA
     * |--------------------------------------------------------------------------
     *
     * Devuelve pedidos de ambos canales:
     * - web
     * - caja
     *
     * Los pedidos creados directamente en caja se limitan a la sesión de caja
     * actualmente abierta. Los pedidos web pueden cobrarse desde la caja activa
     * una vez que Cocina los marque como "listo".
     */
    public function pedidosPendientesCaja(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $rol = $usuario->rolNormalizado();

        $cajaActiva = CajaSesion::query()
            ->where('estado', 'abierta')
            ->latest('fecha_apertura')
            ->first();

        if ($rol === 'caja') {
            if (!$cajaActiva) {
                return response()->json([
                    'message' => 'No hay una caja abierta actualmente.',
                    'pedidos' => [],
                    'total' => 0,
                ], 200);
            }

            if ((int) $cajaActiva->usuario_asignado_id !== (int) $usuario->id) {
                return response()->json([
                    'message' => 'La caja abierta está asignada a otro usuario.',
                    'pedidos' => [],
                    'total' => 0,
                ], 200);
            }
        }

        $pedidos = Pedido::with([
            'cliente',
            'detalles.producto',
            'detalles' => function ($query) {
                $query->select(
                    'id',
                    'pedido_id',
                    'producto_id',
                    'cantidad',
                    'precio_unitario',
                    'subtotal',
                    'extras',
                    'observaciones',
                    'personalizacion'
                );
            },
            'pago',
        ])
            ->where(function ($query) use ($cajaActiva) {
                $query->where('canal', 'web');

                if ($cajaActiva) {
                    $query->orWhere(function ($subQuery) use ($cajaActiva) {
                        $subQuery
                            ->where('canal', 'caja')
                            ->where('caja_sesion_id', $cajaActiva->id);
                    });
                }
            })
            ->where(function ($query) {
                $query
                    ->whereDoesntHave('pago')
                    ->orWhereHas('pago', function ($pagoQuery) {
                        $pagoQuery->where('estado_pago', '!=', 'pagado');
                    });
            })
            ->whereIn('estado_pedido', [
                'pendiente',
                'confirmado',
                'en_preparacion',
                'listo',
            ])
            ->orderBy('created_at', 'asc')
            ->get();

        $pedidosFormateados = $pedidos->map(function (Pedido $pedido) {
            $listoParaCobrar = $pedido->estado_pedido === 'listo';

            return [
                'id' => $pedido->id,
                'codigo_tracking' => $pedido->codigo_tracking,
                'canal' => $pedido->canal,

                'cliente' => $pedido->cliente ? [
                    'id' => $pedido->cliente->id,
                    'nombre' => $pedido->cliente->nombre,
                    'telefono' => $pedido->cliente->telefono,
                ] : null,

                'modalidad_entrega' => $pedido->modalidad_entrega,
                'total' => (float) $pedido->total,
                'costo_empaque' => (float) $pedido->costo_empaque,
                'estado_pedido' => $pedido->estado_pedido,
                'estado_pago' => $pedido->pago?->estado_pago ?? 'pendiente',
                'metodo_pago' => $pedido->pago?->metodo_pago,
                'listo_para_cobrar' => $listoParaCobrar,

                'detalles' => $pedido->detalles->map(function ($detalle) {
                    return [
                        'id' => $detalle->id,
                        'producto_nombre' => $detalle->producto?->nombre ?? 'Producto',
                        'cantidad' => $detalle->cantidad,
                        'precio_unitario' => (float) $detalle->precio_unitario,
                        'subtotal' => (float) $detalle->subtotal,
                        'extras' => $detalle->extras,
                        'observaciones' => $detalle->observaciones,
                        'personalizacion' => $detalle->personalizacion,
                    ];
                }),

                'created_at' => $pedido->created_at,
            ];
        });

        return response()->json([
            'pedidos' => $pedidosFormateados,
            'total' => $pedidosFormateados->count(),
        ]);
    }

    /**
     * |--------------------------------------------------------------------------
     * | COBRAR PEDIDO
     * |--------------------------------------------------------------------------
     *
     * Permite cobrar tanto pedidos web como pedidos creados desde el POS.
     * Ambos deben encontrarse en estado "listo".
     */
    public function cobrarPedido(Request $request, int $pedidoId): JsonResponse
    {
        $usuario = $request->user();
        $rol = $usuario->rolNormalizado();

        $validated = $request->validate([
            'metodo_pago' => [
                'required',
                Rule::in(['efectivo', 'tarjeta', 'sinpe']),
            ],
            'monto_recibido' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        $pedido = Pedido::with([
            'pago',
            'cajaSesion',
        ])->find($pedidoId);

        if (!$pedido) {
            return response()->json([
                'message' => 'Pedido no encontrado.',
            ], 404);
        }

        if ($pedido->estaPagado()) {
            return response()->json([
                'message' => 'Este pedido ya ha sido pagado.',
            ], 400);
        }

        if (!$pedido->estaListo()) {
            $estados = [
                'pendiente' => 'Pendiente',
                'confirmado' => 'Confirmado',
                'en_preparacion' => 'En preparación',
                'listo' => 'Listo',
                'entregado' => 'Entregado',
            ];

            return response()->json([
                'message' => 'El pedido debe estar en estado "Listo" para poder cobrarlo.',
                'estado_actual' => $pedido->estado_pedido,
                'estado_texto' => $estados[$pedido->estado_pedido] ?? $pedido->estado_pedido,
            ], 400);
        }

        $cajaActiva = CajaSesion::query()
            ->where('estado', 'abierta')
            ->latest('fecha_apertura')
            ->first();

        if (!$cajaActiva) {
            return response()->json([
                'message' => 'No hay una caja abierta para cobrar este pedido.',
            ], 403);
        }

        if ($rol === 'caja') {
            if ((int) $cajaActiva->usuario_asignado_id !== (int) $usuario->id) {
                return response()->json([
                    'message' => 'La caja abierta está asignada a otro usuario.',
                ], 403);
            }
        }

        if ($pedido->canal === 'caja') {
            if (
                $pedido->caja_sesion_id !== null &&
                (int) $pedido->caja_sesion_id !== (int) $cajaActiva->id
            ) {
                return response()->json([
                    'message' => 'Este pedido pertenece a otra sesión de caja.',
                ], 403);
            }
        }

        if ($validated['metodo_pago'] === 'efectivo') {
            $montoRecibido = (float) ($validated['monto_recibido'] ?? 0);

            if ($montoRecibido < (float) $pedido->total) {
                return response()->json([
                    'message' => 'El monto recibido debe ser igual o mayor al total del pedido.',
                    'total' => (float) $pedido->total,
                    'monto_recibido' => $montoRecibido,
                    'cambio' => 0,
                ], 400);
            }
        }

        $resultado = DB::transaction(function () use (
            $pedido,
            $validated,
            $usuario,
            $cajaActiva
        ) {
            if (
                $pedido->canal === 'web' ||
                $pedido->caja_sesion_id === null
            ) {
                $pedido->caja_sesion_id = $cajaActiva->id;
            }

            $pago = $pedido->pago;

            if (!$pago) {
                $pago = new PagoPedido([
                    'pedido_id' => $pedido->id,
                ]);
            }

            $pago->metodo_pago = $validated['metodo_pago'];
            $pago->estado_pago = 'pagado';
            $pago->fecha_pago = now();
            $pago->cobrado_por_user_id = $usuario->id;

            if ($validated['metodo_pago'] === 'efectivo') {
                $montoRecibido = (float) (
                    $validated['monto_recibido']
                    ?? $pedido->total
                );

                $pago->monto_recibido = $montoRecibido;
                $pago->cambio = round(
                    $montoRecibido - (float) $pedido->total,
                    2
                );
            } else {
                $pago->monto_recibido = null;
                $pago->cambio = null;
            }

            $pago->save();

            $pedido->estado_pedido = 'entregado';
            $pedido->save();

            return [
                'pedido' => $pedido->fresh([
                    'cliente',
                    'detalles.producto',
                    'pago',
                    'cajaSesion',
                ]),
                'pago' => $pago->fresh(),
            ];
        });

        return response()->json([
            'message' => 'Pedido cobrado correctamente.',
            'pedido' => $resultado['pedido'],
            'pago' => [
                'metodo_pago' => $resultado['pago']->metodo_pago,
                'estado_pago' => $resultado['pago']->estado_pago,
                'monto_recibido' => $resultado['pago']->monto_recibido,
                'cambio' => $resultado['pago']->cambio,
                'fecha_pago' => $resultado['pago']->fecha_pago,
            ],
        ], 201);
    }
}