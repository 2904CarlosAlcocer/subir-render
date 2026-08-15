import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  AlertCircle,
  Archive,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import api from '../api/axios'
import DashboardLayout from '../components/DashboardLayout'

const INTERVALO_ACTUALIZACION = 5000
const DURACION_ALERTA = 12000

const RESUMEN_INICIAL = {
  total: 0,
  nuevos: 0,
  leidos: 0,
  atendidos: 0,
  archivados: 0,
  ultimo_mensaje_id: null,
  ultimo_nuevo: null,
}

const PAGINACION_INICIAL = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: 0,
  to: 0,
}

const ETIQUETAS_ESTADO = {
  nuevo: 'Nuevo',
  leido: 'Leído',
  atendido: 'Atendido',
  archivado: 'Archivado',
}

const COLORES_ESTADO = {
  nuevo:
    'border-[#F5A300]/40 bg-[#F5A300]/15 text-[#F5A300]',

  leido:
    'border-blue-400/30 bg-blue-400/10 text-blue-300',

  atendido:
    'border-green-400/30 bg-green-400/10 text-green-300',

  archivado:
    'border-white/15 bg-white/5 text-white/50',
}

const FILTROS_ESTADO = [
  {
    value: 'todos',
    label: 'Todos',
  },
  {
    value: 'nuevo',
    label: 'Nuevos',
  },
  {
    value: 'leido',
    label: 'Leídos',
  },
  {
    value: 'atendido',
    label: 'Atendidos',
  },
  {
    value: 'archivado',
    label: 'Archivados',
  },
]

function formatearFecha(fecha) {
  if (!fecha) {
    return 'Sin fecha'
  }

  const valor = new Date(fecha)

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return 'Fecha no disponible'
  }

  return valor.toLocaleString(
    'es-CR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  )
}

function obtenerIniciales(nombre) {
  return String(nombre || '?')
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function obtenerNumeroWhatsApp(
  telefono
) {
  const numeros = String(
    telefono || ''
  ).replace(/\D/g, '')

  if (!numeros) {
    return ''
  }

  if (
    numeros.startsWith('506')
  ) {
    return numeros
  }

  return `506${numeros}`
}

export default function AdminMensajes() {
  const [
    mensajes,
    setMensajes,
  ] = useState([])

  const [
    resumen,
    setResumen,
  ] = useState(
    RESUMEN_INICIAL
  )

  const [
    paginacion,
    setPaginacion,
  ] = useState(
    PAGINACION_INICIAL
  )

  const [
    pagina,
    setPagina,
  ] = useState(1)

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState('todos')

  const [
    orden,
    setOrden,
  ] = useState('reciente')

  const [
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    busquedaAplicada,
    setBusquedaAplicada,
  ] = useState('')

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    mensajeSeleccionado,
    setMensajeSeleccionado,
  ] = useState(null)

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false)

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false)

  const [
    actualizandoId,
    setActualizandoId,
  ] = useState(null)

  const [
    telefonoCopiado,
    setTelefonoCopiado,
  ] = useState(false)

  const [
    sonidoActivo,
    setSonidoActivo,
  ] = useState(false)

  const [
    alertaNuevoMensaje,
    setAlertaNuevoMensaje,
  ] = useState(null)

  const mensajesRequestRef =
    useRef(false)

  const resumenRequestRef =
    useRef(false)

  const ultimoMensajeIdRef =
    useRef(null)

  const sonidoActivoRef =
    useRef(false)

  const audioContextRef =
    useRef(null)

  const alertaTimeoutRef =
    useRef(null)

  const tituloTimeoutRef =
    useRef(null)

  const copiadoTimeoutRef =
    useRef(null)

  const tituloOriginalRef =
    useRef('')

  /*
  |--------------------------------------------------------------------------
  | SONIDO DE ALERTA
  |--------------------------------------------------------------------------
  */

  const obtenerAudioContext =
    useCallback(() => {
      if (
        typeof window ===
        'undefined'
      ) {
        return null
      }

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext

      if (!AudioContextClass) {
        return null
      }

      if (
        !audioContextRef.current ||
        audioContextRef.current
          .state === 'closed'
      ) {
        audioContextRef.current =
          new AudioContextClass()
      }

      return audioContextRef.current
    }, [])

  const reproducirAlerta =
    useCallback(
      (
        contextoPreparado = null
      ) => {
        if (
          !sonidoActivoRef.current &&
          !contextoPreparado
        ) {
          return
        }

        const contexto =
          contextoPreparado ||
          obtenerAudioContext()

        if (
          !contexto ||
          contexto.state !==
            'running'
        ) {
          return
        }

        const inicio =
          contexto.currentTime

        const notas = [
          783.99,
          1046.5,
          1318.51,
        ]

        notas.forEach(
          (
            frecuencia,
            indice
          ) => {
            const oscilador =
              contexto.createOscillator()

            const ganancia =
              contexto.createGain()

            const comienzo =
              inicio +
              indice * 0.17

            const final =
              comienzo + 0.14

            oscilador.type =
              'sine'

            oscilador.frequency
              .setValueAtTime(
                frecuencia,
                comienzo
              )

            ganancia.gain
              .setValueAtTime(
                0.0001,
                comienzo
              )

            ganancia.gain
              .exponentialRampToValueAtTime(
                28.2,
                comienzo + 0.02
              )

            ganancia.gain
              .exponentialRampToValueAtTime(
                0.0001,
                final
              )

            oscilador.connect(
              ganancia
            )

            ganancia.connect(
              contexto.destination
            )

            oscilador.start(
              comienzo
            )

            oscilador.stop(
              final
            )
          }
        )
      },
      [obtenerAudioContext]
    )

  const cambiarEstadoSonido =
    async () => {
      if (
        sonidoActivoRef.current
      ) {
        sonidoActivoRef.current =
          false

        setSonidoActivo(false)

        if (
          audioContextRef.current &&
          audioContextRef.current
            .state !== 'closed'
        ) {
          await audioContextRef.current
            .close()

          audioContextRef.current =
            null
        }

        return
      }

      const contexto =
        obtenerAudioContext()

      if (!contexto) {
        setError(
          'Este navegador no permite reproducir alertas de sonido.'
        )

        return
      }

      try {
        if (
          contexto.state ===
          'suspended'
        ) {
          await contexto.resume()
        }

        sonidoActivoRef.current =
          true

        setSonidoActivo(true)
        setError('')

        reproducirAlerta(
          contexto
        )

        if (
          'Notification' in
            window &&
          Notification.permission ===
            'default'
        ) {
          await Notification
            .requestPermission()
        }
      } catch (err) {
        console.error(
          'No se pudo activar el sonido:',
          err
        )

        sonidoActivoRef.current =
          false

        setSonidoActivo(false)

        setError(
          'No se pudieron activar las alertas. Revisa los permisos del navegador.'
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | ALERTA DE MENSAJE NUEVO
  |--------------------------------------------------------------------------
  */

  const mostrarAlerta =
    useCallback(
      (datosResumen) => {
        const ultimo =
          datosResumen
            ?.ultimo_nuevo

        const alerta = {
          id:
            ultimo?.id ||
            datosResumen
              ?.ultimo_mensaje_id,

          nombre:
            ultimo?.nombre ||
            'Nuevo cliente',

          asunto:
            ultimo?.asunto ||
            'Nuevo mensaje de contacto',

          mensaje:
            ultimo?.mensaje ||
            'Se recibió un nuevo mensaje.',
        }

        setAlertaNuevoMensaje(
          alerta
        )

        reproducirAlerta()

        if (
          'Notification' in
            window &&
          Notification.permission ===
            'granted'
        ) {
          const notificacion =
            new Notification(
              'Nuevo mensaje de contacto',
              {
                body:
                  `${alerta.nombre}: ${alerta.asunto}`,

                tag:
                  `mensaje-contacto-${alerta.id}`,
              }
            )

          notificacion.onclick =
            () => {
              window.focus()

              notificacion.close()
            }
        }

        if (
          !tituloOriginalRef.current
        ) {
          tituloOriginalRef.current =
            document.title
        }

        document.title =
          '🔔 Nuevo mensaje de contacto'

        if (
          alertaTimeoutRef.current
        ) {
          clearTimeout(
            alertaTimeoutRef.current
          )
        }

        if (
          tituloTimeoutRef.current
        ) {
          clearTimeout(
            tituloTimeoutRef.current
          )
        }

        alertaTimeoutRef.current =
          setTimeout(() => {
            setAlertaNuevoMensaje(
              null
            )

            alertaTimeoutRef.current =
              null
          }, DURACION_ALERTA)

        tituloTimeoutRef.current =
          setTimeout(() => {
            if (
              tituloOriginalRef.current
            ) {
              document.title =
                tituloOriginalRef.current
            }

            tituloTimeoutRef.current =
              null
          }, DURACION_ALERTA)
      },
      [reproducirAlerta]
    )

  const ocultarAlerta =
    () => {
      setAlertaNuevoMensaje(
        null
      )

      if (
        alertaTimeoutRef.current
      ) {
        clearTimeout(
          alertaTimeoutRef.current
        )

        alertaTimeoutRef.current =
          null
      }

      if (
        tituloTimeoutRef.current
      ) {
        clearTimeout(
          tituloTimeoutRef.current
        )

        tituloTimeoutRef.current =
          null
      }

      if (
        tituloOriginalRef.current
      ) {
        document.title =
          tituloOriginalRef.current
      }
    }

  /*
  |--------------------------------------------------------------------------
  | CARGAR LISTA
  |--------------------------------------------------------------------------
  */

  const cargarMensajes =
    useCallback(
      async (
        silencioso = false
      ) => {
        if (
          mensajesRequestRef.current
        ) {
          return
        }

        mensajesRequestRef.current =
          true

        if (!silencioso) {
          setCargando(true)
        }

        try {
          const parametros = {
            page: pagina,
            por_pagina: 15,
            orden,
          }

          if (
            filtroEstado !==
            'todos'
          ) {
            parametros.estado =
              filtroEstado
          }

          if (
            busquedaAplicada
          ) {
            parametros.buscar =
              busquedaAplicada
          }

          const response =
            await api.get(
              '/admin/mensajes-contacto',
              {
                params:
                  parametros,
              }
            )

          const datos =
            response.data || {}

          setMensajes(
            Array.isArray(
              datos.data
            )
              ? datos.data
              : []
          )

          setPaginacion({
            current_page:
              Number(
                datos.current_page
              ) || 1,

            last_page:
              Number(
                datos.last_page
              ) || 1,

            per_page:
              Number(
                datos.per_page
              ) || 15,

            total:
              Number(
                datos.total
              ) || 0,

            from:
              Number(
                datos.from
              ) || 0,

            to:
              Number(
                datos.to
              ) || 0,
          })

          setError('')
        } catch (err) {
          console.error(
            'Error al cargar los mensajes:',
            err
          )

          if (!silencioso) {
            setError(
              'No se pudieron cargar los mensajes de contacto.'
            )
          }
        } finally {
          mensajesRequestRef.current =
            false

          if (!silencioso) {
            setCargando(false)
          }
        }
      },
      [
        pagina,
        filtroEstado,
        orden,
        busquedaAplicada,
      ]
    )

  /*
  |--------------------------------------------------------------------------
  | CARGAR RESUMEN
  |--------------------------------------------------------------------------
  */

  const cargarResumen =
    useCallback(
      async (
        detectarNuevos = false
      ) => {
        if (
          resumenRequestRef.current
        ) {
          return
        }

        resumenRequestRef.current =
          true

        try {
          const response =
            await api.get(
              '/admin/mensajes-contacto/resumen'
            )

          const datos = {
            ...RESUMEN_INICIAL,
            ...(response.data ||
              {}),
          }

          const ultimoId =
            Number(
              datos
                .ultimo_mensaje_id
            ) || 0

          if (
            ultimoMensajeIdRef.current ===
            null
          ) {
            ultimoMensajeIdRef.current =
              ultimoId
          } else {
            const idAnterior =
              Number(
                ultimoMensajeIdRef
                  .current
              ) || 0

            if (
              detectarNuevos &&
              ultimoId >
                idAnterior
            ) {
              mostrarAlerta(
                datos
              )
            }

            if (
              ultimoId >
              idAnterior
            ) {
              ultimoMensajeIdRef.current =
                ultimoId
            }
          }

          setResumen({
            total:
              Number(
                datos.total
              ) || 0,

            nuevos:
              Number(
                datos.nuevos
              ) || 0,

            leidos:
              Number(
                datos.leidos
              ) || 0,

            atendidos:
              Number(
                datos.atendidos
              ) || 0,

            archivados:
              Number(
                datos.archivados
              ) || 0,

            ultimo_mensaje_id:
              datos
                .ultimo_mensaje_id,

            ultimo_nuevo:
              datos
                .ultimo_nuevo,
          })
        } catch (err) {
          console.error(
            'Error al cargar el resumen de mensajes:',
            err
          )
        } finally {
          resumenRequestRef.current =
            false
        }
      },
      [mostrarAlerta]
    )

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    cargarMensajes(false)
  }, [cargarMensajes])

  useEffect(() => {
    cargarResumen(false)
  }, [cargarResumen])

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZACIÓN AUTOMÁTICA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const actualizar =
      () => {
        if (
          document.visibilityState !==
          'visible'
        ) {
          return
        }

        cargarResumen(true)
        cargarMensajes(true)
      }

    const intervalo =
      setInterval(
        actualizar,
        INTERVALO_ACTUALIZACION
      )

    return () => {
      clearInterval(
        intervalo
      )
    }
  }, [
    cargarMensajes,
    cargarResumen,
  ])

  useEffect(() => {
    const actualizarAlVolver =
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          cargarResumen(true)
          cargarMensajes(true)
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
  }, [
    cargarMensajes,
    cargarResumen,
  ])

  /*
  |--------------------------------------------------------------------------
  | LIMPIEZA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    tituloOriginalRef.current =
      document.title

    return () => {
      if (
        alertaTimeoutRef.current
      ) {
        clearTimeout(
          alertaTimeoutRef.current
        )
      }

      if (
        tituloTimeoutRef.current
      ) {
        clearTimeout(
          tituloTimeoutRef.current
        )
      }

      if (
        copiadoTimeoutRef.current
      ) {
        clearTimeout(
          copiadoTimeoutRef.current
        )
      }

      if (
        tituloOriginalRef.current
      ) {
        document.title =
          tituloOriginalRef.current
      }

      if (
        audioContextRef.current &&
        audioContextRef.current
          .state !== 'closed'
      ) {
        audioContextRef.current
          .close()
      }
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | BUSCAR Y FILTRAR
  |--------------------------------------------------------------------------
  */

  const handleBuscar =
    (event) => {
      event.preventDefault()

      setPagina(1)

      setBusquedaAplicada(
        busqueda.trim()
      )
    }

  const limpiarBusqueda =
    () => {
      setBusqueda('')
      setBusquedaAplicada('')
      setPagina(1)
    }

  const cambiarFiltro =
    (estado) => {
      setFiltroEstado(
        estado
      )

      setPagina(1)
    }

  /*
  |--------------------------------------------------------------------------
  | ABRIR MENSAJE
  |--------------------------------------------------------------------------
  */

  const abrirMensaje =
    async (mensaje) => {
      setModalAbierto(true)

      setMensajeSeleccionado(
        mensaje
      )

      setCargandoDetalle(true)
      setTelefonoCopiado(false)

      try {
        const response =
          await api.get(
            `/admin/mensajes-contacto/${mensaje.id}`
          )

        const mensajeActualizado =
          response.data
            ?.mensaje_contacto

        if (
          mensajeActualizado
        ) {
          setMensajeSeleccionado(
            mensajeActualizado
          )

          setMensajes(
            (listaActual) =>
              listaActual.map(
                (item) =>
                  item.id ===
                  mensajeActualizado.id
                    ? mensajeActualizado
                    : item
              )
          )

          await cargarResumen(
            false
          )
        }
      } catch (err) {
        console.error(
          'Error al abrir el mensaje:',
          err
        )

        setError(
          'No se pudo cargar el detalle del mensaje.'
        )
      } finally {
        setCargandoDetalle(
          false
        )
      }
    }

  const cerrarModal = () => {
    if (
      actualizandoId !== null
    ) {
      return
    }

    setModalAbierto(false)
    setMensajeSeleccionado(null)
    setTelefonoCopiado(false)
  }

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR ESTADO
  |--------------------------------------------------------------------------
  */

  const actualizarEstado =
    async (
      nuevoEstado
    ) => {
      if (
        !mensajeSeleccionado ||
        actualizandoId !== null
      ) {
        return
      }

      setActualizandoId(
        mensajeSeleccionado.id
      )

      try {
        const response =
          await api.patch(
            `/admin/mensajes-contacto/${mensajeSeleccionado.id}/estado`,
            {
              estado:
                nuevoEstado,
            }
          )

        const actualizado =
          response.data
            ?.mensaje_contacto

        if (actualizado) {
          setMensajeSeleccionado(
            actualizado
          )

          setMensajes(
            (listaActual) =>
              listaActual.map(
                (item) =>
                  item.id ===
                  actualizado.id
                    ? actualizado
                    : item
              )
          )
        }

        await Promise.all([
          cargarMensajes(true),
          cargarResumen(false),
        ])
      } catch (err) {
        console.error(
          'Error al actualizar el mensaje:',
          err
        )

        setError(
          err.response?.data
            ?.message ||
            'No se pudo actualizar el estado del mensaje.'
        )
      } finally {
        setActualizandoId(
          null
        )
      }
    }

  const restaurarMensaje =
    async () => {
      if (
        !mensajeSeleccionado ||
        actualizandoId !== null
      ) {
        return
      }

      setActualizandoId(
        mensajeSeleccionado.id
      )

      try {
        const response =
          await api.patch(
            `/admin/mensajes-contacto/${mensajeSeleccionado.id}/restaurar`
          )

        const actualizado =
          response.data
            ?.mensaje_contacto

        if (actualizado) {
          setMensajeSeleccionado(
            actualizado
          )
        }

        await Promise.all([
          cargarMensajes(true),
          cargarResumen(false),
        ])
      } catch (err) {
        console.error(
          'Error al restaurar el mensaje:',
          err
        )

        setError(
          err.response?.data
            ?.message ||
            'No se pudo restaurar el mensaje.'
        )
      } finally {
        setActualizandoId(
          null
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | COPIAR TELÉFONO
  |--------------------------------------------------------------------------
  */

  const copiarTelefono =
    async () => {
      const telefono =
        mensajeSeleccionado
          ?.telefono

      if (!telefono) {
        return
      }

      try {
        await navigator.clipboard
          .writeText(
            telefono
          )
      } catch {
        const textarea =
          document.createElement(
            'textarea'
          )

        textarea.value =
          telefono

        textarea.style.position =
          'fixed'

        textarea.style.opacity =
          '0'

        document.body.appendChild(
          textarea
        )

        textarea.select()

        document.execCommand(
          'copy'
        )

        document.body.removeChild(
          textarea
        )
      }

      setTelefonoCopiado(
        true
      )

      if (
        copiadoTimeoutRef.current
      ) {
        clearTimeout(
          copiadoTimeoutRef.current
        )
      }

      copiadoTimeoutRef.current =
        setTimeout(() => {
          setTelefonoCopiado(
            false
          )
        }, 2000)
    }

  /*
  |--------------------------------------------------------------------------
  | TARJETAS DEL RESUMEN
  |--------------------------------------------------------------------------
  */

  const tarjetasResumen = [
    {
      id: 'todos',
      label: 'Total',
      value:
        resumen.total,
      icon: Inbox,
      filter: 'todos',
    },
    {
      id: 'nuevos',
      label: 'Nuevos',
      value:
        resumen.nuevos,
      icon: BellRing,
      filter: 'nuevo',
    },
    {
      id: 'leidos',
      label: 'Leídos',
      value:
        resumen.leidos,
      icon: Eye,
      filter: 'leido',
    },
    {
      id: 'atendidos',
      label: 'Atendidos',
      value:
        resumen.atendidos,
      icon: CheckCircle2,
      filter: 'atendido',
    },
  ]

  const numeroWhatsApp =
    obtenerNumeroWhatsApp(
      mensajeSeleccionado
        ?.telefono
    )

  const textoWhatsApp =
    encodeURIComponent(
      `Hola ${mensajeSeleccionado?.nombre || ''}, te contactamos de Rooster CR con respecto a tu mensaje de contacto.`
    )

  return (
    <DashboardLayout
      titulo="Centro de mensajes"
      dark
      acciones={
        <button
          type="button"
          onClick={
            cambiarEstadoSonido
          }
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
            sonidoActivo
              ? 'border-[#F5A300]/50 bg-[#F5A300]/15 text-[#F5A300]'
              : 'border-white/15 bg-white/5 text-white/60 hover:border-[#F5A300]/40 hover:text-[#F5A300]'
          }`}
        >
          {sonidoActivo ? (
            <Volume2 size={17} />
          ) : (
            <VolumeX size={17} />
          )}

          {sonidoActivo
            ? 'Alertas activas'
            : 'Activar alertas'}
        </button>
      }
    >
      {/* ALERTA FLOTANTE */}
      {alertaNuevoMensaje && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-[#F5A300]/60 bg-[#17120c]/95 shadow-[0_20px_70px_rgba(245,163,0,0.35)] backdrop-blur-xl"
        >
          <div className="h-1 bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

          <div className="flex items-start gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5A300] text-black shadow-lg shadow-[#F5A300]/30">
              <BellRing className="h-6 w-6 animate-bounce" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-black text-white">
                ¡Nuevo mensaje!
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-[#F5A300]">
                {
                  alertaNuevoMensaje.nombre
                }
              </p>

              <p className="mt-1 line-clamp-2 text-xs text-white/60">
                {
                  alertaNuevoMensaje.asunto
                }
              </p>

              {!sonidoActivo && (
                <p className="mt-2 text-xs text-[#F5A300]">
                  Activa las alertas
                  para escuchar los
                  próximos mensajes.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={
                ocultarAlerta
              }
              className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar alerta"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <p className="flex-1">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            className="text-red-300/60 hover:text-red-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* RESUMEN */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetasResumen.map(
          (tarjeta) => {
            const Icono =
              tarjeta.icon

            const activa =
              filtroEstado ===
              tarjeta.filter

            return (
              <button
                key={
                  tarjeta.id
                }
                type="button"
                onClick={() =>
                  cambiarFiltro(
                    tarjeta.filter
                  )
                }
                className={`overflow-hidden rounded-2xl border text-left shadow-xl backdrop-blur-md transition-all ${
                  activa
                    ? 'border-[#F5A300]/60 bg-[#F5A300]/15'
                    : 'border-white/10 bg-white/10 hover:border-[#F5A300]/30 hover:bg-white/15'
                }`}
              >
                <div className="h-[3px] bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

                <div className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      activa
                        ? 'bg-[#F5A300] text-black'
                        : 'bg-white/10 text-[#F5A300]'
                    }`}
                  >
                    <Icono
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                      {
                        tarjeta.label
                      }
                    </p>

                    <p className="mt-1 font-mono text-2xl font-black text-white">
                      {
                        tarjeta.value
                      }
                    </p>
                  </div>
                </div>
              </button>
            )
          }
        )}
      </div>

      {/* FILTROS */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form
            onSubmit={
              handleBuscar
            }
            className="flex w-full gap-2 xl:max-w-xl"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                type="search"
                value={
                  busqueda
                }
                onChange={(event) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                placeholder="Buscar por nombre, teléfono, correo o mensaje..."
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#F5A300] focus:ring-2 focus:ring-[#F5A300]/20"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#F5A300] hover:text-black"
            >
              Buscar
            </button>

            {busquedaAplicada && (
              <button
                type="button"
                onClick={
                  limpiarBusqueda
                }
                className="rounded-xl border border-white/15 bg-white/5 px-3 text-white/60 transition hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </form>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={
                filtroEstado
              }
              onChange={(event) =>
                cambiarFiltro(
                  event.target.value
                )
              }
              className="rounded-xl border border-white/10 bg-[#1c1510] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#F5A300]"
            >
              {FILTROS_ESTADO.map(
                (filtro) => (
                  <option
                    key={
                      filtro.value
                    }
                    value={
                      filtro.value
                    }
                  >
                    {
                      filtro.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={orden}
              onChange={(event) => {
                setOrden(
                  event.target.value
                )

                setPagina(1)
              }}
              className="rounded-xl border border-white/10 bg-[#1c1510] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#F5A300]"
            >
              <option value="reciente">
                Más recientes
              </option>

              <option value="antiguo">
                Más antiguos
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                cargarMensajes(
                  false
                )

                cargarResumen(
                  false
                )
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-[#F5A300]/40 hover:text-[#F5A300]"
            >
              <RefreshCw
                size={17}
              />

              Actualizar
            </button>
          </div>
        </div>

        {busquedaAplicada && (
          <p className="mt-3 text-xs text-white/40">
            Resultados para:{' '}

            <span className="font-bold text-[#F5A300]">
              “
              {
                busquedaAplicada
              }
              ”
            </span>
          </p>
        )}
      </div>

      {/* LISTA */}
      {cargando ? (
        <div className="rounded-2xl border border-white/10 bg-white/10 p-12 text-center backdrop-blur-md">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#F5A300]" />

          <p className="text-sm text-white/60">
            Cargando mensajes...
          </p>
        </div>
      ) : mensajes.length ===
        0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/10 p-12 text-center backdrop-blur-md">
          <MessageSquare
            size={44}
            className="mx-auto mb-4 text-white/20"
          />

          <h3 className="text-lg font-bold text-white">
            No hay mensajes
          </h3>

          <p className="mt-2 text-sm text-white/45">
            No se encontraron
            mensajes con los filtros
            seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mensajes.map(
            (mensaje) => {
              const esNuevo =
                mensaje.estado ===
                'nuevo'

              return (
                <button
                  key={
                    mensaje.id
                  }
                  type="button"
                  onClick={() =>
                    abrirMensaje(
                      mensaje
                    )
                  }
                  className={`group w-full overflow-hidden rounded-2xl border text-left shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-2xl ${
                    esNuevo
                      ? 'border-[#F5A300]/50 bg-[#F5A300]/10'
                      : 'border-white/10 bg-white/10 hover:border-[#F5A300]/30 hover:bg-white/15'
                  }`}
                >
                  <div
                    className={`h-[3px] ${
                      esNuevo
                        ? 'bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]'
                        : 'bg-white/10'
                    }`}
                  />

                  <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black ${
                        esNuevo
                          ? 'bg-[#F5A300] text-black'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {obtenerIniciales(
                        mensaje.nombre
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-black text-white">
                              {
                                mensaje.nombre
                              }
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                COLORES_ESTADO[
                                  mensaje.estado
                                ] ||
                                COLORES_ESTADO
                                  .nuevo
                              }`}
                            >
                              {
                                ETIQUETAS_ESTADO[
                                  mensaje.estado
                                ] ||
                                mensaje.estado
                              }
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm font-semibold text-[#F5A300]">
                            {
                              mensaje.asunto
                            }
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-xs text-white/40">
                          <Clock
                            size={13}
                          />

                          {formatearFecha(
                            mensaje.created_at
                          )}
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">
                        {
                          mensaje.mensaje
                        }
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/45">
                        <span className="flex items-center gap-1.5">
                          <Phone
                            size={13}
                          />

                          {
                            mensaje.telefono
                          }
                        </span>

                        {mensaje.correo && (
                          <span className="flex items-center gap-1.5">
                            <Mail
                              size={13}
                            />

                            {
                              mensaje.correo
                            }
                          </span>
                        )}

                        {mensaje
                          .atendido_por && (
                          <span className="flex items-center gap-1.5 text-green-300/70">
                            <User
                              size={13}
                            />

                            Atendido por{' '}
                            {
                              mensaje
                                .atendido_por
                                .name
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end text-xs font-bold text-white/40 transition group-hover:text-[#F5A300] md:self-center">
                      Ver mensaje

                      <ChevronRight
                        size={17}
                      />
                    </div>
                  </div>
                </button>
              )
            }
          )}
        </div>
      )}

      {/* PAGINACIÓN */}
      {!cargando &&
        paginacion.total > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/45">
              Mostrando{' '}

              <span className="font-bold text-white/70">
                {
                  paginacion.from
                }
              </span>

              {' '}a{' '}

              <span className="font-bold text-white/70">
                {
                  paginacion.to
                }
              </span>

              {' '}de{' '}

              <span className="font-bold text-white/70">
                {
                  paginacion.total
                }
              </span>

              {' '}mensajes
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={
                  pagina <= 1
                }
                onClick={() =>
                  setPagina(
                    (paginaActual) =>
                      Math.max(
                        1,
                        paginaActual -
                          1
                      )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:border-[#F5A300]/40 hover:text-[#F5A300] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <span className="min-w-24 text-center text-sm font-bold text-white/70">
                Página {pagina} de{' '}
                {
                  paginacion.last_page
                }
              </span>

              <button
                type="button"
                disabled={
                  pagina >=
                  paginacion.last_page
                }
                onClick={() =>
                  setPagina(
                    (paginaActual) =>
                      Math.min(
                        paginacion.last_page,
                        paginaActual +
                          1
                      )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:border-[#F5A300]/40 hover:text-[#F5A300] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          </div>
        )}

      {/* MODAL */}
      {modalAbierto &&
        mensajeSeleccionado && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onMouseDown={
              cerrarModal
            }
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-mensaje"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#17120c] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
            >
              <div className="h-1 bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#17120c]/95 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5A300] font-black text-black">
                    {obtenerIniciales(
                      mensajeSeleccionado
                        .nombre
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="titulo-mensaje"
                      className="truncate text-xl font-black text-white"
                    >
                      {
                        mensajeSeleccionado
                          .nombre
                      }
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                          COLORES_ESTADO[
                            mensajeSeleccionado
                              .estado
                          ] ||
                          COLORES_ESTADO
                            .nuevo
                        }`}
                      >
                        {
                          ETIQUETAS_ESTADO[
                            mensajeSeleccionado
                              .estado
                          ] ||
                          mensajeSeleccionado
                            .estado
                        }
                      </span>

                      <span className="text-xs text-white/40">
                        {formatearFecha(
                          mensajeSeleccionado
                            .created_at
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    actualizandoId !==
                    null
                  }
                  className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                {cargandoDetalle && (
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#F5A300]" />

                    Actualizando mensaje...
                  </div>
                )}

                {/* CONTACTO */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/40">
                      <Phone
                        size={14}
                      />

                      Teléfono
                    </p>

                    <p className="font-mono text-base font-bold text-white">
                      {
                        mensajeSeleccionado
                          .telefono
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/40">
                      <Mail
                        size={14}
                      />

                      Correo
                    </p>

                    <p className="break-all text-sm font-semibold text-white">
                      {mensajeSeleccionado
                        .correo ||
                        'No indicó correo'}
                    </p>
                  </div>
                </div>

                {/* MENSAJE */}
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/40">
                    Motivo
                  </p>

                  <h3 className="text-xl font-black text-[#F5A300]">
                    {
                      mensajeSeleccionado
                        .asunto
                    }
                  </h3>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                    {
                      mensajeSeleccionado
                        .mensaje
                    }
                  </p>
                </div>

                {/* INFORMACIÓN DE GESTIÓN */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-white/35">
                      Leído
                    </p>

                    <p className="mt-1 text-xs font-semibold text-white/70">
                      {mensajeSeleccionado
                        .leido_at
                        ? formatearFecha(
                            mensajeSeleccionado
                              .leido_at
                          )
                        : 'Pendiente'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-white/35">
                      Atendido
                    </p>

                    <p className="mt-1 text-xs font-semibold text-white/70">
                      {mensajeSeleccionado
                        .atendido_at
                        ? formatearFecha(
                            mensajeSeleccionado
                              .atendido_at
                          )
                        : 'Pendiente'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-white/35">
                      Responsable
                    </p>

                    <p className="mt-1 text-xs font-semibold text-white/70">
                      {mensajeSeleccionado
                        .atendido_por
                        ?.name ||
                        'Sin asignar'}
                    </p>
                  </div>
                </div>

                {/* CONTACTAR */}
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-white/40">
                    Contactar al cliente
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <a
                      href={`tel:${mensajeSeleccionado.telefono}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#E4002B] px-4 py-3 text-sm font-black text-white transition hover:bg-red-500"
                    >
                      <Phone
                        size={17}
                      />

                      Llamar
                    </a>

                    <button
                      type="button"
                      onClick={
                        copiarTelefono
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-[#F5A300]/50 hover:text-[#F5A300]"
                    >
                      {telefonoCopiado ? (
                        <CheckCircle2
                          size={17}
                        />
                      ) : (
                        <Copy
                          size={17}
                        />
                      )}

                      {telefonoCopiado
                        ? 'Copiado'
                        : 'Copiar teléfono'}
                    </button>

                    <a
                      href={`https://wa.me/${numeroWhatsApp}?text=${textoWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white transition hover:bg-green-500"
                    >
                      <ExternalLink
                        size={17}
                      />

                      WhatsApp
                    </a>
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="border-t border-white/10 pt-6">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-white/40">
                    Gestión del mensaje
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {mensajeSeleccionado
                      .estado ===
                      'archivado' ? (
                      <button
                        type="button"
                        onClick={
                          restaurarMensaje
                        }
                        disabled={
                          actualizandoId !==
                          null
                        }
                        className="flex items-center gap-2 rounded-xl bg-[#F5A300] px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw
                          size={17}
                        />

                        Restaurar
                      </button>
                    ) : (
                      <>
                        {mensajeSeleccionado
                          .estado !==
                          'atendido' && (
                          <button
                            type="button"
                            onClick={() =>
                              actualizarEstado(
                                'atendido'
                              )
                            }
                            disabled={
                              actualizandoId !==
                              null
                            }
                            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2
                              size={17}
                            />

                            Marcar atendido
                          </button>
                        )}

                        {mensajeSeleccionado
                          .estado !==
                          'nuevo' && (
                          <button
                            type="button"
                            onClick={() =>
                              actualizarEstado(
                                'nuevo'
                              )
                            }
                            disabled={
                              actualizandoId !==
                              null
                            }
                            className="flex items-center gap-2 rounded-xl border border-[#F5A300]/40 bg-[#F5A300]/10 px-5 py-3 text-sm font-bold text-[#F5A300] transition hover:bg-[#F5A300]/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <BellRing
                              size={17}
                            />

                            Marcar nuevo
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            actualizarEstado(
                              'archivado'
                            )
                          }
                          disabled={
                            actualizandoId !==
                            null
                          }
                          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white/60 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Archive
                            size={17}
                          />

                          Archivar
                        </button>
                      </>
                    )}

                    {actualizandoId !==
                      null && (
                      <span className="flex items-center gap-2 px-3 text-sm text-white/45">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#F5A300]" />

                        Actualizando...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  )
}