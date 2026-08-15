<?php

namespace App\Http\Controllers;

use App\Models\Ingrediente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IngredienteController extends Controller
{
    /**
     * Lista todos los ingredientes para el Dashboard.
     */
    public function index(): JsonResponse
    {
        $ingredientes = Ingrediente::query()
            ->orderBy('nombre')
            ->get();

        return response()->json(
            $ingredientes
        );
    }

    /**
     * Crea un nuevo ingrediente extra.
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
                    'unique:ingredientes,nombre',
                ],

                'precio_extra' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],

                'estado' => [
                    'nullable',
                    Rule::in([
                        'disponible',
                        'agotado',
                    ]),
                ],
            ],
            [
                'nombre.required' =>
                    'El nombre del ingrediente es obligatorio.',

                'nombre.string' =>
                    'El nombre del ingrediente no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe un ingrediente con ese nombre.',

                'precio_extra.required' =>
                    'El precio del ingrediente es obligatorio.',

                'precio_extra.numeric' =>
                    'El precio debe ser un número válido.',

                'precio_extra.min' =>
                    'El precio no puede ser negativo.',

                'precio_extra.max' =>
                    'El precio ingresado es demasiado alto.',

                'estado.in' =>
                    'El estado seleccionado no es válido.',
            ]
        );

        $ingrediente = Ingrediente::create([
            'nombre' =>
                trim($datos['nombre']),

            'precio_extra' =>
                $datos['precio_extra'],

            'estado' =>
                $datos['estado']
                ?? 'disponible',
        ]);

        return response()->json([
            'message' =>
                'Ingrediente creado correctamente.',

            'ingrediente' =>
                $ingrediente,
        ], 201);
    }

    /**
     * Actualiza el nombre y el precio del ingrediente.
     */
    public function update(
        Request $request,
        Ingrediente $ingrediente
    ): JsonResponse {
        $datos = $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique(
                        'ingredientes',
                        'nombre'
                    )->ignore(
                        $ingrediente->id
                    ),
                ],

                'precio_extra' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99999999.99',
                ],
            ],
            [
                'nombre.required' =>
                    'El nombre del ingrediente es obligatorio.',

                'nombre.string' =>
                    'El nombre del ingrediente no es válido.',

                'nombre.max' =>
                    'El nombre no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe un ingrediente con ese nombre.',

                'precio_extra.required' =>
                    'El precio del ingrediente es obligatorio.',

                'precio_extra.numeric' =>
                    'El precio debe ser un número válido.',

                'precio_extra.min' =>
                    'El precio no puede ser negativo.',

                'precio_extra.max' =>
                    'El precio ingresado es demasiado alto.',
            ]
        );

        $ingrediente->update([
            'nombre' =>
                trim($datos['nombre']),

            'precio_extra' =>
                $datos['precio_extra'],
        ]);

        return response()->json([
            'message' =>
                'Ingrediente actualizado correctamente.',

            'ingrediente' =>
                $ingrediente->fresh(),
        ]);
    }

    /**
     * Cambia el ingrediente entre disponible y agotado.
     */
    public function toggleEstado(
        Ingrediente $ingrediente
    ): JsonResponse {
        $ingrediente->estado =
            $ingrediente->estado ===
            'disponible'
                ? 'agotado'
                : 'disponible';

        $ingrediente->save();

        return response()->json([
            'message' =>
                'Estado del ingrediente actualizado.',

            'ingrediente' =>
                $ingrediente->fresh(),
        ]);
    }
}