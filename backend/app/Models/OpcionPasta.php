<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class OpcionPasta extends Model
{
    protected $table = 'opciones_pasta';

    public const GRUPO_TIPO_PASTA = 'tipo_pasta';

    public const GRUPO_PROTEINA = 'proteina';

    public const GRUPO_SALSA = 'salsa';

    public const GRUPO_INGREDIENTE = 'ingrediente';

    public const ESTADO_DISPONIBLE = 'disponible';

    public const ESTADO_AGOTADO = 'agotado';

    protected $fillable = [
        'grupo',
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
     * Obtiene los grupos válidos de opciones de pasta.
     */
    public static function gruposPermitidos(): array
    {
        return [
            self::GRUPO_TIPO_PASTA,
            self::GRUPO_PROTEINA,
            self::GRUPO_SALSA,
            self::GRUPO_INGREDIENTE,
        ];
    }

    /**
     * Filtra únicamente las opciones disponibles.
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
     * Filtra las opciones según su grupo.
     */
    public function scopeDelGrupo(
        Builder $query,
        string $grupo
    ): Builder {
        return $query->where(
            'grupo',
            $grupo
        );
    }

    /**
     * Ordena las opciones para mostrarlas en React.
     */
    public function scopeOrdenadas(
        Builder $query
    ): Builder {
        return $query
            ->orderBy('orden')
            ->orderBy('nombre');
    }

    /**
     * Indica si la opción se encuentra disponible.
     */
    public function getEstaDisponibleAttribute(): bool
    {
        return $this->estado ===
            self::ESTADO_DISPONIBLE;
    }

    /**
     * Indica si pertenece al grupo de tipos de pasta.
     */
    public function getEsTipoPastaAttribute(): bool
    {
        return $this->grupo ===
            self::GRUPO_TIPO_PASTA;
    }

    /**
     * Indica si pertenece al grupo de proteínas.
     */
    public function getEsProteinaAttribute(): bool
    {
        return $this->grupo ===
            self::GRUPO_PROTEINA;
    }

    /**
     * Indica si pertenece al grupo de salsas.
     */
    public function getEsSalsaAttribute(): bool
    {
        return $this->grupo ===
            self::GRUPO_SALSA;
    }

    /**
     * Indica si pertenece al grupo de ingredientes.
     */
    public function getEsIngredienteAttribute(): bool
    {
        return $this->grupo ===
            self::GRUPO_INGREDIENTE;
    }
}