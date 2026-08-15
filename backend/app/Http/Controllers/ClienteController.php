<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClienteController extends Controller
{
    public function index()
    {
        return response()->json(Cliente::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:150|unique:clientes,correo',
        ]);

        $cliente = Cliente::create($validated);
        return response()->json($cliente, 201);
    }

    public function show(Cliente $cliente)
    {
        return response()->json($cliente);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'correo' => ['nullable', 'email', 'max:150', Rule::unique('clientes')->ignore($cliente->id)],
        ]);

        $cliente->update($validated);
        return response()->json($cliente);
    }
}