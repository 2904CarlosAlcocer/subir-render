<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    public function index()
    {
        return response()->json(Categoria::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $categoria = Categoria::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'estado' => 'activa',
        ]);

        return response()->json([
            'message' => 'Categoría creada correctamente',
            'categoria' => $categoria,
        ], 201);
    }

    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $categoria->update($validated);

        return response()->json([
            'message' => 'Categoría actualizada correctamente',
            'categoria' => $categoria,
        ]);
    }

    public function toggleEstado(Categoria $categoria)
    {
        $categoria->estado = $categoria->estado === 'activa' ? 'inactiva' : 'activa';
        $categoria->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'categoria' => $categoria,
        ]);
    }
}