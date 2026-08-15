<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetallePedido extends Model
{
    protected $table = 'detalle_pedidos';

    protected $fillable = [
        'pedido_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'extras',
        'alergias',
        'observaciones',
        'personalizacion',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'integer',
            'precio_unitario' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'personalizacion' => 'array',
        ];
    }

    /**
     * Producto correspondiente a esta línea del pedido.
     */
    public function producto()
    {
        return $this->belongsTo(
            Producto::class,
            'producto_id'
        );
    }

    /**
     * Pedido al que pertenece esta línea.
     */
    public function pedido()
    {
        return $this->belongsTo(
            Pedido::class,
            'pedido_id'
        );
    }
}