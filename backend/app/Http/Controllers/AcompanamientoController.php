<?php

namespace App\Http\Controllers;

use App\Models\Acompanamiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcompanamientoController extends Controller
{
    /**
     * Lista todos los acompañamientos para administración.
     *
     * Incluye disponibles y agotados.
     */
    public function index(): JsonResponse
    {
        $acompanamientos =
            Acompanamiento::query()
                ->ordenados()
                ->get();

        return response()->json(
            $acompanamientos
        );
    }

    /**
     * Registra un nuevo acompañamiento.
     */
    public function store(
        Request $request
    ): JsonResponse {
        $datos = $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique(
                        'acompanamientos',
                        'nombre'
                    ),
                ],

                /*
                 * Este precio se aplicará solamente
                 * cuando el acompañamiento ocupe la
                 * tercera posición o una posterior.
                 */
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
                'nombre.required' =>
                    'El nombre del acompañamiento es obligatorio.',

                'nombre.string' =>
                    'El nombre del acompañamiento no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe un acompañamiento con ese nombre.',

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

        $acompanamiento =
            Acompanamiento::create([
                'nombre' =>
                    trim($datos['nombre']),

                'precio_extra' =>
                    $datos['precio_extra'],

                'estado' =>
                    Acompanamiento::ESTADO_DISPONIBLE,

                'orden' =>
                    $datos['orden'] ?? 0,
            ]);

        return response()->json([
            'message' =>
                'Acompañamiento creado correctamente.',

            'acompanamiento' =>
                $acompanamiento,
        ], 201);
    }

    /**
     * Actualiza el nombre, precio y orden
     * de un acompañamiento.
     */
    public function update(
        Request $request,
        Acompanamiento $acompanamiento
    ): JsonResponse {
        $datos = $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'acompanamientos',
                        'nombre'
                    )->ignore(
                        $acompanamiento->id
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
                'nombre.required' =>
                    'El nombre del acompañamiento es obligatorio.',

                'nombre.string' =>
                    'El nombre del acompañamiento no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe un acompañamiento con ese nombre.',

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

        $acompanamiento->update([
            'nombre' =>
                trim($datos['nombre']),

            'precio_extra' =>
                $datos['precio_extra'],

            'orden' =>
                $datos['orden'] ?? 0,
        ]);

        return response()->json([
            'message' =>
                'Acompañamiento actualizado correctamente.',

            'acompanamiento' =>
                $acompanamiento->fresh(),
        ]);
    }

    /**
     * Cambia la disponibilidad del acompañamiento.
     */
    public function toggleEstado(
        Acompanamiento $acompanamiento
    ): JsonResponse {
        $acompanamiento->estado =
            $acompanamiento->estado ===
            Acompanamiento::ESTADO_DISPONIBLE
                ? Acompanamiento::ESTADO_AGOTADO
                : Acompanamiento::ESTADO_DISPONIBLE;

        $acompanamiento->save();

        return response()->json([
            'message' =>
                'Disponibilidad del acompañamiento actualizada correctamente.',

            'acompanamiento' =>
                $acompanamiento->fresh(),
        ]);
    }
}