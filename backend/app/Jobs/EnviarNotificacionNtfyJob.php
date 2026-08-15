<?php

namespace App\Jobs;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EnviarNotificacionNtfyJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Intentos del job.
     */
    public int $tries = 3;

    /**
     * Tiempo máximo del job.
     */
    public int $timeout = 20;

    public function __construct(
        public int $pedidoId
    ) {
    }

    public function handle(): void
    {
        /*
         * =========================================================
         * VERIFICAR SI NTFY ESTÁ HABILITADO
         * =========================================================
         */
        if (
            !config(
                'services.ntfy.enabled',
                true
            )
        ) {
            Log::warning(
                'NTFY está deshabilitado.',
                [
                    'pedido_id' =>
                        $this->pedidoId,
                ]
            );

            return;
        }

        /*
         * =========================================================
         * BUSCAR PEDIDO
         * =========================================================
         */
        $pedido = Pedido::query()
            ->with([
                'detalles.producto',
                'cliente',
                'pago',
            ])
            ->find($this->pedidoId);

        if (!$pedido) {
            Log::warning(
                'No se pudo enviar ntfy porque el pedido no existe.',
                [
                    'pedido_id' =>
                        $this->pedidoId,
                ]
            );

            return;
        }

        /*
         * =========================================================
         * CONFIGURACIÓN NTFY
         * =========================================================
         */
        $servidor = rtrim(
            (string) config(
                'services.ntfy.server',
                'https://ntfy.sh'
            ),
            '/'
        );

        $tema = trim(
            (string) config(
                'services.ntfy.topic',
                ''
            )
        );

        if (
            $servidor === ''
            || $tema === ''
        ) {
            Log::error(
                'No se pudo enviar ntfy porque falta server o topic.',
                [
                    'pedido_id' =>
                        $pedido->id,

                    'server' =>
                        $servidor,

                    'topic_configurado' =>
                        $tema !== '',
                ]
            );

            return;
        }

        /*
         * =========================================================
         * CLIENTE
         * =========================================================
         */
        $clienteNombre =
            'Sin cliente';

        if ($pedido->cliente) {
            $clienteNombre = trim(
                (
                    $pedido
                        ->cliente
                        ->nombre
                    ?? ''
                )
                . ' '
                . (
                    $pedido
                        ->cliente
                        ->apellido
                    ?? ''
                )
            );

            if ($clienteNombre === '') {
                $clienteNombre =
                    'Sin cliente';
            }
        }

        /*
         * =========================================================
         * PRODUCTOS
         * =========================================================
         */
        $productos = $pedido
            ->detalles
            ->map(
                function ($detalle) {
                    $nombreProducto =
                        $detalle->producto
                        ? $detalle
                            ->producto
                            ->nombre
                        : 'Producto';

                    $linea =
                        '- '
                        . $nombreProducto
                        . ' x'
                        . $detalle->cantidad;

                    if (
                        !empty(
                            $detalle->extras
                        )
                    ) {
                        $linea .=
                            ' | Extras: '
                            . $detalle->extras;
                    }

                    if (
                        !empty(
                            $detalle->observaciones
                        )
                    ) {
                        $linea .=
                            ' | Obs: '
                            . $detalle
                                ->observaciones;
                    }

                    if (
                        !empty(
                            $detalle->alergias
                        )
                    ) {
                        $linea .=
                            ' | Alergias: '
                            . $detalle
                                ->alergias;
                    }

                    return $linea;
                }
            )
            ->implode(
                PHP_EOL
            );

        if ($productos === '') {
            $productos =
                '- Sin productos';
        }

        /*
         * =========================================================
         * MODALIDAD
         * =========================================================
         */
        $modalidad = match (
            $pedido->modalidad_entrega
        ) {
            'consumo_local' =>
                'Consumo en el local',

            'retiro' =>
                'Para retirar',

            default =>
                ucfirst(
                    str_replace(
                        '_',
                        ' ',
                        (string)
                            $pedido
                            ->modalidad_entrega
                    )
                ),
        };

        /*
         * =========================================================
         * CANAL
         * =========================================================
         */
        $canal = match (
            $pedido->canal
        ) {
            'web' =>
                'Página web',

            'caja' =>
                'Punto de venta',

            default =>
                ucfirst(
                    (string)
                        $pedido->canal
                ),
        };

        /*
         * =========================================================
         * PAGO
         *
         * IMPORTANTE:
         *
         * NO SE CANCELA LA NOTIFICACIÓN SI NO HAY MÉTODO DE PAGO.
         *
         * En el flujo actual de Rooster CR el pedido se crea primero
         * y el método se selecciona posteriormente cuando Caja cobra.
         * =========================================================
         */
        $metodoPago = null;
        $estadoPago = null;

        if ($pedido->pago) {
            $metodoPago =
                $pedido
                    ->pago
                    ->getRawOriginal(
                        'metodo_pago'
                    );

            $estadoPago =
                $pedido
                    ->pago
                    ->getRawOriginal(
                        'estado_pago'
                    );
        }

        $metodoPagoTexto = match (
            $metodoPago
        ) {
            'sinpe' =>
                'SINPE Móvil',

            'efectivo' =>
                'Efectivo',

            'tarjeta' =>
                'Datáfono',

            null, '' =>
                'Por definir en caja',

            default =>
                ucfirst(
                    (string)
                        $metodoPago
                ),
        };

        $estadoPagoTexto = match (
            $estadoPago
        ) {
            'pagado' =>
                'Pagado',

            'pendiente' =>
                'Pendiente de cobro',

            'pendiente_comprobante' =>
                'Pendiente de comprobante',

            'pendiente_verificacion' =>
                'Pendiente de verificación',

            'verificado' =>
                'Verificado',

            'rechazado' =>
                'Rechazado',

            'no_requiere' =>
                'Pendiente de cobro',

            null, '' =>
                'Pendiente de cobro',

            default =>
                ucfirst(
                    str_replace(
                        '_',
                        ' ',
                        (string)
                            $estadoPago
                    )
                ),
        };

        /*
         * =========================================================
         * MENSAJE
         * =========================================================
         */
        $mensaje = implode(
            PHP_EOL,
            [
                'Código: '
                    . $pedido
                        ->codigo_tracking,

                'Cliente: '
                    . $clienteNombre,

                'Origen: '
                    . $canal,

                'Modalidad: '
                    . $modalidad,

                '',

                'Productos:',

                $productos,

                '',

                'Total: ₡'
                    . number_format(
                        (float)
                            $pedido->total,
                        0,
                        ',',
                        '.'
                    ),

                'Estado de pago: '
                    . $estadoPagoTexto,

                'Método de pago: '
                    . $metodoPagoTexto,
            ]
        );

        /*
         * =========================================================
         * ENVIAR A NTFY
         * =========================================================
         */
        try {
            Log::info(
                'Intentando enviar notificación ntfy.',
                [
                    'pedido_id' =>
                        $pedido->id,

                    'codigo_tracking' =>
                        $pedido
                            ->codigo_tracking,

                    'server' =>
                        $servidor,

                    'topic' =>
                        $tema,
                ]
            );

            $response = Http::connectTimeout(5)
                ->timeout(10)
                ->retry(
                    3,
                    1000
                )
                ->withHeaders([
                    'Title' =>
                        'Nuevo pedido '
                        . $pedido
                            ->codigo_tracking,

                    'Priority' =>
                        'high',

                    'Tags' =>
                        'pizza',
                ])
                ->withBody(
                    $mensaje,
                    'text/plain; charset=utf-8'
                )
                ->post(
                    $servidor
                    . '/'
                    . rawurlencode(
                        $tema
                    )
                );

            $response->throw();

            Log::info(
                'Notificación ntfy enviada correctamente.',
                [
                    'pedido_id' =>
                        $pedido->id,

                    'codigo_tracking' =>
                        $pedido
                            ->codigo_tracking,

                    'http_status' =>
                        $response
                            ->status(),
                ]
            );
        } catch (\Throwable $error) {
            Log::error(
                'Error enviando la notificación ntfy.',
                [
                    'pedido_id' =>
                        $pedido->id,

                    'codigo_tracking' =>
                        $pedido
                            ->codigo_tracking,

                    'error' =>
                        $error
                            ->getMessage(),
                ]
            );

            /*
             * IMPORTANTE:
             *
             * Lanzamos nuevamente el error para que Laravel
             * considere que el Job falló y pueda reintentarlo.
             *
             * Antes se atrapaba el error y el worker mostraba
             * DONE aunque ntfy no hubiera enviado nada.
             */
            throw $error;
        }
    }
}