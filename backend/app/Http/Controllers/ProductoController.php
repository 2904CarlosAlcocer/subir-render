<?php

namespace App\Http\Controllers;

use App\Models\Acompanamiento;
use App\Models\Ingrediente;
use App\Models\OpcionPasta;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductoController extends Controller
{
    /**
     * Lista los productos disponibles para el menú público.
     *
     * También incluye:
     *
     * - Ingredientes extras disponibles para pizzas.
     * - Opciones disponibles para personalizar pastas.
     * - Acompañamientos disponibles para carnes.
     */
    public function index(
        Request $request
    ): JsonResponse {
        $productos = Producto::with([
            'categoria',
            'ingredientes',
        ])
            ->where(
                'estado',
                'disponible'
            )
            ->orderBy('categoria_id')
            ->orderBy('nombre')
            ->get();

        /*
         * Solamente se envían al menú público
         * los ingredientes disponibles.
         */
        $extras = Ingrediente::query()
            ->where(
                'estado',
                'disponible'
            )
            ->orderBy('nombre')
            ->get();

        /*
         * Solamente se envían al menú público
         * las opciones de pasta disponibles.
         */
        $opcionesPasta = OpcionPasta::query()
            ->disponibles()
            ->ordenadas()
            ->get();

        /*
         * Solamente se envían al menú público
         * los acompañamientos disponibles.
         */
        $acompanamientos =
            Acompanamiento::query()
                ->disponibles()
                ->ordenados()
                ->get();

        return response()->json(
            $this->prepararProductos(
                $productos,
                $extras,
                $opcionesPasta,
                $acompanamientos
            )
        );
    }

    /**
     * Devuelve la pizza destacada que aparece en el Home.
     *
     * Se consulta directamente desde la base de datos para que
     * cualquier cambio de imagen, descripción, precio o estado
     * realizado desde administración se refleje automáticamente.
     */
    public function destacadoHome(): JsonResponse
    {
        $producto = Producto::with('categoria')
            ->where(
                'nombre',
                'Tres Carnes Pizza'
            )
            ->first();

        if (!$producto) {
            return response()->json([
                'message' =>
                    'La pizza destacada no fue encontrada.',
            ], 404);
        }

        return response()->json([
            'id' =>
                $producto->id,

            'nombre' =>
                $producto->nombre,

            'descripcion' =>
                $producto->descripcion,

            'precio' =>
                (float) $producto->precio,

            'precio_personal' =>
                $producto->precio_personal !== null
                ? (float) $producto->precio_personal
                : null,

            'imagen_url' =>
                $producto->imagen
                ? Storage::disk('public')->url(
                    $producto->imagen
                )
                : null,

            'estado' =>
                $producto->estado,

            'es_pizza' =>
                $producto->es_pizza,
        ]);
    }

    /**
     * Lista todos los productos para el Dashboard.
     *
     * Incluye productos disponibles y agotados.
     */
    public function indexAdmin(): JsonResponse
    {
        $productos = Producto::with([
            'categoria',
            'ingredientes',
        ])
            ->orderBy('categoria_id')
            ->orderBy('nombre')
            ->get();

        /*
         * Se conserva el comportamiento actual:
         * los extras disponibles se incluyen para
         * los formularios de productos.
         */
        $extras = Ingrediente::query()
            ->where(
                'estado',
                'disponible'
            )
            ->orderBy('nombre')
            ->get();

        /*
         * En administración se cargan todas las
         * opciones, incluyendo las agotadas.
         */
        $opcionesPasta = OpcionPasta::query()
            ->ordenadas()
            ->get();

        $acompanamientos =
            Acompanamiento::query()
                ->ordenados()
                ->get();

        return response()->json(
            $this->prepararProductos(
                $productos,
                $extras,
                $opcionesPasta,
                $acompanamientos
            )
        );
    }

    /**
     * Crea un producto nuevo.
     */
    public function store(
        Request $request
    ): JsonResponse {
        $datos = $request->validate(
            [
                'categoria_id' => [
                    'required',
                    'integer',
                    'exists:categorias,id',
                ],

                'nombre' => [
                    'required',
                    'string',
                    'max:120',
                ],

                'descripcion' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'precio' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                /*
                 * Precio opcional para pizzas personales.
                 * Los productos con un solo precio pueden
                 * mantener este campo en null.
                 */
                'precio_personal' => [
                    'nullable',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                'imagen' => [
                    'nullable',
                    'file',
                    'mimetypes:image/jpeg,image/png,image/webp,image/avif',
                    'extensions:jpg,jpeg,png,webp,avif',
                    'max:4096',
                ],

                'ingredientes' => [
                    'nullable',
                    'array',
                ],

                'ingredientes.*' => [
                    'integer',
                    'distinct',
                    'exists:ingredientes,id',
                ],

                /*
                 * null:
                 * Producto normal o pizza.
                 *
                 * pasta:
                 * Abre PersonalizadorPasta.
                 *
                 * acompanamientos:
                 * Abre el selector de acompañamientos.
                 */
                'tipo_personalizacion' => [
                    'nullable',
                    'string',

                    Rule::in([
                        Producto::PERSONALIZACION_PASTA,

                        Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    ]),
                ],
            ],
            [
                'categoria_id.required' =>
                    'La categoría es obligatoria.',

                'categoria_id.integer' =>
                    'La categoría seleccionada no es válida.',

                'categoria_id.exists' =>
                    'La categoría seleccionada no existe.',

                'nombre.required' =>
                    'El nombre del producto es obligatorio.',

                'nombre.string' =>
                    'El nombre del producto no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 120 caracteres.',

                'descripcion.string' =>
                    'La descripción no es válida.',

                'descripcion.max' =>
                    'La descripción no puede superar los 255 caracteres.',

                'precio.required' =>
                    'El precio del producto es obligatorio.',

                'precio.numeric' =>
                    'El precio debe ser un número válido.',

                'precio.min' =>
                    'El precio no puede ser negativo.',

                'precio.max' =>
                    'El precio ingresado es demasiado alto.',

                'precio_personal.numeric' =>
                    'El precio personal debe ser un número válido.',

                'precio_personal.min' =>
                    'El precio personal no puede ser negativo.',

                'precio_personal.max' =>
                    'El precio personal ingresado es demasiado alto.',

                'imagen.file' =>
                    'El archivo seleccionado debe ser una imagen válida.',

                'imagen.mimetypes' =>
                    'La imagen debe ser JPG, JPEG, PNG, WEBP o AVIF.',

                'imagen.extensions' =>
                    'La extensión debe ser JPG, JPEG, PNG, WEBP o AVIF.',

                'imagen.max' =>
                    'La imagen no puede superar los 4 MB.',

                'ingredientes.array' =>
                    'Los ingredientes deben enviarse como una lista.',

                'ingredientes.*.integer' =>
                    'Uno de los ingredientes no tiene un identificador válido.',

                'ingredientes.*.distinct' =>
                    'No puedes seleccionar el mismo ingrediente más de una vez.',

                'ingredientes.*.exists' =>
                    'Uno de los ingredientes seleccionados no existe.',

                'tipo_personalizacion.string' =>
                    'El tipo de personalización no es válido.',

                'tipo_personalizacion.in' =>
                    'El tipo de personalización seleccionado no está permitido.',
            ]
        );

        $rutaImagen = null;

        if ($request->hasFile('imagen')) {
            $rutaImagen = $request
                ->file('imagen')
                ->store(
                    'productos',
                    'public'
                );
        }

        $producto = Producto::create([
            'categoria_id' =>
                $datos['categoria_id'],

            'nombre' =>
                trim($datos['nombre']),

            'descripcion' =>
                isset($datos['descripcion'])
                ? trim($datos['descripcion'])
                : null,

            'precio' =>
                $datos['precio'],

            'precio_personal' =>
                $datos['precio_personal'] ?? null,

            'imagen' =>
                $rutaImagen,

            'estado' =>
                'disponible',

            'tipo_personalizacion' =>
                $datos[
                    'tipo_personalizacion'
                ] ?? null,
        ]);

        /*
         * Se conserva sin cambios la asignación
         * de ingredientes base para pizzas.
         */
        $ingredientes = $datos[
            'ingredientes'
        ] ?? [];

        $producto
            ->ingredientes()
            ->sync($ingredientes);

        $producto->load([
            'categoria',
            'ingredientes',
        ]);

        return response()->json([
            'message' =>
                'Producto creado correctamente',

            'producto' =>
                $this->prepararProductos(
                    $producto
                ),
        ], 201);
    }

    /**
     * Actualiza un producto.
     */
    public function update(
        Request $request,
        Producto $producto
    ): JsonResponse {
        $datos = $request->validate(
            [
                'categoria_id' => [
                    'required',
                    'integer',
                    'exists:categorias,id',
                ],

                'nombre' => [
                    'required',
                    'string',
                    'max:120',
                ],

                'descripcion' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'precio' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                /*
                 * Precio opcional para pizzas personales.
                 * Los productos con un solo precio pueden
                 * mantener este campo en null.
                 */
                'precio_personal' => [
                    'nullable',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                'imagen' => [
                    'nullable',
                    'file',
                    'mimetypes:image/jpeg,image/png,image/webp,image/avif',
                    'extensions:jpg,jpeg,png,webp,avif',
                    'max:4096',
                ],

                'ingredientes' => [
                    'nullable',
                    'array',
                ],

                'ingredientes.*' => [
                    'integer',
                    'distinct',
                    'exists:ingredientes,id',
                ],

                'tipo_personalizacion' => [
                    'nullable',
                    'string',

                    Rule::in([
                        Producto::PERSONALIZACION_PASTA,

                        Producto::PERSONALIZACION_ACOMPANAMIENTOS,
                    ]),
                ],
            ],
            [
                'categoria_id.required' =>
                    'La categoría es obligatoria.',

                'categoria_id.integer' =>
                    'La categoría seleccionada no es válida.',

                'categoria_id.exists' =>
                    'La categoría seleccionada no existe.',

                'nombre.required' =>
                    'El nombre del producto es obligatorio.',

                'nombre.string' =>
                    'El nombre del producto no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 120 caracteres.',

                'descripcion.string' =>
                    'La descripción no es válida.',

                'descripcion.max' =>
                    'La descripción no puede superar los 255 caracteres.',

                'precio.required' =>
                    'El precio del producto es obligatorio.',

                'precio.numeric' =>
                    'El precio debe ser un número válido.',

                'precio.min' =>
                    'El precio no puede ser negativo.',

                'precio.max' =>
                    'El precio ingresado es demasiado alto.',

                'precio_personal.numeric' =>
                    'El precio personal debe ser un número válido.',

                'precio_personal.min' =>
                    'El precio personal no puede ser negativo.',

                'precio_personal.max' =>
                    'El precio personal ingresado es demasiado alto.',

                'imagen.file' =>
                    'El archivo seleccionado debe ser una imagen válida.',

                'imagen.mimetypes' =>
                    'La imagen debe ser JPG, JPEG, PNG, WEBP o AVIF.',

                'imagen.extensions' =>
                    'La extensión debe ser JPG, JPEG, PNG, WEBP o AVIF.',

                'imagen.max' =>
                    'La imagen no puede superar los 4 MB.',

                'ingredientes.array' =>
                    'Los ingredientes deben enviarse como una lista.',

                'ingredientes.*.integer' =>
                    'Uno de los ingredientes no tiene un identificador válido.',

                'ingredientes.*.distinct' =>
                    'No puedes seleccionar el mismo ingrediente más de una vez.',

                'ingredientes.*.exists' =>
                    'Uno de los ingredientes seleccionados no existe.',

                'tipo_personalizacion.string' =>
                    'El tipo de personalización no es válido.',

                'tipo_personalizacion.in' =>
                    'El tipo de personalización seleccionado no está permitido.',
            ]
        );

        $datosProducto = [
            'categoria_id' =>
                $datos['categoria_id'],

            'nombre' =>
                trim($datos['nombre']),

            'descripcion' =>
                isset($datos['descripcion'])
                ? trim($datos['descripcion'])
                : null,

            'precio' =>
                $datos['precio'],
        ];

        /*
         * El precio personal solamente se modifica
         * cuando el formulario realmente lo envía.
         *
         * Esto evita borrarlo mientras todavía exista
         * una versión anterior del Dashboard que no
         * incluya este campo.
         */
        if (
            $request->exists(
                'precio_personal'
            )
        ) {
            $datosProducto[
                'precio_personal'
            ] = $datos[
                    'precio_personal'
                ] ?? null;
        }

        /*
         * El tipo solamente se modifica cuando
         * el formulario realmente lo envía.
         *
         * Esto evita borrar accidentalmente la
         * configuración mientras actualizamos
         * el Dashboard del administrador.
         */
        if (
            $request->exists(
                'tipo_personalizacion'
            )
        ) {
            $datosProducto[
                'tipo_personalizacion'
            ] = $datos[
                    'tipo_personalizacion'
                ] ?? null;
        }

        /*
         * Actualizar imagen.
         */
        if ($request->hasFile('imagen')) {
            if ($producto->imagen) {
                Storage::disk('public')
                    ->delete(
                        $producto->imagen
                    );
            }

            $datosProducto['imagen'] =
                $request
                    ->file('imagen')
                    ->store(
                        'productos',
                        'public'
                    );
        }

        $producto->update(
            $datosProducto
        );

        /*
         * Se conserva el funcionamiento actual
         * de ingredientes base para pizzas.
         */
        if (
            $request->has(
                'ingredientes'
            )
        ) {
            $producto
                ->ingredientes()
                ->sync(
                    $datos[
                        'ingredientes'
                    ] ?? []
                );
        }

        $producto->load([
            'categoria',
            'ingredientes',
        ]);

        return response()->json([
            'message' =>
                'Producto actualizado correctamente',

            'producto' =>
                $this->prepararProductos(
                    $producto
                ),
        ]);
    }

    /**
     * Cambia el estado del producto.
     */
    public function toggleEstado(
        Producto $producto
    ): JsonResponse {
        $producto->estado =
            $producto->estado ===
            'disponible'
            ? 'agotado'
            : 'disponible';

        $producto->save();

        $producto->load([
            'categoria',
            'ingredientes',
        ]);

        return response()->json([
            'message' =>
                'Estado actualizado',

            'producto' =>
                $this->prepararProductos(
                    $producto
                ),
        ]);
    }

    /**
     * Prepara productos para enviarlos a React.
     */
    private function prepararProductos(
        $productos,
        ?Collection $extras = null,
        ?Collection $opcionesPasta = null,
        ?Collection $acompanamientos = null
    ) {
        $esColeccion =
            $productos instanceof Collection;

        $items = $esColeccion
            ? $productos
            : collect([
                $productos,
            ]);

        /*
         * Preparar ingredientes extras.
         *
         * precio_extra siempre procede
         * de la base de datos.
         */
        $extrasArray = $extras
            ? $extras
                ->map(
                    function (Ingrediente $extra) {
                        return [
                            'id' =>
                                $extra->id,

                            'nombre' =>
                                $extra->nombre,

                            'precio_extra' =>
                                (float) 
                                $extra
                                    ->precio_extra,

                            'estado' =>
                                $extra->estado,
                        ];
                    }
                )
                ->values()
            : collect();

        /*
         * Preparar las opciones de pasta
         * agrupadas por su función.
         */
        $opcionesPastaAgrupadas =
            $this->agruparOpcionesPasta(
                $opcionesPasta
                ?? collect()
            );

        /*
         * Preparar acompañamientos.
         */
        $acompanamientosArray =
            $acompanamientos
            ? $acompanamientos
                ->map(
                    function (Acompanamiento $acompanamiento) {
                        return [
                            'id' =>
                                $acompanamiento
                                    ->id,

                            'nombre' =>
                                $acompanamiento
                                    ->nombre,

                            'precio_extra' =>
                                (float) 
                                $acompanamiento
                                    ->precio_extra,

                            'estado' =>
                                $acompanamiento
                                    ->estado,

                            'orden' =>
                                (int) 
                                $acompanamiento
                                    ->orden,
                        ];
                    }
                )
                ->values()
            : collect();

        $items->each(
            function (Producto $producto) use ($extras, $extrasArray, $opcionesPasta, $opcionesPastaAgrupadas, $acompanamientos, $acompanamientosArray) {
                /*
                 * URL pública de la imagen.
                 */
                $producto->imagen_url =
                    $producto->imagen
                    ? Storage::disk(
                        'public'
                    )->url(
                            $producto->imagen
                        )
                    : null;

                /*
                 * Ingredientes base del producto.
                 *
                 * Se conserva para pizzas.
                 */
                $producto
                    ->ingredientes_base =
                    $producto
                        ->ingredientes
                        ->map(
                            function (Ingrediente $ingrediente) {
                                return [
                                    'id' =>
                                        $ingrediente
                                            ->id,

                                    'nombre' =>
                                        $ingrediente
                                            ->nombre,
                                ];
                            }
                        )
                        ->values();

                /*
                 * Indicadores que React utilizará
                 * para decidir qué modal abrir.
                 *
                 * Se agregan a la respuesta JSON mediante
                 * los accesores definidos en Producto.
                 */
                $producto->append([
                    'es_pizza',
                    'tiene_precio_personal',
                    'es_pasta_personalizable',
                    'usa_acompanamientos',
                ]);

                /*
                 * Mantener extras de pizza.
                 */
                if ($extras !== null) {
                    $producto
                        ->extras_disponibles =
                        $extrasArray;
                }

                /*
                 * Las opciones de pasta solamente
                 * se agregan a productos configurados
                 * con tipo_personalizacion = pasta.
                 */
                if (
                    $opcionesPasta !== null
                    && $producto
                        ->es_pasta_personalizable
                ) {
                    $producto
                        ->opciones_pasta =
                        $opcionesPastaAgrupadas;
                }

                /*
                 * Los acompañamientos solamente
                 * se agregan a productos configurados
                 * para utilizarlos.
                 */
                if (
                    $acompanamientos !== null
                    && $producto
                        ->usa_acompanamientos
                ) {
                    $producto
                        ->acompanamientos_disponibles =
                        $acompanamientosArray;
                }

                /*
                 * Mantener extras de pizza.
                 */
                if ($extras !== null) {
                    $producto
                        ->extras_disponibles =
                        $extrasArray;
                }

                /*
                 * Las opciones de pasta solamente
                 * se agregan a productos configurados
                 * con tipo_personalizacion = pasta.
                 */
                if (
                    $opcionesPasta !== null
                    && $producto
                        ->es_pasta_personalizable
                ) {
                    $producto
                        ->opciones_pasta =
                        $opcionesPastaAgrupadas;
                }

                /*
                 * Los acompañamientos solamente
                 * se agregan a productos configurados
                 * para utilizarlos.
                 */
                if (
                    $acompanamientos !== null
                    && $producto
                        ->usa_acompanamientos
                ) {
                    $producto
                        ->acompanamientos_disponibles =
                        $acompanamientosArray;
                }
            }
        );

        return $esColeccion
            ? $items
            : $items->first();
    }

    /**
     * Agrupa las opciones de pasta para facilitar
     * su utilización en PersonalizadorPasta.
     */
    private function agruparOpcionesPasta(
        Collection $opciones
    ): array {
        $resultado = [
            'tipos_pasta' => [],
            'proteinas' => [],
            'salsas' => [],
            'ingredientes' => [],
        ];

        foreach ($opciones as $opcion) {
            $datosOpcion = [
                'id' =>
                    $opcion->id,

                'grupo' =>
                    $opcion->grupo,

                'nombre' =>
                    $opcion->nombre,

                'precio_extra' =>
                    (float) 
                    $opcion->precio_extra,

                'estado' =>
                    $opcion->estado,

                'orden' =>
                    (int) 
                    $opcion->orden,
            ];

            switch ($opcion->grupo) {
                case OpcionPasta::GRUPO_TIPO_PASTA:
                    $resultado[
                        'tipos_pasta'
                    ][] = $datosOpcion;
                    break;

                case OpcionPasta::GRUPO_PROTEINA:
                    $resultado[
                        'proteinas'
                    ][] = $datosOpcion;
                    break;

                case OpcionPasta::GRUPO_SALSA:
                    $resultado[
                        'salsas'
                    ][] = $datosOpcion;
                    break;

                case OpcionPasta::GRUPO_INGREDIENTE:
                    $resultado[
                        'ingredientes'
                    ][] = $datosOpcion;
                    break;
            }
        }

        return $resultado;
    }
}