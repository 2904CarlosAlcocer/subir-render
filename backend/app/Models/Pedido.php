<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $fillable = [
        'cliente_id',
        'codigo_tracking',
        'modalidad_entrega',
        'canal',
        'creado_por_user_id',
        'caja_sesion_id',
        'estado_pedido',
        'costo_empaque',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'costo_empaque' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    /**
     * |--------------------------------------------------------------------------
     * | RELACIONES
     * |--------------------------------------------------------------------------
     */

    public function detalles()
    {
        return $this->hasMany(DetallePedido::class, 'pedido_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'creado_por_user_id');
    }

    public function pago()
    {
        return $this->hasOne(PagoPedido::class, 'pedido_id');
    }

    public function cajaSesion()
    {
        return $this->belongsTo(CajaSesion::class, 'caja_sesion_id');
    }

    /**
     * |--------------------------------------------------------------------------
     * | MÉTODOS DE ESTADO
     * |--------------------------------------------------------------------------
     */

    public function esPedidoWeb(): bool
    {
        return $this->canal === 'web';
    }

    public function esPedidoCaja(): bool
    {
        return $this->canal === 'caja';
    }

    public function estaPendiente(): bool
    {
        return $this->estado_pedido === 'pendiente';
    }

    public function estaConfirmado(): bool
    {
        return $this->estado_pedido === 'confirmado';
    }

    public function estaEnPreparacion(): bool
    {
        return $this->estado_pedido === 'en_preparacion';
    }

    public function estaListo(): bool
    {
        return $this->estado_pedido === 'listo';
    }

    public function estaEntregado(): bool
    {
        return $this->estado_pedido === 'entregado';
    }

    public function estaCancelado(): bool
    {
        return $this->estado_pedido === 'cancelado';
    }

    /**
     * |--------------------------------------------------------------------------
     * | MÉTODOS DE PAGO
     * |--------------------------------------------------------------------------
     */

    /**
     * Verifica si el pedido ya está pagado.
     */
    public function estaPagado(): bool
    {
        return $this->pago?->estado_pago === 'pagado';
    }

    /**
     * Verifica si el pedido está pendiente de pago.
     */
    public function pagoPendiente(): bool
    {
        return $this->pago?->estado_pago === 'pendiente';
    }

    /**
     * Cobra el pedido con el método de pago seleccionado.
     * 
     * @throws ValidationException
     */
    public function cobrar(string $metodoPago, ?float $montoRecibido = null): void
    {
        // 1. Validar que no esté pagado
        if ($this->estaPagado()) {
            throw ValidationException::withMessages([
                'pedido' => ['Este pedido ya ha sido pagado.'],
            ]);
        }

        // 2. Validar que esté listo para cobrar
        if (!$this->estaListo() && $this->canal === 'web') {
            throw ValidationException::withMessages([
                'pedido' => ['El pedido debe estar listo para poder cobrarlo.'],
            ]);
        }

        // 3. Validar que tenga sesión de caja
        if (!$this->caja_sesion_id) {
            throw ValidationException::withMessages([
                'pedido' => ['El pedido no está asociado a una sesión de caja.'],
            ]);
        }

        // 4. Validar que la sesión esté abierta
        $sesion = $this->cajaSesion;
        if (!$sesion || !$sesion->estaAbierta()) {
            throw ValidationException::withMessages([
                'pedido' => ['La caja está cerrada. No se puede cobrar el pedido.'],
            ]);
        }

        // 5. Para efectivo, validar monto recibido
        if ($metodoPago === 'efectivo') {
            if ($montoRecibido === null || $montoRecibido < (float) $this->total) {
                throw ValidationException::withMessages([
                    'monto_recibido' => ['El monto recibido debe ser igual o mayor al total del pedido.'],
                ]);
            }
        }

        // 6. Actualizar el pago
        $pago = $this->pago ?? new PagoPedido(['pedido_id' => $this->id]);
        $pago->metodo_pago = $metodoPago;
        $pago->estado_pago = 'pagado';
        $pago->fecha_pago = now();
        
        if ($metodoPago === 'efectivo' && $montoRecibido !== null) {
            $pago->monto_recibido = $montoRecibido;
            $pago->cambio = round($montoRecibido - (float) $this->total, 2);
        }

        $pago->save();

        // 7. Actualizar el estado del pedido a entregado si era web
        if ($this->canal === 'web') {
            $this->estado_pedido = 'entregado';
            $this->save();
        }
    }

    /**
     * Obtiene el cambio para pago en efectivo.
     */
    public function calcularCambio(float $montoRecibido): float
    {
        return round(max(0, $montoRecibido - (float) $this->total), 2);
    }

    /**
     * Verifica si el monto recibido es suficiente.
     */
    public function montoRecibidoSuficiente(float $montoRecibido): bool
    {
        return $montoRecibido >= (float) $this->total;
    }
}