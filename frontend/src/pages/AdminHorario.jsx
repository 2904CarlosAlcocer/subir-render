import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Save,
  TimerReset,
} from 'lucide-react'
import api from '../api/axios'
import DashboardLayout from '../components/DashboardLayout'
import HorarioPedidosBanner from '../components/HorarioPedidosBanner'

const HORARIO_POR_DEFECTO = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
].map((nombre_dia, dia_semana) => ({
  dia_semana,
  nombre_dia,
  hora_apertura: '12:00',
  hora_ultimo_pedido: '21:30',
  hora_cierre: '22:00',
  activo: true,
}))

const formatearError = (error) => {
  const errores = error.response?.data?.errors

  if (errores) {
    return Object.values(errores)
      .flat()
      .filter(Boolean)[0]
  }

  return (
    error.response?.data?.message ||
    'No se pudo completar la operación.'
  )
}

function AccionRapida({
  minutos,
  descripcion,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-400/25 hover:bg-orange-400/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300 ring-1 ring-inset ring-orange-400/15">
          <TimerReset className="h-[18px] w-[18px]" />
        </div>
        <span className="rounded-full border border-white/10 bg-black/15 px-2 py-1 font-mono text-[10px] font-bold text-white/35">
          SOLO HOY
        </span>
      </div>
      <p className="mt-4 text-lg font-black text-white">
        +{minutos} minutos
      </p>
      <p className="mt-1 text-xs leading-relaxed text-white/35">
        {descripcion}
      </p>
    </button>
  )
}

export default function AdminHorario() {
  const [estado, setEstado] = useState(null)
  const [horarios, setHorarios] = useState(
    HORARIO_POR_DEFECTO
  )
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [accionando, setAccionando] = useState('')
  const [horaPersonalizada, setHoraPersonalizada] =
    useState('22:00')
  const [motivoPausa, setMotivoPausa] =
    useState('')
  const [mensaje, setMensaje] = useState(null)

  const cargarConfiguracion = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) {
        setCargando(true)
      }

      try {
        const response = await api.get(
          '/admin/horario-pedidos'
        )
        const datos = response.data || {}

        setEstado(datos.estado || null)
        setHorarios(
          Array.isArray(datos.horarios) &&
            datos.horarios.length === 7
            ? datos.horarios
            : HORARIO_POR_DEFECTO
        )

        if (datos.estado?.hora_ultimo_pedido) {
          setHoraPersonalizada(
            datos.estado.hora_ultimo_pedido
          )
        }
      } catch (error) {
        setMensaje({
          tipo: 'error',
          texto: formatearError(error),
        })
      } finally {
        setCargando(false)
      }
    },
    []
  )

  useEffect(() => {
    cargarConfiguracion()
  }, [cargarConfiguracion])

  const horarioHoy = useMemo(() => {
    const dia = new Date().getDay()

    return horarios.find(
      (horario) =>
        Number(horario.dia_semana) === dia
    )
  }, [horarios])

  const actualizarCampo = (
    diaSemana,
    campo,
    valor
  ) => {
    setHorarios((actuales) =>
      actuales.map((horario) =>
        Number(horario.dia_semana) ===
        Number(diaSemana)
          ? {
              ...horario,
              [campo]: valor,
            }
          : horario
      )
    )
  }

  const guardarHorarioSemanal = async () => {
    setGuardando(true)
    setMensaje(null)

    try {
      const response = await api.put(
        '/admin/horario-pedidos/semanal',
        {
          horarios: horarios.map(
            (horario) => ({
              dia_semana: Number(
                horario.dia_semana
              ),
              nombre_dia:
                horario.nombre_dia,
              hora_apertura:
                horario.hora_apertura,
              hora_ultimo_pedido:
                horario.hora_ultimo_pedido,
              hora_cierre:
                horario.hora_cierre,
              activo: Boolean(
                horario.activo
              ),
            })
          ),
        }
      )

      const datos = response.data?.data
      setEstado(datos?.estado || estado)
      setHorarios(
        datos?.horarios || horarios
      )
      setMensaje({
        tipo: 'exito',
        texto:
          response.data?.message ||
          'Horario semanal actualizado.',
      })
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: formatearError(error),
      })
    } finally {
      setGuardando(false)
    }
  }

  const ejecutarAccion = async (
    nombre,
    solicitud
  ) => {
    setAccionando(nombre)
    setMensaje(null)

    try {
      const response = await solicitud()
      const datos = response.data?.data

      if (datos) {
        setEstado(datos.estado || null)
        setHorarios(
          datos.horarios || horarios
        )
      } else {
        await cargarConfiguracion({
          silencioso: true,
        })
      }

      setMensaje({
        tipo: 'exito',
        texto:
          response.data?.message ||
          'Operación completada.',
      })
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: formatearError(error),
      })
    } finally {
      setAccionando('')
    }
  }

  const extenderMinutos = (minutos) =>
    ejecutarAccion(
      `extender-${minutos}`,
      () =>
        api.post(
          '/admin/horario-pedidos/extender-hoy',
          { minutos }
        )
    )

  const extenderPersonalizado = () =>
    ejecutarAccion('personalizado', () =>
      api.post(
        '/admin/horario-pedidos/extender-hoy',
        { hora: horaPersonalizada }
      )
    )

  const pausar = () =>
    ejecutarAccion('pausar', () =>
      api.post(
        '/admin/horario-pedidos/pausar',
        {
          motivo: motivoPausa.trim() || null,
        }
      )
    )

  const reanudar = () =>
    ejecutarAccion('reanudar', () =>
      api.post(
        '/admin/horario-pedidos/reanudar'
      )
    )

  const cancelarExtension = () =>
    ejecutarAccion('cancelar-extension', () =>
      api.delete(
        '/admin/horario-pedidos/extension-hoy'
      )
    )

  return (
    <DashboardLayout
      titulo="Horario y pedidos"
      dark
      acciones={
        <button
          type="button"
          onClick={() =>
            cargarConfiguracion()
          }
          disabled={cargando}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-bold text-white/50 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              cargando ? 'animate-spin' : ''
            }`}
          />
          Actualizar
        </button>
      }
    >
      <div className="relative space-y-5 pb-8">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-orange-600/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-96 h-72 w-72 rounded-full bg-amber-500/[0.05] blur-3xl" />

        <section className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#171311] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_10%,rgba(249,115,22,0.13),transparent_30%)]" />
          <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)] xl:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-400/15">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">
                    Centro operativo
                  </p>
                  <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
                    Control de recepción de pedidos
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/40">
                El local cierra normalmente a las 10:00 p. m. y el último pedido se recibe a las 9:30 p. m. Las extensiones afectan únicamente el día actual.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/25">
                  Apertura
                </p>
                <p className="mt-1 font-mono text-sm font-black text-white">
                  {estado?.hora_apertura ||
                    '12:00'}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-400/15 bg-orange-400/[0.07] p-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-orange-300/60">
                  Último
                </p>
                <p className="mt-1 font-mono text-sm font-black text-orange-200">
                  {estado?.hora_ultimo_pedido ||
                    '21:30'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/25">
                  Cierre
                </p>
                <p className="mt-1 font-mono text-sm font-black text-white">
                  {estado?.hora_cierre ||
                    '22:00'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <HorarioPedidosBanner
          estado={estado}
          cargando={cargando}
        />

        {mensaje && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              mensaje.tipo === 'exito'
                ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300'
                : 'border-rose-400/20 bg-rose-400/[0.08] text-rose-300'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
          <article className="rounded-[24px] border border-white/[0.08] bg-[#171311] p-5 shadow-[0_22px_65px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/25">
                  Excepción temporal
                </p>
                <h2 className="mt-1.5 text-lg font-black text-white">
                  Extender pedidos solo por hoy
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Mañana el sistema regresará automáticamente al horario habitual.
                </p>
              </div>

              {estado?.horario_extendido && (
                <button
                  type="button"
                  onClick={cancelarExtension}
                  disabled={Boolean(accionando)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/45 transition hover:border-rose-400/20 hover:bg-rose-400/[0.07] hover:text-rose-300 disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Cancelar extensión
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <AccionRapida
                minutos={15}
                descripcion="Ideal cuando todavía hay algunos pedidos por atender."
                onClick={() =>
                  extenderMinutos(15)
                }
                disabled={Boolean(accionando)}
              />
              <AccionRapida
                minutos={30}
                descripcion="Extiende la recepción hasta las 10:00 p. m. desde el horario normal."
                onClick={() =>
                  extenderMinutos(30)
                }
                disabled={Boolean(accionando)}
              />
              <AccionRapida
                minutos={60}
                descripcion="Amplía el servicio y ajusta automáticamente el cierre del local."
                onClick={() =>
                  extenderMinutos(60)
                }
                disabled={Boolean(accionando)}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                    Hora personalizada para el último pedido
                  </span>
                  <div className="flex w-full min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-orange-400/30">
                    <input
                      type="time"
                      value={horaPersonalizada}
                      onChange={(event) =>
                        setHoraPersonalizada(
                          event.target.value
                        )
                      }
                      className="block w-full min-w-0 border-0 bg-transparent p-0 font-mono text-sm font-bold text-white outline-none"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={extenderPersonalizado}
                  disabled={
                    Boolean(accionando) ||
                    !horaPersonalizada
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 text-xs font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TimerReset className="h-4 w-4" />
                  Aplicar hoy
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/25">
                Si la hora supera el cierre actual, el sistema deja automáticamente 30 minutos adicionales para terminar los pedidos.
              </p>
            </div>
          </article>

          <article className="rounded-[24px] border border-white/[0.08] bg-[#171311] p-5 shadow-[0_22px_65px_rgba(0,0,0,0.22)] sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/25">
              Control inmediato
            </p>
            <h2 className="mt-1.5 text-lg font-black text-white">
              Pausar o reanudar pedidos
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/35">
              Úsalo cuando cocina esté saturada, exista un problema operativo o sea necesario cerrar antes.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                Motivo visible para el cliente
              </span>
              <textarea
                value={motivoPausa}
                onChange={(event) =>
                  setMotivoPausa(
                    event.target.value
                  )
                }
                rows={3}
                maxLength={255}
                placeholder="Ejemplo: Estamos atendiendo una alta cantidad de pedidos."
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-rose-400/25 focus:ring-2 focus:ring-rose-400/10"
              />
            </label>

            {estado?.pedidos_pausados ? (
              <button
                type="button"
                onClick={reanudar}
                disabled={Boolean(accionando)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black text-white shadow-[0_14px_35px_rgba(16,185,129,0.18)] transition hover:brightness-110 disabled:opacity-40"
              >
                <PlayCircle className="h-4 w-4" />
                Reanudar pedidos
              </button>
            ) : (
              <button
                type="button"
                onClick={pausar}
                disabled={Boolean(accionando)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.09] py-3 text-sm font-black text-rose-300 transition hover:bg-rose-400/[0.15] disabled:opacity-40"
              >
                <PauseCircle className="h-4 w-4" />
                Pausar nuevos pedidos
              </button>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <p className="text-[11px] leading-relaxed text-white/30">
                Los pedidos ya confirmados permanecen visibles para cocina y caja. Solamente se bloquean nuevas órdenes.
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-[24px] border border-white/[0.08] bg-[#171311] p-5 shadow-[0_22px_65px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300 ring-1 ring-inset ring-sky-400/15">
                <CalendarDays className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/25">
                  Configuración permanente
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Horario semanal
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Define apertura, último pedido y cierre para cada día.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={guardarHorarioSemanal}
              disabled={guardando || cargando}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-black transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guardando ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Guardar horario
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {horarios.map((horario) => {
              const esHoy =
                Number(horario.dia_semana) ===
                new Date().getDay()

              return (
                <div
                  key={horario.dia_semana}
                  className={`grid gap-3 rounded-2xl border p-3.5 transition md:grid-cols-[minmax(130px,0.8fr)_repeat(3,minmax(120px,1fr))_90px] md:items-end ${
                    esHoy
                      ? 'border-orange-400/20 bg-orange-400/[0.055]'
                      : 'border-white/[0.07] bg-black/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 md:block">
                    <div>
                      <p className="text-sm font-black text-white">
                        {horario.nombre_dia}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
                        {esHoy
                          ? 'Hoy'
                          : horario.activo
                            ? 'Abierto'
                            : 'Cerrado'}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 md:hidden">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-orange-500"
                        checked={Boolean(
                          horario.activo
                        )}
                        onChange={(event) =>
                          actualizarCampo(
                            horario.dia_semana,
                            'activo',
                            event.target.checked
                          )
                        }
                      />
                      <span className="sr-only">
                        Activar {horario.nombre_dia}
                      </span>
                    </label>
                  </div>

                  {[
                    ['hora_apertura', 'Apertura'],
                    [
                      'hora_ultimo_pedido',
                      'Último pedido',
                    ],
                    ['hora_cierre', 'Cierre'],
                  ].map(([campo, etiqueta]) => (
                    <label key={campo}>
                      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.13em] text-white/25">
                        {etiqueta}
                      </span>
                      <div className="flex w-full min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-orange-400/25">
                        <input
                          type="time"
                          value={horario[campo]}
                          disabled={!horario.activo}
                          onChange={(event) =>
                            actualizarCampo(
                              horario.dia_semana,
                              campo,
                              event.target.value
                            )
                          }
                          className="block w-full min-w-0 border-0 bg-transparent p-0 font-mono text-xs font-bold text-white outline-none disabled:opacity-30"
                        />
                      </div>
                    </label>
                  ))}

                  <label className="hidden h-10 items-center gap-2 md:flex">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-orange-500"
                      checked={Boolean(
                        horario.activo
                      )}
                      onChange={(event) =>
                        actualizarCampo(
                          horario.dia_semana,
                          'activo',
                          event.target.checked
                        )
                      }
                    />
                    <span className="text-xs text-white/40">
                      Activo
                    </span>
                  </label>
                </div>
              )
            })}
          </div>

          {horarioHoy && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-orange-400/15 bg-orange-400/[0.055] p-4">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <p className="text-xs leading-relaxed text-white/40">
                Hoy, {horarioHoy.nombre_dia}, el horario habitual es de{' '}
                <strong className="text-white/70">
                  {horarioHoy.hora_apertura}
                </strong>{' '}
                a{' '}
                <strong className="text-white/70">
                  {horarioHoy.hora_cierre}
                </strong>{' '}
                y el último pedido se recibe a las{' '}
                <strong className="text-orange-200">
                  {horarioHoy.hora_ultimo_pedido}
                </strong>
                .
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
