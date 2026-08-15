<?php

namespace App\Http\Controllers;

use App\Models\OpcionPasta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OpcionPastaController extends Controller
{
    /**
     * Lista todas las opciones de pasta para administración.
     *
     * Incluye opciones disponibles y agotadas.
     */
    public function index(): JsonResponse
    {
        $opciones = OpcionPasta::query()
            ->ordenadas()
            ->get();

        return response()->json(
            $opciones
        );
    }

    /**
     * Registra una nueva opción de pasta.
     */
    public function store(
        Request $request
    ): JsonResponse {
        $datos = $request->validate(
            [
                'grupo' => [
                    'required',
                    'string',

                    Rule::in(
                        OpcionPasta::gruposPermitidos()
                    ),
                ],

                'nombre' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'opciones_pasta',
                        'nombre'
                    )->where(
                        fn($query) =>
                        $query->where(
                            'grupo',
                            $request->input(
                                'grupo'
                            )
                        )
                    ),
                ],

                'precio_extra' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                'orden' => [
                    'nullable',
                    'integer',
                    'min:0',
                    'max:9999',
                ],
            ],
            [
                'grupo.required' =>
                    'El grupo de la opción es obligatorio.',

                'grupo.string' =>
                    'El grupo seleccionado no es válido.',

                'grupo.in' =>
                    'El grupo seleccionado no está permitido.',

                'nombre.required' =>
                    'El nombre de la opción es obligatorio.',

                'nombre.string' =>
                    'El nombre de la opción no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe una opción con ese nombre dentro del mismo grupo.',

                'precio_extra.required' =>
                    'El precio adicional es obligatorio.',

                'precio_extra.numeric' =>
                    'El precio adicional debe ser un número válido.',

                'precio_extra.min' =>
                    'El precio adicional no puede ser negativo.',

                'precio_extra.max' =>
                    'El precio adicional ingresado es demasiado alto.',

                'orden.integer' =>
                    'El orden debe ser un número entero.',

                'orden.min' =>
                    'El orden no puede ser negativo.',

                'orden.max' =>
                    'El orden ingresado es demasiado alto.',
            ]
        );

        $opcion = OpcionPasta::create([
            'grupo' =>
                $datos['grupo'],

            'nombre' =>
                trim($datos['nombre']),

            'precio_extra' =>
                $datos['precio_extra'],

            'estado' =>
                OpcionPasta::ESTADO_DISPONIBLE,

            'orden' =>
                $datos['orden'] ?? 0,
        ]);

        return response()->json([
            'message' =>
                'Opción de pasta creada correctamente.',

            'opcion' =>
                $opcion,
        ], 201);
    }

    /**
     * Actualiza el grupo, nombre, precio y orden
     * de una opción de pasta.
     */
    public function update(
        Request $request,
        OpcionPasta $opcionPasta
    ): JsonResponse {
        $datos = $request->validate(
            [
                'grupo' => [
                    'required',
                    'string',

                    Rule::in(
                        OpcionPasta::gruposPermitidos()
                    ),
                ],

                'nombre' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'opciones_pasta',
                        'nombre'
                    )
                        ->ignore(
                            $opcionPasta->id
                        )
                        ->where(
                            fn($query) =>
                            $query->where(
                                'grupo',
                                $request->input(
                                    'grupo'
                                )
                            )
                        ),
                ],

                'precio_extra' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                'orden' => [
                    'nullable',
                    'integer',
                    'min:0',
                    'max:9999',
                ],
            ],
            [
                'grupo.required' =>
                    'El grupo de la opción es obligatorio.',

                'grupo.string' =>
                    'El grupo seleccionado no es válido.',

                'grupo.in' =>
                    'El grupo seleccionado no está permitido.',

                'nombre.required' =>
                    'El nombre de la opción es obligatorio.',

                'nombre.string' =>
                    'El nombre de la opción no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe una opción con ese nombre dentro del mismo grupo.',

                'precio_extra.required' =>
                    'El precio adicional es obligatorio.',

                'precio_extra.numeric' =>
                    'El precio adicional debe ser un número válido.',

                'precio_extra.min' =>
                    'El precio adicional no puede ser negativo.',

                'precio_extra.max' =>
                    'El precio adicional ingresado es demasiado alto.',

                'orden.integer' =>
                    'El orden debe ser un número entero.',

                'orden.min' =>
                    'El orden no puede ser negativo.',

                'orden.max' =>
                    'El orden ingresado es demasiado alto.',
            ]
        );

        $opcionPasta->update([
            'grupo' =>
                $datos['grupo'],

            'nombre' =>
                trim($datos['nombre']),

            'precio_extra' =>
                $datos['precio_extra'],

            'orden' =>
                $datos['orden'] ?? 0,
        ]);

        return response()->json([
            'message' =>
                'Opción de pasta actualizada correctamente.',

            'opcion' =>
                $opcionPasta->fresh(),
        ]);
    }

    /**
     * Cambia la disponibilidad de la opción.
     */
    public function toggleEstado(
        OpcionPasta $opcionPasta
    ): JsonResponse {
        $opcionPasta->estado =
            $opcionPasta->estado ===
            OpcionPasta::ESTADO_DISPONIBLE
                ? OpcionPasta::ESTADO_AGOTADO
                : OpcionPasta::ESTADO_DISPONIBLE;

        $opcionPasta->save();

        return response()->json([
            'message' =>
                'Disponibilidad de la opción actualizada correctamente.',

            'opcion' =>
                $opcionPasta->fresh(),
        ]);
    }
}