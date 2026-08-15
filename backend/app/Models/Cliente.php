<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'user_id',      // ← NUEVO
        'nombre',
        'telefono',
        'correo',
    ];

    // 🔥 RELACIÓN CON USUARIO
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'cliente_id');
    }
}