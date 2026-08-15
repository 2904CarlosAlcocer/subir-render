import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Coffee,
  PauseCircle,
  TimerReset,
  WifiOff,
} from 'lucide-react'

const ESTILOS = {
  abierto: {
    icono: CheckCircle2,
    borde: 'border-emerald-400/20',
    fondo: 'bg-emerald-400/[0.08]',
    iconoFondo:
      'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
    etiqueta: 'text-emerald-300',
  },
  ultimos_pedidos: {
    icono: AlertTriangle,
    borde: 'border-amber-400/25',
    fondo: 'bg-amber-400/[0.09]',
    iconoFondo:
      'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    etiqueta: 'text-amber-300',
  },
  horario_extendido: {
    icono: TimerReset,
    borde: 'border-orange-400/25',
    fondo: 'bg-orange-400/[0.09]',
    iconoFondo:
      'bg-orange-400/10 text-orange-300 ring-orange-400/20',
    etiqueta: 'text-orange-300',
  },
  pedidos_cerrados: {
    icono: Coffee,
    borde: 'border-sky-400/20',
    fondo: 'bg-sky-400/[0.07]',
    iconoFondo:
      'bg-sky-400/10 text-sky-300 ring-sky-400/20',
    etiqueta: 'text-sky-300',
  },
  pausado: {
    icono: PauseCircle,
    borde: 'border-rose-400/25',
    fondo: 'bg-rose-400/[0.08]',
    iconoFondo:
      'bg-rose-400/10 text-rose-300 ring-rose-400/20',
    etiqueta: 'text-rose-300',
  },
  cerrado: {
    icono: Clock3,
    borde: 'border-white/10',
    fondo: 'bg-white/[0.045]',
    iconoFondo:
      'bg-white/5 text-white/45 ring-white/10',
    etiqueta: 'text-white/50',
  },
  sin_conexion: {
    icono: WifiOff,
    borde: 'border-rose-400/20',
    fondo: 'bg-rose-400/[0.07]',
    iconoFondo:
      'bg-rose-400/10 text-rose-300 ring-rose-400/20',
    etiqueta: 'text-rose-300',
  },
  cargando: {
    icono: Clock3,
    borde: 'border-white/10',
    fondo: 'bg-white/[0.035]',
    iconoFondo:
      'bg-white/5 text-white/35 ring-white/10',
    etiqueta: 'text-white/40',
  },
}

export default function HorarioPedidosBanner({
  estado,
  cargando = false,
  compacto = false,
  className = '',
}) {
  const estadoActual = cargando
    ? 'cargando'
    : estado?.estado || 'cerrado'

  const estilo =
    ESTILOS[estadoActual] ||
    ESTILOS.cerrado

  const Icono = estilo.icono

  return (
    <section
      className={`overflow-hidden rounded-2xl border ${estilo.borde} ${estilo.fondo} ${className}`}
      aria-live="polite"
    >
      <div
        className={`flex gap-3 ${
          compacto ? 'p-3' : 'p-4 sm:p-5'
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${estilo.iconoFondo} ${
            compacto
              ? 'h-9 w-9'
              : 'h-11 w-11'
          }`}
        >
          <Icono
            className={
              compacto
                ? 'h-4 w-4'
                : 'h-5 w-5'
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-[0.16em] ${estilo.etiqueta}`}
              >
                Estado de pedidos
              </p>
              <h3
                className={`font-black text-white ${
                  compacto
                    ? 'mt-0.5 text-sm'
                    : 'mt-1 text-base'
                }`}
              >
                {estado?.titulo ||
                  'Consultando horario'}
              </h3>
            </div>

            {!compacto &&
              estado?.hora_servidor && (
                <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 font-mono text-[10px] font-bold text-white/35">
                  CR {estado.hora_servidor.slice(
                    0,
                    5
                  )}
                </span>
              )}
          </div>

          <p
            className={`text-white/55 ${
              compacto
                ? 'mt-1 text-xs'
                : 'mt-1.5 text-sm'
            }`}
          >
            {estado?.mensaje}
          </p>

          {!compacto && (
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
              <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1.5">
                Apertura {estado?.hora_apertura_humana}
              </span>
              <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1.5">
                Último pedido{' '}
                {estado?.hora_ultimo_pedido_humana}
              </span>
              <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1.5">
                Cierre {estado?.hora_cierre_humana}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
