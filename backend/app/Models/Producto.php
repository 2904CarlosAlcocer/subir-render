<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';

    public const PERSONALIZACION_PASTA =
        'pasta';

    public const PERSONALIZACION_ACOMPANAMIENTOS =
        'acompanamientos';

    protected $fillable = [
        'categoria_id',
        'nombre',
        'descripcion',

        /*
         * Precio normal del producto.
         *
         * En las pizzas representa el precio
         * de la pizza grande.
         */
        'precio',

        /*
         * Precio opcional para pizza personal.
         *
         * En carnes, pastas, bebidas y productos
         * con un solo precio permanece en null.
         */
        'precio_personal',

        'imagen',
        'estado',
        'tipo_personalizacion',
    ];

    protected function casts(): array
    {
        return [
            'precio' =>
                'decimal:2',

            'precio_personal' =>
                'decimal:2',
        ];
    }

    /**
     * Categoría a la que pertenece el producto.
     */
    public function categoria()
    {
        return $this->belongsTo(
            Categoria::class
        );
    }

    /**
     * Ingredientes base asociados al producto.
     *
     * Esta relación se mantiene sin cambios para
     * conservar la personalización actual de pizzas.
     */
    public function ingredientes()
    {
        return $this->belongsToMany(
            Ingrediente::class,
            'producto_ingredientes'
        );
    }

    /**
     * Devuelve los ingredientes base del producto.
     */
    public function getIngredientesBaseAttribute()
    {
        return $this->ingredientes;
    }

    /**
     * Indica si el producto pertenece a la
     * categoría de pizzas.
     *
     * Esta lógica se conserva para no alterar
     * el personalizador de pizzas existente.
     */
    public function getEsPizzaAttribute(): bool
    {
        if (!$this->categoria) {
            return false;
        }

        return strtolower(
            trim(
                (string) $this->categoria->nombre
            )
        ) === 'pizzas';
    }

    /**
     * Indica si la pizza cuenta con precio
     * para tamaño personal.
     */
    public function getTienePrecioPersonalAttribute(): bool
    {
        if (!$this->es_pizza) {
            return false;
        }

        if ($this->precio_personal === null) {
            return false;
        }

        return (float) $this->precio_personal > 0;
    }

    /**
     * Indica si el producto debe abrir el
     * personalizador de pastas.
     */
    public function getEsPastaPersonalizableAttribute(): bool
    {
        return $this->tipo_personalizacion ===
            self::PERSONALIZACION_PASTA;
    }

    /**
     * Indica si el producto debe permitir
     * seleccionar acompañamientos.
     */
    public function getUsaAcompanamientosAttribute(): bool
    {
        return $this->tipo_personalizacion ===
            self::PERSONALIZACION_ACOMPANAMIENTOS;
    }
}