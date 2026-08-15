<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaSesion extends Model
{
    protected $table = 'caja_sesiones';

    protected $fillable = [
        'usuario_apertura_id',
        'usuario_asignado_id',
        'usuario_cierre_id',
        'fecha_apertura',
        'fecha_cierre',
        'monto_inicial',
        'observaciones_apertura',
        'ventas_efectivo',
        'ventas_sinpe',
        'ventas_tarjeta',
        'total_ventas',
        'cantidad_pedidos',
        'entradas_efectivo',
        'salidas_efectivo',
        'efectivo_esperado',
        'efectivo_contado',
        'diferencia',
        'resultado_arqueo',
        'motivo_diferencia',
        'detalle_diferencia',
        'estado',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_apertura' => 'datetime',
            'fecha_cierre' => 'datetime',
            'monto_inicial' => 'decimal:2',
            'ventas_efectivo' => 'decimal:2',
            'ventas_sinpe' => 'decimal:2',
            'ventas_tarjeta' => 'decimal:2',
            'total_ventas' => 'decimal:2',
            'cantidad_pedidos' => 'integer',
            'entradas_efectivo' => 'decimal:2',
            'salidas_efectivo' => 'decimal:2',
            'efectivo_esperado' => 'decimal:2',
            'efectivo_contado' => 'decimal:2',
            'diferencia' => 'decimal:2',
        ];
    }

    /**
     * |--------------------------------------------------------------------------
     * | RELACIONES
     * |--------------------------------------------------------------------------
     */

    /**
     * Usuario que abrió la caja (siempre Administrador).
     */
    public function usuarioApertura()
    {
        return $this->belongsTo(User::class, 'usuario_apertura_id');
    }

    /**
     * Usuario asignado para trabajar la caja (Administrador o Caja).
     */
    public function usuarioAsignado()
    {
        return $this->belongsTo(User::class, 'usuario_asignado_id');
    }

    /**
     * Usuario que cerró la caja (siempre Administrador).
     */
    public function usuarioCierre()
    {
        return $this->belongsTo(User::class, 'usuario_cierre_id');
    }

    /**
     * Pedidos asociados a esta sesión de caja.
     */
    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'caja_sesion_id');
    }

    /**
     * Movimientos de caja de esta sesión.
     */
    public function movimientos()
    {
        return $this->hasMany(CajaMovimiento::class, 'caja_sesion_id')
            ->orderByDesc('created_at');
    }

    /**
     * |--------------------------------------------------------------------------
     * | MÉTODOS DE ESTADO
     * |--------------------------------------------------------------------------
     */

    /**
     * Verifica si la caja está abierta.
     */
    public function estaAbierta(): bool
    {
        return $this->estado === 'abierta';
    }

    /**
     * Verifica si la caja está cerrada.
     */
    public function estaCerrada(): bool
    {
        return $this->estado === 'cerrada';
    }

    /**
     * Verifica si el usuario tiene permiso para operar esta caja.
     */
    public function usuarioPuedeOperar(User $usuario): bool
    {
        $rol = $usuario->rolNormalizado();

        // Administrador siempre puede operar cualquier caja
        if ($rol === 'admin') {
            return true;
        }

        // Caja solo puede operar si está asignado
        if ($rol === 'caja') {
            return (int) $this->usuario_asignado_id === (int) $usuario->id;
        }

        return false;
    }

    /**
     * Obtiene el nombre del usuario asignado.
     */
    public function getNombreAsignadoAttribute(): string
    {
        return $this->usuarioAsignado?->name ?? 'Sin asignar';
    }

    /**
     * Obtiene el nombre del usuario que abrió.
     */
    public function getNombreAperturaAttribute(): string
    {
        return $this->usuarioApertura?->name ?? 'Desconocido';
    }

    /**
     * Obtiene el nombre del usuario que cerró.
     */
    public function getNombreCierreAttribute(): string
    {
        return $this->usuarioCierre?->name ?? '—';
    }
}