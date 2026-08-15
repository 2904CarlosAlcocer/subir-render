<?php

namespace App\Services;

use App\Models\ExcepcionHorario;
use App\Models\HorarioAtencion;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class HorarioPedidosService
{
    public const ZONA_HORARIA = 'America/Costa_Rica';
    public const MINUTOS_ADVERTENCIA = 30;

    public function estadoActual(?Carbon $momento = null): array
    {
        $ahora = ($momento ?: Carbon::now(self::ZONA_HORARIA))
            ->copy()
            ->setTimezone(self::ZONA_HORARIA);

        $horarioBase = $this->obtenerHorarioBase($ahora->dayOfWeek);
        $excepcion = ExcepcionHorario::query()
            ->whereDate('fecha', $ahora->toDateString())
            ->first();

        $activo = (bool) $horarioBase['activo'];
        $horaAperturaTexto = $excepcion?->hora_apertura ?: $horarioBase['hora_apertura'];
        $horaUltimoPedidoTexto = $excepcion?->hora_ultimo_pedido ?: $horarioBase['hora_ultimo_pedido'];
        $horaCierreTexto = $excepcion?->hora_cierre ?: $horarioBase['hora_cierre'];

        $horaApertura = $this->momentoDelDia($ahora, $horaAperturaTexto);
        $horaUltimoPedido = $this->momentoDelDia($ahora, $horaUltimoPedidoTexto);
        $horaCierre = $this->momentoDelDia($ahora, $horaCierreTexto);

        $pedidosPausados = (bool) ($excepcion?->pedidos_pausados ?? false);
        $localAbierto = $activo
            && $ahora->greaterThanOrEqualTo($horaApertura)
            && $ahora->lessThan($horaCierre);

        $aceptaPedidos = $localAbierto
            && !$pedidosPausados
            && $ahora->lessThan($horaUltimoPedido);

        $baseUltimoPedido = $this->momentoDelDia(
            $ahora,
            $horarioBase['hora_ultimo_pedido']
        );

        $extendido = $excepcion?->hora_ultimo_pedido !== null
            && !$horaUltimoPedido->equalTo($baseUltimoPedido);

        $advertenciaDesde = $horaUltimoPedido
            ->copy()
            ->subMinutes(self::MINUTOS_ADVERTENCIA);

        $ultimosPedidos = $aceptaPedidos
            && $ahora->greaterThanOrEqualTo($advertenciaDesde);

        [$codigoEstado, $titulo, $mensaje] = $this->resolverMensaje(
            activo: $activo,
            localAbierto: $localAbierto,
            aceptaPedidos: $aceptaPedidos,
            pedidosPausados: $pedidosPausados,
            ultimosPedidos: $ultimosPedidos,
            extendido: $extendido,
            horaApertura: $horaApertura,
            horaUltimoPedido: $horaUltimoPedido,
            horaCierre: $horaCierre,
            motivo: $excepcion?->motivo,
            ahora: $ahora,
        );

        $proximaApertura = $this->proximaApertura($ahora);
        $siguienteCambio = $this->siguienteCambio(
            $ahora,
            $horaApertura,
            $horaUltimoPedido,
            $horaCierre,
            $activo,
        );

        return [
            'zona_horaria' => self::ZONA_HORARIA,
            'fecha' => $ahora->toDateString(),
            'hora_servidor' => $ahora->format('H:i:s'),
            'estado' => $codigoEstado,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'acepta_pedidos' => $aceptaPedidos,
            'abierta' => $aceptaPedidos,
            'local_abierto' => $localAbierto,
            'pedidos_pausados' => $pedidosPausados,
            'horario_extendido' => $extendido,
            'ultimos_pedidos' => $ultimosPedidos,
            'motivo' => $excepcion?->motivo,
            'hora_apertura' => $this->horaCorta($horaAperturaTexto),
            'hora_ultimo_pedido' => $this->horaCorta($horaUltimoPedidoTexto),
            'hora_cierre' => $this->horaCorta($horaCierreTexto),
            'hora_apertura_humana' => $this->horaHumana($horaApertura),
            'hora_ultimo_pedido_humana' => $this->horaHumana($horaUltimoPedido),
            'hora_cierre_humana' => $this->horaHumana($horaCierre),
            'proxima_apertura' => $proximaApertura,
            'segundos_hasta_cambio' => $siguienteCambio
                ? max(0, $ahora->diffInSeconds($siguienteCambio, false))
                : null,
            'excepcion_hoy' => $excepcion !== null,
            'extension_minutos' => $extendido
                ? $baseUltimoPedido->diffInMinutes($horaUltimoPedido, false)
                : 0,
        ];
    }

    public function configuracionCompleta(): array
    {
        return [
            'estado' => $this->estadoActual(),
            'horarios' => HorarioAtencion::query()
                ->orderBy('dia_semana')
                ->get()
                ->map(fn (HorarioAtencion $horario) => [
                    'id' => $horario->id,
                    'dia_semana' => $horario->dia_semana,
                    'nombre_dia' => $horario->nombre_dia,
                    'hora_apertura' => $this->horaCorta($horario->hora_apertura),
                    'hora_ultimo_pedido' => $this->horaCorta($horario->hora_ultimo_pedido),
                    'hora_cierre' => $this->horaCorta($horario->hora_cierre),
                    'activo' => $horario->activo,
                ])
                ->values(),
            'excepcion_hoy' => ExcepcionHorario::query()
                ->whereDate('fecha', Carbon::now(self::ZONA_HORARIA)->toDateString())
                ->first(),
        ];
    }

    public function actualizarHorariosSemanales(array $horarios): void
    {
        DB::transaction(function () use ($horarios) {
            foreach ($horarios as $horario) {
                HorarioAtencion::query()->updateOrCreate(
                    ['dia_semana' => (int) $horario['dia_semana']],
                    [
                        'nombre_dia' => $horario['nombre_dia'],
                        'hora_apertura' => $horario['hora_apertura'],
                        'hora_ultimo_pedido' => $horario['hora_ultimo_pedido'],
                        'hora_cierre' => $horario['hora_cierre'],
                        'activo' => (bool) $horario['activo'],
                    ]
                );
            }
        });
    }

    public function extenderHoy(
        ?int $minutos,
        ?string $horaPersonalizada,
        ?int $usuarioId
    ): ExcepcionHorario {
        $ahora = Carbon::now(self::ZONA_HORARIA);
        $horarioBase = $this->obtenerHorarioBase($ahora->dayOfWeek);
        $excepcionActual = ExcepcionHorario::query()
            ->whereDate('fecha', $ahora->toDateString())
            ->first();

        $horaActualTexto = $excepcionActual?->hora_ultimo_pedido
            ?: $horarioBase['hora_ultimo_pedido'];

        $horaActual = $this->momentoDelDia($ahora, $horaActualTexto);

        if ($horaPersonalizada) {
            $nuevaHoraUltimoPedido = $this->momentoDelDia($ahora, $horaPersonalizada);
        } elseif ($minutos !== null) {
            $ahoraSinSegundos = $ahora->copy()->setSecond(0);
            $puntoInicio = $horaActual->greaterThan($ahoraSinSegundos)
                ? $horaActual
                : $ahoraSinSegundos;

            $nuevaHoraUltimoPedido = $puntoInicio->copy()->addMinutes($minutos);
        } else {
            throw new InvalidArgumentException('Debes indicar los minutos o una hora personalizada.');
        }

        if ($nuevaHoraUltimoPedido->lessThanOrEqualTo($ahora)) {
            throw new InvalidArgumentException('La nueva hora límite debe ser posterior a la hora actual.');
        }

        if ($nuevaHoraUltimoPedido->format('Y-m-d') !== $ahora->format('Y-m-d')) {
            throw new InvalidArgumentException('La extensión debe terminar el mismo día.');
        }

        $horaCierreActualTexto = $excepcionActual?->hora_cierre
            ?: $horarioBase['hora_cierre'];
        $horaCierreActual = $this->momentoDelDia($ahora, $horaCierreActualTexto);

        $nuevaHoraCierre = $horaCierreActual;

        if ($nuevaHoraUltimoPedido->greaterThanOrEqualTo($horaCierreActual)) {
            $nuevaHoraCierre = $nuevaHoraUltimoPedido->copy()->addMinutes(30);

            if ($nuevaHoraCierre->format('Y-m-d') !== $ahora->format('Y-m-d')) {
                throw new InvalidArgumentException('La hora solicitada extendería el cierre más allá de la medianoche.');
            }
        }

        return ExcepcionHorario::query()->updateOrCreate(
            ['fecha' => $ahora->toDateString()],
            [
                'hora_ultimo_pedido' => $nuevaHoraUltimoPedido->format('H:i:s'),
                'hora_cierre' => $nuevaHoraCierre->format('H:i:s'),
                'creado_por_user_id' => $usuarioId,
            ]
        );
    }

    public function pausarHoy(?string $motivo, ?int $usuarioId): ExcepcionHorario
    {
        $fecha = Carbon::now(self::ZONA_HORARIA)->toDateString();

        return ExcepcionHorario::query()->updateOrCreate(
            ['fecha' => $fecha],
            [
                'pedidos_pausados' => true,
                'motivo' => $motivo ?: 'Pedidos pausados temporalmente por el administrador.',
                'creado_por_user_id' => $usuarioId,
            ]
        );
    }

    public function reanudarHoy(?int $usuarioId): void
    {
        $fecha = Carbon::now(self::ZONA_HORARIA)->toDateString();
        $excepcion = ExcepcionHorario::query()->whereDate('fecha', $fecha)->first();

        if (!$excepcion) {
            return;
        }

        $excepcion->update([
            'pedidos_pausados' => false,
            'motivo' => null,
            'creado_por_user_id' => $usuarioId,
        ]);

        $this->eliminarSiVacia($excepcion);
    }

    public function cancelarExtensionHoy(?int $usuarioId): void
    {
        $fecha = Carbon::now(self::ZONA_HORARIA)->toDateString();
        $excepcion = ExcepcionHorario::query()->whereDate('fecha', $fecha)->first();

        if (!$excepcion) {
            return;
        }

        $excepcion->update([
            'hora_apertura' => null,
            'hora_ultimo_pedido' => null,
            'hora_cierre' => null,
            'creado_por_user_id' => $usuarioId,
        ]);

        $this->eliminarSiVacia($excepcion);
    }

    private function resolverMensaje(
        bool $activo,
        bool $localAbierto,
        bool $aceptaPedidos,
        bool $pedidosPausados,
        bool $ultimosPedidos,
        bool $extendido,
        Carbon $horaApertura,
        Carbon $horaUltimoPedido,
        Carbon $horaCierre,
        ?string $motivo,
        Carbon $ahora,
    ): array {
        if ($pedidosPausados) {
            return [
                'pausado',
                'Pedidos pausados temporalmente',
                $motivo ?: 'En este momento no estamos recibiendo nuevas órdenes.',
            ];
        }

        if (!$activo || !$localAbierto) {
            if ($activo && $ahora->lessThan($horaApertura)) {
                return [
                    'cerrado',
                    'Aún estamos cerrados',
                    'Hoy recibimos pedidos desde las '.$this->horaHumana($horaApertura).'.',
                ];
            }

            return [
                'cerrado',
                'Cerrado por hoy',
                'El restaurante vuelve a abrir en su próximo horario de atención.',
            ];
        }

        if (!$aceptaPedidos) {
            return [
                'pedidos_cerrados',
                'Pedidos cerrados por hoy',
                'El restaurante permanece abierto hasta las '.$this->horaHumana($horaCierre).'.',
            ];
        }

        if ($extendido) {
            return [
                'horario_extendido',
                'Horario extendido hoy',
                'Estamos recibiendo pedidos hasta las '.$this->horaHumana($horaUltimoPedido).'.',
            ];
        }

        if ($ultimosPedidos) {
            return [
                'ultimos_pedidos',
                'Últimos pedidos del día',
                'Recibimos órdenes hasta las '.$this->horaHumana($horaUltimoPedido).'.',
            ];
        }

        return [
            'abierto',
            'Abierto y recibiendo pedidos',
            'Últimos pedidos a las '.$this->horaHumana($horaUltimoPedido).'.',
        ];
    }

    private function proximaApertura(Carbon $ahora): ?array
    {
        for ($desplazamiento = 0; $desplazamiento <= 7; $desplazamiento++) {
            $fecha = $ahora->copy()->addDays($desplazamiento);
            $horario = $this->obtenerHorarioBase($fecha->dayOfWeek);

            if (!$horario['activo']) {
                continue;
            }

            $apertura = $this->momentoDelDia($fecha, $horario['hora_apertura']);

            if ($apertura->greaterThan($ahora)) {
                return [
                    'fecha' => $apertura->toDateString(),
                    'hora' => $apertura->format('H:i'),
                    'hora_humana' => $this->horaHumana($apertura),
                    'dia' => $horario['nombre_dia'],
                ];
            }
        }

        return null;
    }

    private function siguienteCambio(
        Carbon $ahora,
        Carbon $apertura,
        Carbon $ultimoPedido,
        Carbon $cierre,
        bool $activo,
    ): ?Carbon {
        if (!$activo) {
            return null;
        }

        if ($ahora->lessThan($apertura)) {
            return $apertura;
        }

        if ($ahora->lessThan($ultimoPedido)) {
            return $ultimoPedido;
        }

        if ($ahora->lessThan($cierre)) {
            return $cierre;
        }

        return null;
    }

    private function obtenerHorarioBase(int $diaSemana): array
    {
        $horario = HorarioAtencion::query()
            ->where('dia_semana', $diaSemana)
            ->first();

        if ($horario) {
            return [
                'dia_semana' => $horario->dia_semana,
                'nombre_dia' => $horario->nombre_dia,
                'hora_apertura' => $horario->hora_apertura,
                'hora_ultimo_pedido' => $horario->hora_ultimo_pedido,
                'hora_cierre' => $horario->hora_cierre,
                'activo' => $horario->activo,
            ];
        }

        $nombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        return [
            'dia_semana' => $diaSemana,
            'nombre_dia' => $nombres[$diaSemana] ?? 'Día',
            'hora_apertura' => '12:00:00',
            'hora_ultimo_pedido' => '21:30:00',
            'hora_cierre' => '22:00:00',
            'activo' => true,
        ];
    }

    private function momentoDelDia(Carbon $fecha, string $hora): Carbon
    {
        $partes = array_map('intval', explode(':', $hora));
        $partes = array_pad($partes, 3, 0);

        return $fecha->copy()->setTime($partes[0], $partes[1], $partes[2]);
    }

    private function horaHumana(Carbon $hora): string
    {
        $periodo = $hora->format('A') === 'AM'
            ? 'a. m.'
            : 'p. m.';

        return $hora->format('g:i').' '.$periodo;
    }

    private function horaCorta(?string $hora): ?string
    {
        return $hora ? substr($hora, 0, 5) : null;
    }

    private function eliminarSiVacia(ExcepcionHorario $excepcion): void
    {
        if (
            !$excepcion->pedidos_pausados
            && $excepcion->hora_apertura === null
            && $excepcion->hora_ultimo_pedido === null
            && $excepcion->hora_cierre === null
        ) {
            $excepcion->delete();
        }
    }
}
