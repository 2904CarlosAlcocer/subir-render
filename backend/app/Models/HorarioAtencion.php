<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HorarioAtencion extends Model
{
    protected $table = 'horarios_atencion';

    protected $fillable = [
        'dia_semana',
        'nombre_dia',
        'hora_apertura',
        'hora_ultimo_pedido',
        'hora_cierre',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'dia_semana' => 'integer',
            'activo' => 'boolean',
        ];
    }
}
