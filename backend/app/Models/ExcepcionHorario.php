<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExcepcionHorario extends Model
{
    protected $table = 'excepciones_horario';

    protected $fillable = [
        'fecha',
        'hora_apertura',
        'hora_ultimo_pedido',
        'hora_cierre',
        'pedidos_pausados',
        'motivo',
        'creado_por_user_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'pedidos_pausados' => 'boolean',
        ];
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'creado_por_user_id');
    }
}
