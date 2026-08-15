import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Mail,
  PackageCheck,
  PackageSearch,
  Phone,
  Pizza,
  RefreshCw,
  Save,
  ShoppingBag,
  User,
} from 'lucide-react'

import api from '../api/axios'
import useAuthStore from '../store/authStore'

const INTERVALO_PEDIDO = 3000

const ESTADOS_PEDIDO = [
  {
    valor: 'pendiente',
    etiqueta: 'Recibido',
    icono: Clock,
  },
  {
    valor: 'confirmado',
    etiqueta: 'Confirmado',
    icono: CheckCircle2,
  },
  {
    valor: 'en_preparacion',
    etiqueta: 'Preparando',
    icono: ChefHat,
  },
  {
    valor: 'listo',
    etiqueta: 'Listo',
    icono: PackageCheck,
  },
]

const INFORMACION_ESTADO = {
  pendiente: {
    etiqueta: 'Pedido recibido',
    descripcion:
      'Tu pedido está esperando confirmación.',
  },
  confirmado: {
    etiqueta: 'Pedido confirmado',
    descripcion:
      'La cocina confirmó tu pedido.',
  },
  en_preparacion: {
    etiqueta: 'En preparación',
    descripcion:
      'Tu pedido se está preparando.',
  },
  listo: {
    etiqueta: 'Listo',
    descripcion:
      'Tu pedido está listo para ser retirado o entregado.',
  },
  entregado: {
    etiqueta: 'Entregado',
    descripcion: 'El pedido fue entregado.',
  },
  cancelado: {
    etiqueta: 'Cancelado',
    descripcion: 'El pedido fue cancelado.',
  },
}

function formatearDinero(valor) {
  return `₡${Number(valor || 0).toLocaleString(
    'es-CR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  )}`
}

function formatearFecha(fecha) {
  if (!fecha) {
    return 'No disponible'
  }

  const fechaConvertida = new Date(fecha)

  if (Number.isNaN(fechaConvertida.getTime())) {
    return 'No disponible'
  }

  return fechaConvertida.toLocaleString('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatearFechaCorta(fecha) {
  if (!fecha) {
    return 'Sin fecha'
  }

  const fechaConvertida = new Date(fecha)

  if (Number.isNaN(fechaConvertida.getTime())) {
    return 'Sin fecha'
  }

  return fechaConvertida.toLocaleDateString(
    'es-CR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}

function obtenerPrimerError(error) {
  const erroresValidacion =
    error.response?.data?.errors

  if (erroresValidacion) {
    return (
      Object.values(erroresValidacion)
        .flat()
        .find(Boolean) ||
      'Revisa la información ingresada.'
    )
  }

  return (
    error.response?.data?.message ||
    'Ocurrió un error. Intenta nuevamente.'
  )
}

function contarProductos(pedido) {
  if (!Array.isArray(pedido?.detalles)) {
    return 0
  }

  return pedido.detalles.reduce(
    (total, detalle) =>
      total + Number(detalle.cantidad || 0),
    0
  )
}

function clasesEstado(estado) {
  if (estado === 'entregado') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
  }

  if (estado === 'cancelado') {
    return 'border-red-500/25 bg-red-500/10 text-red-300'
  }

  if (estado === 'listo') {
    return 'border-sky-500/25 bg-sky-500/10 text-sky-300'
  }

  return 'border-[#F5A300]/25 bg-[#F5A300]/10 text-[#F5A300]'
}

function DetallesPedidoCompactos({ pedido }) {
  const detalles = Array.isArray(pedido?.detalles)
    ? pedido.detalles
    : []

  if (detalles.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-white/35">
        No se encontraron productos en este pedido.
      </p>
    )
  }

  return (
    <div className="max-h-72 divide-y divide-white/10 overflow-y-auto pr-1">
      {detalles.map((detalle, indice) => (
        <div
          key={
            detalle.id ||
            `${pedido.id}-${indice}`
          }
          className="py-3 first:pt-0 last:pb-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {detalle.cantidad}x{' '}
                {detalle.producto?.nombre ||
                  'Producto'}
              </p>

              <p className="mt-0.5 text-xs text-white/35">
                {formatearDinero(
                  detalle.precio_unitario
                )}{' '}
                c/u
              </p>
            </div>

            <p className="shrink-0 text-sm font-black text-[#F5A300]">
              {formatearDinero(detalle.subtotal)}
            </p>
          </div>

          {detalle.extras && (
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              <span className="font-bold text-white/70">
                Detalles:
              </span>{' '}
              {detalle.extras}
            </p>
          )}

          {detalle.alergias && (
            <p className="mt-1.5 text-xs leading-relaxed text-red-200">
              <span className="font-bold">
                Alergias:
              </span>{' '}
              {detalle.alergias}
            </p>
          )}

          {detalle.observaciones && (
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              <span className="font-bold text-white/70">
                Observaciones:
              </span>{' '}
              {detalle.observaciones}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}


function TarjetaPedidoActivo({
  pedido,
  expandido,
  onToggle,
}) {
  const estadoActual =
    pedido?.estado_pedido || ''

  const indiceEstadoActual =
    ESTADOS_PEDIDO.findIndex(
      (estado) => estado.valor === estadoActual
    )

  const porcentajeProgreso =
    indiceEstadoActual >= 0
      ? (indiceEstadoActual /
          (ESTADOS_PEDIDO.length - 1)) *
        100
      : 0

  const informacionEstado =
    INFORMACION_ESTADO[estadoActual]

  const modalidad =
    pedido.modalidad_entrega === 'consumo_local'
      ? 'En local'
      : 'Retiro'

  return (
    <article
      className={`overflow-hidden rounded-xl border transition-all duration-200 ${
        expandido
          ? 'border-[#F5A300]/25 bg-[#F5A300]/[0.045]'
          : 'border-white/[0.08] bg-black/15 hover:border-white/15 hover:bg-white/[0.035]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 text-left sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              estadoActual === 'listo'
                ? 'border-sky-400/20 bg-sky-400/10 text-sky-300'
                : 'border-[#F5A300]/15 bg-[#F5A300]/10 text-[#F5A300]'
            }`}
          >
            <PackageSearch size={17} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-black text-white sm:text-base">
                #{pedido.codigo_tracking}
              </p>

              <span
                className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wide sm:text-[9px] ${clasesEstado(
                  estadoActual
                )}`}
              >
                {informacionEstado?.etiqueta ||
                  estadoActual}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-white/35 sm:text-[11px]">
              <span>
                {formatearFechaCorta(
                  pedido.created_at
                )}
              </span>

              <span className="text-white/15">•</span>

              <span>{modalidad}</span>

              <span className="text-white/15">•</span>

              <span>
                {contarProductos(pedido)}{' '}
                {contarProductos(pedido) === 1
                  ? 'producto'
                  : 'productos'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <p className="whitespace-nowrap font-mono text-sm font-black text-[#F5A300] sm:text-base">
            {formatearDinero(pedido.total)}
          </p>

          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/35">
            {expandido ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-white/[0.07] px-3.5 pb-4 pt-3 sm:px-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                Estado del pedido
              </p>
              <p className="mt-0.5 text-xs font-bold text-white/70">
                {informacionEstado?.descripcion ||
                  'Seguimiento del pedido.'}
              </p>
            </div>

            <p className="text-[10px] text-white/30">
              {formatearFecha(pedido.created_at)}
            </p>
          </div>

          <div className="relative px-1 pb-1">
            <div className="absolute left-[12.5%] right-[12.5%] top-2.5 h-px bg-white/10" />

            <div
              className="absolute left-[12.5%] top-2.5 h-px bg-gradient-to-r from-[#E4002B] to-[#F5A300] transition-all duration-500"
              style={{
                width: `${porcentajeProgreso * 0.75}%`,
              }}
            />

            <div className="relative grid grid-cols-4 gap-1">
              {ESTADOS_PEDIDO.map(
                (estado, indice) => {
                  const Icono = estado.icono
                  const completado =
                    indice <= indiceEstadoActual
                  const actual =
                    indice === indiceEstadoActual

                  return (
                    <div
                      key={estado.valor}
                      className="flex min-w-0 flex-col items-center text-center"
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                          actual
                            ? 'border-[#F5A300] bg-[#F5A300] text-black shadow-[0_0_10px_rgba(245,163,0,0.35)]'
                            : completado
                              ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                              : 'border-white/10 bg-[#120C08] text-white/20'
                        }`}
                      >
                        <Icono size={10} />
                      </div>

                      <p
                        className={`mt-1 truncate text-[8px] font-bold sm:text-[9px] ${
                          actual
                            ? 'text-[#F5A300]'
                            : completado
                              ? 'text-emerald-300/70'
                              : 'text-white/20'
                        }`}
                      >
                        {estado.etiqueta}
                      </p>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
            <DetallesPedidoCompactos pedido={pedido} />
          </div>
        </div>
      )}
    </article>
  )
}

function PerfilCliente() {
  const actualizarUsuario = useAuthStore(
    (state) => state.actualizarUsuario
  )

  const [perfil, setPerfil] = useState(null)

  const [formulario, setFormulario] = useState({
    email: '',
    telefono: '',
  })

  const [pedidosActivos, setPedidosActivos] =
    useState([])

  const [historialPedidos, setHistorialPedidos] =
    useState([])

  const [
    pedidoActivoExpandido,
    setPedidoActivoExpandido,
  ] = useState(null)

  const [pedidoHistorialExpandido, setPedidoHistorialExpandido] =
    useState(null)

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] =
    useState(false)

  const [actualizandoPedido, setActualizandoPedido] =
    useState(false)

  const [actualizandoHistorial, setActualizandoHistorial] =
    useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const solicitudPedidoEnCursoRef = useRef(false)
  const pedidosActivosRef = useRef([])

  const cargarHistorial = useCallback(
    async (mostrarCarga = false) => {
      if (mostrarCarga) {
        setActualizandoHistorial(true)
      }

      try {
        const response = await api.get(
          '/perfil-cliente/historial'
        )

        setHistorialPedidos(
          Array.isArray(
            response.data?.historial_pedidos
          )
            ? response.data.historial_pedidos
            : []
        )
      } catch (err) {
        console.error(
          'Error al cargar el historial:',
          err
        )
      } finally {
        if (mostrarCarga) {
          setActualizandoHistorial(false)
        }
      }
    },
    []
  )

  const cargarPerfil = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const response = await api.get(
        '/perfil-cliente'
      )

      const {
        user,
        cliente,
        pedidos_activos,
        pedido_activo,
        historial_pedidos,
      } = response.data

      setPerfil({
        user,
        cliente,
      })

      setFormulario({
        email:
          cliente?.correo ||
          user?.email ||
          '',
        telefono: cliente?.telefono || '',
      })

      const activos = Array.isArray(
        pedidos_activos
      )
        ? pedidos_activos
        : pedido_activo
          ? [pedido_activo]
          : []

      pedidosActivosRef.current = activos
      setPedidosActivos(activos)

      setHistorialPedidos(
        Array.isArray(historial_pedidos)
          ? historial_pedidos
          : []
      )
    } catch (err) {
      console.error(
        'Error al cargar el perfil:',
        err
      )

      setError(obtenerPrimerError(err))
    } finally {
      setCargando(false)
    }
  }, [])

  const cargarPedidosActivos = useCallback(
    async (mostrarCarga = false) => {
      if (solicitudPedidoEnCursoRef.current) {
        return
      }

      solicitudPedidoEnCursoRef.current = true

      if (mostrarCarga) {
        setActualizandoPedido(true)
      }

      try {
        const response = await api.get(
          '/perfil-cliente/pedido-activo'
        )

        const pedidosAnteriores =
          pedidosActivosRef.current

        const nuevosPedidos = Array.isArray(
          response.data?.pedidos_activos
        )
          ? response.data.pedidos_activos
          : response.data?.pedido_activo
            ? [response.data.pedido_activo]
            : []

        const idsNuevos = new Set(
          nuevosPedidos.map((pedido) =>
            String(pedido.id)
          )
        )

        const algunPedidoFinalizo =
          pedidosAnteriores.some(
            (pedido) =>
              !idsNuevos.has(String(pedido.id))
          )

        pedidosActivosRef.current =
          nuevosPedidos

        setPedidosActivos(nuevosPedidos)

        setPedidoActivoExpandido(
          (pedidoIdActual) => {
            if (
              pedidoIdActual === null ||
              pedidoIdActual === undefined
            ) {
              return null
            }

            return idsNuevos.has(
              String(pedidoIdActual)
            )
              ? pedidoIdActual
              : null
          }
        )

        if (algunPedidoFinalizo) {
          await cargarHistorial(false)
        }
      } catch (err) {
        console.error(
          'Error al actualizar los pedidos activos:',
          err
        )
      } finally {
        solicitudPedidoEnCursoRef.current = false

        if (mostrarCarga) {
          setActualizandoPedido(false)
        }
      }
    },
    [cargarHistorial]
  )

  useEffect(() => {
    cargarPerfil()
  }, [cargarPerfil])

  useEffect(() => {
    const actualizarPedido = () => {
      if (
        document.visibilityState !== 'visible'
      ) {
        return
      }

      cargarPedidosActivos(false)
    }

    const intervalo = setInterval(
      actualizarPedido,
      INTERVALO_PEDIDO
    )

    return () => {
      clearInterval(intervalo)
    }
  }, [cargarPedidosActivos])

  useEffect(() => {
    const actualizarAlVolver = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        cargarPedidosActivos(false)
      }
    }

    document.addEventListener(
      'visibilitychange',
      actualizarAlVolver
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        actualizarAlVolver
      )
    }
  }, [cargarPedidosActivos])

  const manejarCambio = (event) => {
    const { name, value } = event.target

    setFormulario((datosActuales) => ({
      ...datosActuales,
      [name]: value,
    }))

    setMensaje('')
    setError('')
  }

  const guardarPerfil = async (event) => {
    event.preventDefault()

    const email = formulario.email
      .trim()
      .toLowerCase()

    const telefono = formulario.telefono.trim()

    if (!email) {
      setError(
        'El correo electrónico es obligatorio.'
      )
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    try {
      const response = await api.patch(
        '/perfil-cliente',
        {
          email,
          telefono: telefono || null,
        }
      )

      const { user, cliente } = response.data

      setPerfil({
        user,
        cliente,
      })

      setFormulario({
        email:
          cliente?.correo ||
          user?.email ||
          '',
        telefono: cliente?.telefono || '',
      })

      actualizarUsuario(user)

      setMensaje(
        response.data?.message ||
          'Perfil actualizado correctamente.'
      )
    } catch (err) {
      console.error(
        'Error al actualizar el perfil:',
        err
      )

      setError(obtenerPrimerError(err))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[calc(100dvh-68px)] items-center justify-center bg-[#120C08] px-4 pt-24">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#F5A300]" />
          <p className="text-white/60">
            Cargando tu perfil...
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="min-h-[100dvh] bg-[#120C08] px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F5A300]/30 bg-[#F5A300]/10 px-4 py-2 text-sm font-bold text-[#F5A300]">
            <User size={17} />
            Área de cliente
          </div>

          <h1 className="text-3xl font-black text-white sm:text-4xl">
            Mi perfil
          </h1>

          <p className="mt-2 max-w-2xl text-white/55">
            Consulta tu información, tus pedidos activos
            y tus pedidos anteriores.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200"
          >
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={20}
            />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {mensaje && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200"
          >
            <CheckCircle2
              className="mt-0.5 shrink-0"
              size={20}
            />
            <p className="text-sm">{mensaje}</p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* PERFIL COMPACTO */}
          <div className="h-fit overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl backdrop-blur-xl">
            <div className="h-1 bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

            <div className="p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5A300] text-black shadow-lg shadow-[#F5A300]/20">
                  <User size={24} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-white/45">
                    Cliente
                  </p>
                  <h2 className="truncate text-lg font-black text-white">
                    {perfil?.cliente?.nombre ||
                      perfil?.user?.name ||
                      'Cliente'}
                  </h2>
                </div>
              </div>

              <form
                onSubmit={guardarPerfil}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="nombre"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50"
                  >
                    Nombre completo
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      id="nombre"
                      type="text"
                      value={
                        perfil?.cliente?.nombre ||
                        perfil?.user?.name ||
                        ''
                      }
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/25 py-2.5 pl-10 pr-4 text-sm text-white/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formulario.email}
                      onChange={manejarCambio}
                      required
                      disabled={guardando}
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-xl border border-white/15 bg-black/25 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#F5A300] focus:ring-2 focus:ring-[#F5A300]/15 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50"
                  >
                    Teléfono
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formulario.telefono}
                      onChange={manejarCambio}
                      disabled={guardando}
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={20}
                      placeholder="8888-8888"
                      className="w-full rounded-xl border border-white/15 bg-black/25 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#F5A300] focus:ring-2 focus:ring-[#F5A300]/15 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <CalendarDays
                    size={17}
                    className="shrink-0 text-[#F5A300]"
                  />
                  <div>
                    <p className="text-[10px] text-white/35">
                      Cliente desde
                    </p>
                    <p className="text-xs font-semibold text-white/70">
                      {formatearFecha(
                        perfil?.cliente?.fecha_registro
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#E4002B]/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Guardar cambios
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            {/* PEDIDOS ACTIVOS */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5A300]/10 text-[#F5A300]">
                    <PackageSearch size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-white">
                        Pedidos activos
                      </h2>

                      {pedidosActivos.length > 0 && (
                        <span className="rounded-full border border-[#F5A300]/20 bg-[#F5A300]/10 px-2 py-0.5 text-[10px] font-black text-[#F5A300]">
                          {pedidosActivos.length}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/35">
                      {pedidosActivos.length === 1
                        ? '1 pedido en curso'
                        : `${pedidosActivos.length} pedidos en curso`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    cargarPedidosActivos(true)
                  }
                  disabled={actualizandoPedido}
                  aria-label="Actualizar pedidos activos"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition hover:border-[#F5A300]/40 hover:text-[#F5A300] disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      actualizandoPedido
                        ? 'animate-spin'
                        : ''
                    }
                  />
                </button>
              </div>

              {pedidosActivos.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-9 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <ShoppingBag
                      size={23}
                      className="text-white/25"
                    />
                  </div>

                  <h3 className="font-black text-white">
                    No tienes pedidos activos
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-white/40">
                    Tu próximo pedido aparecerá aquí.
                  </p>

                  <Link
                    to="/menu"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-4 py-2.5 text-sm font-black text-white transition hover:scale-105"
                  >
                    <Pizza size={16} />
                    Ver menú
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 p-3 sm:p-4">
                  {pedidosActivos.map((pedido) => (
                    <TarjetaPedidoActivo
                      key={pedido.id}
                      pedido={pedido}
                      expandido={
                        pedidoActivoExpandido ===
                        pedido.id
                      }
                      onToggle={() =>
                        setPedidoActivoExpandido(
                          (pedidoIdActual) =>
                            pedidoIdActual ===
                            pedido.id
                              ? null
                              : pedido.id
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* HISTORIAL COMPACTO */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#F5A300]">
                    <History size={19} />
                  </div>
                  <div>
                    <h2 className="font-black text-white">
                      Pedidos anteriores
                    </h2>
                    <p className="text-xs text-white/35">
                      Últimos 10 pedidos finalizados
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => cargarHistorial(true)}
                  disabled={actualizandoHistorial}
                  aria-label="Actualizar historial"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition hover:border-[#F5A300]/40 hover:text-[#F5A300] disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      actualizandoHistorial
                        ? 'animate-spin'
                        : ''
                    }
                  />
                </button>
              </div>

              {historialPedidos.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm font-bold text-white/55">
                    Todavía no hay pedidos anteriores
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Los pedidos entregados o cancelados aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {historialPedidos.map((pedido) => {
                    const expandido =
                      pedidoHistorialExpandido ===
                      pedido.id

                    const info =
                      INFORMACION_ESTADO[
                        pedido.estado_pedido
                      ]

                    return (
                      <div key={pedido.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setPedidoHistorialExpandido(
                              expandido ? null : pedido.id
                            )
                          }
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] sm:px-5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-mono text-sm font-black text-white">
                                #{pedido.codigo_tracking}
                              </p>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${clasesEstado(
                                  pedido.estado_pedido
                                )}`}
                              >
                                {info?.etiqueta ||
                                  pedido.estado_pedido}
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] text-white/35">
                              {formatearFechaCorta(
                                pedido.created_at
                              )}{' '}
                              · {contarProductos(pedido)}{' '}
                              productos
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="whitespace-nowrap text-sm font-black text-[#F5A300]">
                              {formatearDinero(
                                pedido.total
                              )}
                            </p>
                            {expandido ? (
                              <ChevronUp
                                size={16}
                                className="text-white/35"
                              />
                            ) : (
                              <ChevronDown
                                size={16}
                                className="text-white/35"
                              />
                            )}
                          </div>
                        </button>

                        {expandido && (
                          <div className="border-t border-white/5 bg-black/15 px-4 py-3 sm:px-5">
                            <div className="mb-3 flex items-center justify-between text-xs">
                              <span className="text-white/35">
                                {pedido.modalidad_entrega ===
                                'consumo_local'
                                  ? 'Consumo en el local'
                                  : 'Para retirar'}
                              </span>
                              <span className="text-white/35">
                                {formatearFecha(
                                  pedido.created_at
                                )}
                              </span>
                            </div>

                            <DetallesPedidoCompactos
                              pedido={pedido}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PerfilCliente