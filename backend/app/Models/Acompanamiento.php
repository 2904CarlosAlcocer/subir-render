<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Acompanamiento extends Model
{
    protected $table = 'acompanamientos';

    public const ESTADO_DISPONIBLE = 'disponible';

    public const ESTADO_AGOTADO = 'agotado';

    protected $fillable = [
        'nombre',
        'precio_extra',
        'estado',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'precio_extra' => 'decimal:2',
            'orden' => 'integer',
        ];
    }

    /**
     * Filtra únicamente los acompañamientos disponibles.
     */
    public function scopeDisponibles(
        Builder $query
    ): Builder {
        return $query->where(
            'estado',
            self::ESTADO_DISPONIBLE
        );
    }

    /**
     * Ordena los acompañamientos para mostrarlos
     * en el menú y en el panel administrativo.
     */
    public function scopeOrdenados(
        Builder $query
    ): Builder {
        return $query
            ->orderBy('orden')
            ->orderBy('nombre');
    }

    /**
     * Indica si el acompañamiento está disponible.
     */
    public function getEstaDisponibleAttribute(): bool
    {
        return $this->estado ===
            self::ESTADO_DISPONIBLE;
    }
}