<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ingrediente extends Model
{
    protected $table = 'ingredientes';

    protected $fillable = [
        'nombre',
        'precio_extra',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'precio_extra' => 'decimal:2',
        ];
    }

    /**
     * Productos que utilizan este ingrediente como ingrediente base.
     */
    public function productos(): BelongsToMany
    {
        return $this->belongsToMany(
            Producto::class,
            'producto_ingredientes',
            'ingrediente_id',
            'producto_id'
        );
    }

    /**
     * Indica si el ingrediente puede seleccionarse como extra.
     */
    public function getEstaDisponibleAttribute(): bool
    {
        return $this->estado === 'disponible';
    }
}