<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class MensajeContacto extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLA
    |--------------------------------------------------------------------------
    */

    protected $table = 'mensajes_contacto';

    /*
    |--------------------------------------------------------------------------
    | ESTADOS DISPONIBLES
    |--------------------------------------------------------------------------
    */

    public const ESTADO_NUEVO = 'nuevo';

    public const ESTADO_LEIDO = 'leido';

    public const ESTADO_ATENDIDO = 'atendido';

    public const ESTADO_ARCHIVADO = 'archivado';

    public const ESTADOS = [
        self::ESTADO_NUEVO,
        self::ESTADO_LEIDO,
        self::ESTADO_ATENDIDO,
        self::ESTADO_ARCHIVADO,
    ];

    /*
    |--------------------------------------------------------------------------
    | CAMPOS ASIGNABLES
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'nombre',
        'telefono',
        'correo',
        'asunto',
        'mensaje',
        'estado',
        'leido_at',
        'atendido_at',
        'archivado_at',
        'atendido_por_user_id',
        'ip_address',
        'user_agent',
    ];

    /*
    |--------------------------------------------------------------------------
    | CONVERSIONES
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'leido_at' => 'datetime',
            'atendido_at' => 'datetime',
            'archivado_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | RELACIONES
    |--------------------------------------------------------------------------
    */

    /**
     * Administrador que atendió el mensaje.
     */
    public function atendidoPor(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'atendido_por_user_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CONSULTAS FRECUENTES
    |--------------------------------------------------------------------------
    */

    /**
     * Obtener únicamente mensajes nuevos.
     */
    public function scopeNuevos(
        Builder $query
    ): Builder {
        return $query->where(
            'estado',
            self::ESTADO_NUEVO
        );
    }

    /**
     * Obtener únicamente mensajes leídos.
     */
    public function scopeLeidos(
        Builder $query
    ): Builder {
        return $query->where(
            'estado',
            self::ESTADO_LEIDO
        );
    }

    /**
     * Obtener únicamente mensajes atendidos.
     */
    public function scopeAtendidos(
        Builder $query
    ): Builder {
        return $query->where(
            'estado',
            self::ESTADO_ATENDIDO
        );
    }

    /**
     * Obtener únicamente mensajes archivados.
     */
    public function scopeArchivados(
        Builder $query
    ): Builder {
        return $query->where(
            'estado',
            self::ESTADO_ARCHIVADO
        );
    }

    /**
     * Excluir los mensajes archivados.
     */
    public function scopeNoArchivados(
        Builder $query
    ): Builder {
        return $query->where(
            'estado',
            '!=',
            self::ESTADO_ARCHIVADO
        );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFICACIÓN DE ESTADOS
    |--------------------------------------------------------------------------
    */

    /**
     * Indica si el mensaje todavía es nuevo.
     */
    public function esNuevo(): bool
    {
        return $this->estado ===
            self::ESTADO_NUEVO;
    }

    /**
     * Indica si el mensaje fue leído.
     */
    public function estaLeido(): bool
    {
        return $this->estado ===
            self::ESTADO_LEIDO;
    }

    /**
     * Indica si el mensaje fue atendido.
     */
    public function estaAtendido(): bool
    {
        return $this->estado ===
            self::ESTADO_ATENDIDO;
    }

    /**
     * Indica si el mensaje está archivado.
     */
    public function estaArchivado(): bool
    {
        return $this->estado ===
            self::ESTADO_ARCHIVADO;
    }

    /*
    |--------------------------------------------------------------------------
    | CAMBIOS DE ESTADO
    |--------------------------------------------------------------------------
    */

    /**
     * Marcar el mensaje como leído.
     */
    public function marcarComoLeido(): void
    {
        if ($this->leido_at === null) {
            $this->leido_at =
                Carbon::now();
        }

        $this->estado =
            self::ESTADO_LEIDO;

        $this->save();
    }

    /**
     * Marcar el mensaje como atendido y registrar
     * al administrador responsable.
     */
    public function marcarComoAtendido(
        User $usuario
    ): void {
        if ($this->leido_at === null) {
            $this->leido_at =
                Carbon::now();
        }

        $this->estado =
            self::ESTADO_ATENDIDO;

        $this->atendido_at =
            Carbon::now();

        $this->archivado_at = null;

        $this->atendido_por_user_id =
            $usuario->id;

        $this->save();
    }

    /**
     * Archivar el mensaje.
     */
    public function archivar(): void
    {
        if ($this->leido_at === null) {
            $this->leido_at =
                Carbon::now();
        }

        $this->estado =
            self::ESTADO_ARCHIVADO;

        $this->archivado_at =
            Carbon::now();

        $this->save();
    }

    /**
     * Restaurar un mensaje archivado.
     *
     * Si ya había sido atendido, regresa al estado atendido.
     * En caso contrario, regresa al estado leído.
     */
    public function restaurar(): void
    {
        $this->estado =
            $this->atendido_at !== null
                ? self::ESTADO_ATENDIDO
                : self::ESTADO_LEIDO;

        $this->archivado_at = null;

        $this->save();
    }
}