<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Lista todo el personal (admin, cocina, caja).
     */
    public function index(Request $request)
    {
        $usuarios = User::whereIn('rol', ['admin', 'cocina', 'caja'])
            ->select('id', 'name', 'email', 'rol', 'estado', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($usuarios);
    }

    /**
     * Crea un nuevo usuario de personal.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'rol' => ['required', Rule::in(['admin', 'cocina', 'caja'])],
        ]);

        $usuario = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'rol' => $validated['rol'],
            'estado' => 'activo',
        ]);

        return response()->json([
            'message' => 'Usuario creado correctamente',
            'user' => $usuario->only(['id', 'name', 'email', 'rol', 'estado']),
        ], 201);
    }

    /**
     * Activa o desactiva un usuario (no se borra, se desactiva).
     */
    public function toggleEstado(Request $request, User $user)
    {
        $user->estado = $user->estado === 'activo' ? 'inactivo' : 'activo';
        $user->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'user' => $user->only(['id', 'name', 'email', 'rol', 'estado']),
        ]);
    }
}