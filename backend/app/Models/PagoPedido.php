<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoPedido extends Model
{
    protected $table = 'pagos_pedidos';

    protected $fillable = [
        'pedido_id',
        'metodo_pago',
        'estado_pago',
        'monto_recibido',
        'cambio',
        'cobrado_por_user_id',
        'comprobante_binario',
        'comprobante_nombre',
        'comprobante_mime',
        'comprobante_tamano',
        'fecha_comprobante',
        'fecha_pago',
        'fecha_verificacion',
    ];

    protected $hidden = [
        'comprobante_binario',
    ];

    protected function casts(): array
    {
        return [
            'monto_recibido' => 'decimal:2',
            'cambio' => 'decimal:2',
            'comprobante_tamano' => 'integer',
            'fecha_comprobante' => 'datetime',
            'fecha_pago' => 'datetime',
            'fecha_verificacion' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Relación con el pedido.
     */
    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }

    /**
     * Relación con el usuario que cobró.
     */
    public function cobradoPor()
    {
        return $this->belongsTo(User::class, 'cobrado_por_user_id');
    }

    /**
     * Determina si el pago requiere comprobante.
     */
    public function requiereComprobante(): bool
    {
        return $this->metodo_pago === 'sinpe';
    }

    /**
     * Determina si el comprobante está pendiente de verificación.
     */
    public function estaPendienteVerificacion(): bool
    {
        return $this->estado_pago === 'pendiente_verificacion';
    }

    /**
     * Determina si el pago ya fue verificado.
     */
    public function estaVerificado(): bool
    {
        return $this->estado_pago === 'verificado';
    }

    /**
     * Determina si el pago fue rechazado.
     */
    public function estaRechazado(): bool
    {
        return $this->estado_pago === 'rechazado';
    }

    /**
     * Determina si el pago está pagado.
     */
    public function estaPagado(): bool
    {
        return $this->estado_pago === 'pagado';
    }

    /**
     * Obtiene la URL para descargar el comprobante.
     */
    public function getComprobanteUrlAttribute(): ?string
    {
        if ($this->comprobante_binario === null) {
            return null;
        }

        return route('api.pagos.comprobante', ['pago' => $this->id]);
    }
}