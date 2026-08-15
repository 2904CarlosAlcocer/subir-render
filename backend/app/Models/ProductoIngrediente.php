<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoIngrediente extends Model
{
    protected $table = 'producto_ingredientes';

    protected $fillable = [
        'producto_id',
        'ingrediente_id',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function ingrediente()
    {
        return $this->belongsTo(Ingrediente::class);
    }
}