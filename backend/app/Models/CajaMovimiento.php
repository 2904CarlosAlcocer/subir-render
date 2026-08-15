<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaMovimiento extends Model
{
    protected $table = 'caja_movimientos';

    protected $fillable = [
        'caja_sesion_id',
        'usuario_id',
        'tipo',
        'monto',
        'motivo',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
        ];
    }

    public function cajaSesion()
    {
        return $this->belongsTo(CajaSesion::class, 'caja_sesion_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function esEntrada(): bool
    {
        return $this->tipo === 'entrada';
    }

    public function esSalida(): bool
    {
        return $this->tipo === 'salida';
    }
}