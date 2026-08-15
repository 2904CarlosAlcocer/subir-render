import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import api from '../api/axios'
import DashboardLayout from '../components/DashboardLayout'
import {
  Clock,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  BellRing,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Flame,
  ShoppingBag,
  Radio,
  UserRound,
  Timer,
  UtensilsCrossed,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react'

const INTERVALO_ACTUALIZACION = 1000
const DURACION_ALERTA_VISUAL = 15000
const VOLUMEN_ALERTA = 8.2

const SIGUIENTE_ESTADO = {
  pendiente: 'confirmado',
  confirmado: 'en_preparacion',
  en_preparacion: 'listo',
  listo: 'entregado',
}

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

const ETIQUETA_ACCION = {
  pendiente: 'Aceptar pedido',
  confirmado: 'Empezar a preparar',
  en_preparacion: 'Marcar como listo',
  listo: 'Marcar como entregado',
}

const COLOR_ESTADO = {
  pendiente: 'bg-[#FDF1DA] text-[#A9824A]',
  confirmado: 'bg-[#E8EEF7] text-[#3D5B8C]',
  en_preparacion: 'bg-[#FEF1E3] text-[#C97A1E]',
  listo: 'bg-[#EAF3DE] text-[#3B6D11]',
  entregado: 'bg-[#F1EFE8] text-[#9B988F]',
}

const ICONO_ESTADO = {
  pendiente: Clock,
  confirmado: Clock,
  en_preparacion: ChefHat,
  listo: CheckCircle2,
  entregado: PackageCheck,
}

const CONFIGURACION_COLUMNAS = [
  {
    estado: 'pendiente',
    titulo: 'Por aceptar',
    descripcion: 'Pedidos nuevos',
    icono: BellRing,
    linea: 'from-amber-400 via-orange-400 to-amber-300',
    iconoFondo: 'bg-amber-400/10 ring-1 ring-inset ring-amber-400/15',
    iconoTexto: 'text-amber-300',
    boton: 'bg-gradient-to-r from-amber-500 to-orange-500 text-[#1c1006] shadow-lg shadow-orange-500/15 hover:brightness-110',
    tarjetaActiva: 'border-amber-400/25 bg-amber-400/[0.07] shadow-[0_18px_55px_rgba(245,158,11,0.08)]',
  },
  {
    estado: 'confirmado',
    titulo: 'Confirmados',
    descripcion: 'Listos para iniciar',
    icono: CheckCircle2,
    linea: 'from-sky-400 via-blue-400 to-cyan-300',
    iconoFondo: 'bg-sky-400/10 ring-1 ring-inset ring-sky-400/15',
    iconoTexto: 'text-sky-300',
    boton: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-blue-500/15 hover:brightness-110',
    tarjetaActiva: 'border-sky-400/25 bg-sky-400/[0.07] shadow-[0_18px_55px_rgba(56,189,248,0.08)]',
  },
  {
    estado: 'en_preparacion',
    titulo: 'En preparación',
    descripcion: 'Trabajando ahora',
    icono: Flame,
    linea: 'from-orange-500 via-red-400 to-rose-400',
    iconoFondo: 'bg-orange-400/10 ring-1 ring-inset ring-orange-400/15',
    iconoTexto: 'text-orange-300',
    boton: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/15 hover:brightness-110',
    tarjetaActiva: 'border-orange-400/25 bg-orange-400/[0.07] shadow-[0_18px_55px_rgba(251,146,60,0.08)]',
  },
  {
    estado: 'listo',
    titulo: 'Listos',
    descripcion: 'Para entregar',
    icono: PackageCheck,
    linea: 'from-emerald-400 via-green-400 to-lime-300',
    iconoFondo: 'bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/15',
    iconoTexto: 'text-emerald-300',
    boton: 'bg-gradient-to-r from-emerald-500 to-green-500 text-[#07140d] shadow-lg shadow-emerald-500/15 hover:brightness-110',
    tarjetaActiva: 'border-emerald-400/25 bg-emerald-400/[0.07] shadow-[0_18px_55px_rgba(52,211,153,0.08)]',
  },
]

function CocinaDashboard() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState(null)
  const [error, setError] = useState('')
  /*
   * Las alertas de nuevos pedidos aparecen activas desde el inicio.
   * El navegador habilita la reproducción con la primera interacción.
   */
  const [sonidoActivo, setSonidoActivo] = useState(true)
  const [alertaNuevoPedido, setAlertaNuevoPedido] =
    useState(null)
  const [pedidosNuevosIds, setPedidosNuevosIds] =
    useState([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [indicePorEstado, setIndicePorEstado] = useState({})

  const pedidosConocidosRef = useRef(new Set())
  const cargaInicialCompletadaRef = useRef(false)
  const solicitudEnCursoRef = useRef(false)
  const sonidoActivoRef = useRef(true)
  const audioContextRef = useRef(null)
  const alertaTimeoutRef = useRef(null)
  const tituloTimeoutRef = useRef(null)
  const tituloOriginalRef = useRef('')

  const obtenerAudioContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) {
      return null
    }

    if (
      !audioContextRef.current ||
      audioContextRef.current.state === 'closed'
    ) {
      audioContextRef.current = new AudioContextClass()
    }

    return audioContextRef.current
  }, [])

  /*
   * PREPARAR EL AUDIO CON LA PRIMERA INTERACCIÓN
   *
   * El estado visual inicia encendido. Los navegadores requieren al
   * menos un clic o una tecla antes de permitir sonidos.
   */
  useEffect(() => {
    if (
      !sonidoActivo ||
      typeof window === 'undefined'
    ) {
      return undefined
    }

    let preparando = false

    const quitarEventos = () => {
      window.removeEventListener(
        'pointerdown',
        prepararAudio
      )

      window.removeEventListener(
        'keydown',
        prepararAudio
      )
    }

    const prepararAudio = async () => {
      if (
        preparando ||
        !sonidoActivoRef.current
      ) {
        return
      }

      preparando = true

      try {
        const contexto =
          obtenerAudioContext()

        if (
          contexto &&
          contexto.state === 'suspended'
        ) {
          await contexto.resume()
        }

        if (
          contexto &&
          contexto.state === 'running'
        ) {
          setError('')
          quitarEventos()
        }
      } catch (err) {
        console.warn(
          'El navegador todavía no permitió preparar el sonido de cocina:',
          err
        )
      } finally {
        preparando = false
      }
    }

    window.addEventListener(
      'pointerdown',
      prepararAudio,
      {
        passive: true,
      }
    )

    window.addEventListener(
      'keydown',
      prepararAudio
    )

    return quitarEventos
  }, [
    sonidoActivo,
    obtenerAudioContext,
  ])

  /*
    Genera el sonido directamente con Web Audio API.
    No necesitas guardar ningún archivo .mp3 o .wav.
  */
  const reproducirAlerta = useCallback(
    (contextoPreparado = null) => {
      if (
        !sonidoActivoRef.current &&
        !contextoPreparado
      ) {
        return
      }

      const contexto =
        contextoPreparado || obtenerAudioContext()

      if (!contexto || contexto.state !== 'running') {
        return
      }

      const inicio = contexto.currentTime
      const notas = [880, 1174.66, 880]

      notas.forEach((frecuencia, indice) => {
        const oscilador = contexto.createOscillator()
        const ganancia = contexto.createGain()
        const comienzo = inicio + indice * 0.22
        const final = comienzo + 0.17

        oscilador.type = 'square'
        oscilador.frequency.setValueAtTime(
          frecuencia,
          comienzo
        )

        ganancia.gain.setValueAtTime(0.0001, comienzo)
        ganancia.gain.exponentialRampToValueAtTime(
          VOLUMEN_ALERTA,
          comienzo + 0.025
        )
        ganancia.gain.exponentialRampToValueAtTime(
          0.0001,
          final
        )

        oscilador.connect(ganancia)
        ganancia.connect(contexto.destination)

        oscilador.start(comienzo)
        oscilador.stop(final)
      })
    },
    [obtenerAudioContext]
  )

  const cambiarEstadoSonido = async () => {
    if (sonidoActivoRef.current) {
      sonidoActivoRef.current = false
      setSonidoActivo(false)

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }

      return
    }

    const contexto = obtenerAudioContext()

    if (!contexto) {
      setError(
        'Este navegador no permite reproducir las alertas de sonido.'
      )
      return
    }

    try {
      if (contexto.state === 'suspended') {
        await contexto.resume()
      }

      sonidoActivoRef.current = true
      setSonidoActivo(true)
      setError('')

      // Sonido corto de confirmación al activarlo.
      reproducirAlerta(contexto)
    } catch (err) {
      console.error(
        'No se pudo activar el sonido de cocina:',
        err
      )

      sonidoActivoRef.current = false
      setSonidoActivo(false)
      setError(
        'No se pudo activar el sonido. Revisa los permisos del navegador.'
      )
    }
  }

  const ocultarAlertaNuevoPedido = useCallback(() => {
    setAlertaNuevoPedido(null)
    setPedidosNuevosIds([])

    if (alertaTimeoutRef.current) {
      clearTimeout(alertaTimeoutRef.current)
      alertaTimeoutRef.current = null
    }

    if (tituloTimeoutRef.current) {
      clearTimeout(tituloTimeoutRef.current)
      tituloTimeoutRef.current = null
    }

    if (tituloOriginalRef.current) {
      document.title = tituloOriginalRef.current
    }
  }, [])

  const mostrarAlertaNuevosPedidos = useCallback(
    (nuevosPedidos) => {
      const idsNuevos = nuevosPedidos.map((pedido) =>
        String(pedido.id)
      )

      const codigos = nuevosPedidos.map(
        (pedido) =>
          pedido.codigo_tracking || `Pedido ${pedido.id}`
      )

      setPedidosNuevosIds(idsNuevos)
      setAlertaNuevoPedido({
        cantidad: nuevosPedidos.length,
        codigos,
      })

      reproducirAlerta()

      if (!tituloOriginalRef.current) {
        tituloOriginalRef.current = document.title
      }

      document.title =
        nuevosPedidos.length === 1
          ? '🔔 ¡Nuevo pedido en cocina!'
          : `🔔 ¡${nuevosPedidos.length} pedidos nuevos!`

      if (alertaTimeoutRef.current) {
        clearTimeout(alertaTimeoutRef.current)
      }

      if (tituloTimeoutRef.current) {
        clearTimeout(tituloTimeoutRef.current)
      }

      alertaTimeoutRef.current = setTimeout(() => {
        setAlertaNuevoPedido(null)
        setPedidosNuevosIds([])
        alertaTimeoutRef.current = null
      }, DURACION_ALERTA_VISUAL)

      tituloTimeoutRef.current = setTimeout(() => {
        if (tituloOriginalRef.current) {
          document.title = tituloOriginalRef.current
        }

        tituloTimeoutRef.current = null
      }, DURACION_ALERTA_VISUAL)
    },
    [reproducirAlerta]
  )

  /*
    silencioso = false:
    muestra "Cargando pedidos..." durante la primera carga.

    silencioso = true:
    actualiza los pedidos sin ocultar las tarjetas.
  */
  const cargarPedidos = useCallback(
    async (silencioso = false) => {
      if (solicitudEnCursoRef.current) {
        return
      }

      solicitudEnCursoRef.current = true

      if (!silencioso) {
        setCargando(true)
      }

      try {
        const response = await api.get('/pedidos')

        const listaPedidos = Array.isArray(response.data)
          ? response.data
          : []

        const pedidosActivos = listaPedidos.filter(
          (pedido) =>
            pedido.estado_pedido !== 'entregado'
        )

        /*
          En la primera carga solo registramos los pedidos
          existentes. No mostramos alertas para pedidos viejos.
        */
        if (!cargaInicialCompletadaRef.current) {
          pedidosActivos.forEach((pedido) => {
            pedidosConocidosRef.current.add(
              String(pedido.id)
            )
          })

          cargaInicialCompletadaRef.current = true
        } else {
          const nuevosPedidos = pedidosActivos.filter(
            (pedido) =>
              !pedidosConocidosRef.current.has(
                String(pedido.id)
              )
          )

          pedidosActivos.forEach((pedido) => {
            pedidosConocidosRef.current.add(
              String(pedido.id)
            )
          })

          if (nuevosPedidos.length > 0) {
            mostrarAlertaNuevosPedidos(nuevosPedidos)
          }
        }

        setPedidos(pedidosActivos)
        setError('')
      } catch (err) {
        console.error(
          'Error al cargar los pedidos de cocina:',
          err
        )

        /*
          Durante una actualización silenciosa no eliminamos
          los pedidos que ya estaban visibles.
        */
        if (!silencioso) {
          setError(
            'No se pudieron cargar los pedidos de cocina.'
          )
        }
      } finally {
        solicitudEnCursoRef.current = false

        if (!silencioso) {
          setCargando(false)
        }
      }
    },
    [mostrarAlertaNuevosPedidos]
  )

  // Guardamos el título original y limpiamos recursos al salir.
  useEffect(() => {
    tituloOriginalRef.current = document.title

    return () => {
      if (alertaTimeoutRef.current) {
        clearTimeout(alertaTimeoutRef.current)
      }

      if (tituloTimeoutRef.current) {
        clearTimeout(tituloTimeoutRef.current)
      }

      if (tituloOriginalRef.current) {
        document.title = tituloOriginalRef.current
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Carga inicial visible.
  useEffect(() => {
    cargarPedidos(false)
  }, [cargarPedidos])

  // Actualización automática silenciosa cada 15 segundos.
  useEffect(() => {
    const actualizarSilenciosamente = () => {
      /*
        No hace solicitudes mientras la pestaña
        está minimizada o no está visible.
      */
      if (document.visibilityState !== 'visible') {
        return
      }

      cargarPedidos(true)
    }

    const intervalo = setInterval(
      actualizarSilenciosamente,
      INTERVALO_ACTUALIZACION
    )

    return () => clearInterval(intervalo)
  }, [cargarPedidos])

  /*
    Cuando el usuario vuelve a la pestaña,
    se actualizan inmediatamente los pedidos.
  */
  useEffect(() => {
    const actualizarAlVolver = () => {
      if (document.visibilityState === 'visible') {
        cargarPedidos(true)
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
  }, [cargarPedidos])

  const avanzarEstado = async (pedido) => {
    const siguienteEstado =
      SIGUIENTE_ESTADO[pedido.estado_pedido]

    if (!siguienteEstado || actualizando !== null) {
      return
    }

    setActualizando(pedido.id)

    try {
      await api.patch(
        `/pedidos/${pedido.id}/estado`,
        {
          estado_pedido: siguienteEstado,
        }
      )

      setPedidosNuevosIds((idsActuales) =>
        idsActuales.filter(
          (id) => id !== String(pedido.id)
        )
      )

      /*
        Actualización inmediata y silenciosa.
        No aparecerá nuevamente "Cargando pedidos...".
      */
      await cargarPedidos(true)
    } catch (err) {
      console.error(
        'Error al actualizar el estado del pedido:',
        err
      )

      setError(
        'No se pudo actualizar el estado del pedido.'
      )
    } finally {
      setActualizando(null)
    }
  }

  const resumenEstados = {
    pendiente: pedidos.filter((pedido) => pedido.estado_pedido === 'pendiente').length,
    confirmado: pedidos.filter((pedido) => pedido.estado_pedido === 'confirmado').length,
    en_preparacion: pedidos.filter((pedido) => pedido.estado_pedido === 'en_preparacion').length,
    listo: pedidos.filter((pedido) => pedido.estado_pedido === 'listo').length,
  }

  const columnasVisibles =
    filtroEstado === 'todos'
      ? CONFIGURACION_COLUMNAS
      : CONFIGURACION_COLUMNAS.filter(
          (columna) => columna.estado === filtroEstado
        )

  const obtenerTiempoTranscurrido = (fecha) => {
    if (!fecha) return 'Sin hora'

    const diferencia = Math.max(
      0,
      Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
    )

    if (diferencia < 1) return 'Ahora'
    if (diferencia === 1) return 'Hace 1 min'
    if (diferencia < 60) return `Hace ${diferencia} min`

    const horas = Math.floor(diferencia / 60)
    return horas === 1 ? 'Hace 1 h' : `Hace ${horas} h`
  }

  /*
   * Convierte la personalización enviada por Laravel en un objeto.
   * También acepta pedidos antiguos donde el JSON pueda llegar como texto.
   */
  const obtenerPersonalizacionDetalle = (detalle) => {
    const valor = detalle?.personalizacion

    if (
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor)
    ) {
      return valor
    }

    if (typeof valor === 'string' && valor.trim()) {
      try {
        const convertido = JSON.parse(valor)

        return convertido &&
          typeof convertido === 'object' &&
          !Array.isArray(convertido)
          ? convertido
          : null
      } catch (error) {
        console.warn(
          'No se pudo interpretar la personalización del pedido:',
          error
        )
      }
    }

    return null
  }

  const obtenerNombreOpcion = (opcion) => {
    if (typeof opcion === 'string') {
      return opcion.trim()
    }

    return String(opcion?.nombre || '').trim()
  }

  const formatearMontoDetalle = (monto) =>
    Number(monto || 0).toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

  /*
   * Construye las líneas que necesita cocina para preparar exactamente
   * lo seleccionado por el cliente.
   */
  const construirDetallesPreparacion = (detalle) => {
    const personalizacion =
      obtenerPersonalizacionDetalle(detalle)

    const tipo = String(
      personalizacion?.tipo || ''
    )
      .trim()
      .toLowerCase()

    const lineas = []

    if (tipo === 'pizza') {
      const tamano =
        personalizacion.tamano_texto ||
        (
          personalizacion.tamano_pizza === 'personal'
            ? 'Personal'
            : personalizacion.tamano_pizza === 'grande'
              ? 'Grande'
              : ''
        )

      if (tamano) {
        lineas.push({
          etiqueta: 'Tamaño',
          valor: tamano,
          estilo:
            'border-orange-400/15 bg-orange-400/[0.06] text-orange-100/80',
        })
      }

      const extras = Array.isArray(
        personalizacion.extras
      )
        ? personalizacion.extras
            .map(obtenerNombreOpcion)
            .filter(Boolean)
        : []

      if (extras.length > 0) {
        lineas.push({
          etiqueta: 'Extras',
          valor: extras.join(', '),
          estilo:
            'border-[#ff9d45]/20 bg-[#ff9d45]/[0.07] text-[#ffd0ac]',
        })
      }
    }

    if (tipo === 'pasta') {
      const tipoPasta = obtenerNombreOpcion(
        personalizacion.tipo_pasta
      )

      const proteinas = Array.isArray(
        personalizacion.proteinas
      )
        ? personalizacion.proteinas
            .map(obtenerNombreOpcion)
            .filter(Boolean)
        : []

      const salsa = obtenerNombreOpcion(
        personalizacion.salsa
      )

      const ingredientes = Array.isArray(
        personalizacion.ingredientes
      )
        ? personalizacion.ingredientes
            .map(obtenerNombreOpcion)
            .filter(Boolean)
        : []

      lineas.push(
        {
          etiqueta: 'Tipo de pasta',
          valor: tipoPasta || 'No indicado',
          estilo:
            'border-amber-400/15 bg-amber-400/[0.06] text-amber-100/80',
        },
        {
          etiqueta: 'Proteína',
          valor:
            proteinas.length > 0
              ? proteinas.join(', ')
              : 'Sin proteína',
          estilo:
            'border-amber-400/15 bg-amber-400/[0.06] text-amber-100/80',
        },
        {
          etiqueta: 'Salsa',
          valor: salsa || 'Sin salsa',
          estilo:
            'border-amber-400/15 bg-amber-400/[0.06] text-amber-100/80',
        },
        {
          etiqueta: 'Ingredientes',
          valor:
            ingredientes.length > 0
              ? ingredientes.join(', ')
              : 'Sin adicionales',
          estilo:
            'border-amber-400/15 bg-amber-400/[0.06] text-amber-100/80',
        }
      )
    }

    if (tipo === 'acompanamientos') {
      const acompanamientos = Array.isArray(
        personalizacion.acompanamientos
      )
        ? personalizacion.acompanamientos
        : []

      const incluidos = acompanamientos
        .filter(
          (acompanamiento) =>
            acompanamiento?.incluido !== false
        )
        .map(obtenerNombreOpcion)
        .filter(Boolean)

      const adicionales = acompanamientos
        .filter(
          (acompanamiento) =>
            acompanamiento?.incluido === false
        )
        .map((acompanamiento) => {
          const nombre =
            obtenerNombreOpcion(acompanamiento)

          const precio = Number(
            acompanamiento?.precio_aplicado ??
            acompanamiento?.precio_extra ??
            0
          )

          if (!nombre) {
            return ''
          }

          return precio > 0
            ? `${nombre} (+₡${formatearMontoDetalle(precio)})`
            : nombre
        })
        .filter(Boolean)

      lineas.push({
        etiqueta: 'Acompañamientos incluidos',
        valor:
          incluidos.length > 0
            ? incluidos.join(', ')
            : 'Ninguno',
        estilo:
          'border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-100/80',
      })

      if (adicionales.length > 0) {
        lineas.push({
          etiqueta: 'Acompañamientos extra',
          valor: adicionales.join(', '),
          estilo:
            'border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-100/80',
        })
      }
    }

    /*
     * Respaldo para pedidos anteriores o cualquier personalización
     * que solo haya quedado guardada en la columna extras.
     */
    if (
      lineas.length === 0 &&
      String(detalle?.extras || '').trim()
    ) {
      lineas.push({
        etiqueta: 'Personalización',
        valor: String(detalle.extras).trim(),
        estilo:
          'border-[#ff9d45]/20 bg-[#ff9d45]/[0.07] text-[#ffd0ac]',
      })
    }

    if (String(detalle?.alergias || '').trim()) {
      lineas.push({
        etiqueta: 'Alergias',
        valor: String(detalle.alergias).trim(),
        estilo:
          'border-red-400/25 bg-red-400/[0.09] text-red-100',
        importante: true,
      })
    }

    if (
      String(detalle?.observaciones || '').trim()
    ) {
      lineas.push({
        etiqueta: 'Observaciones',
        valor: String(
          detalle.observaciones
        ).trim(),
        estilo:
          'border-yellow-400/20 bg-yellow-400/[0.07] text-yellow-100/85',
        importante: true,
      })
    }

    return lineas
  }

  const renderTarjetaPedido = (pedido, columna) => {
    const Icono = ICONO_ESTADO[pedido.estado_pedido] || Clock
    const estaActualizando = actualizando === pedido.id
    const esPedidoNuevo = pedidosNuevosIds.includes(String(pedido.id))
    const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : []

    return (
      <article
        key={pedido.id}
        className={`group relative overflow-hidden rounded-2xl border bg-[#17110d]/95 shadow-[0_18px_55px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)] ${
          esPedidoNuevo
            ? 'border-[#ff9d45] ring-2 ring-[#ff9d45]/20'
            : 'border-white/[0.08] hover:border-white/[0.16]'
        }`}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${columna.linea}`} />

        {esPedidoNuevo && (
          <div className="absolute right-3 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#ff9d45] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a0e07] shadow-lg shadow-orange-500/20">
            <BellRing size={11} className="animate-bounce" />
            Nuevo
          </div>
        )}

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 pr-16">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${columna.iconoFondo}`}>
                  <Icono size={17} className={columna.iconoTexto} />
                </span>

                <div className="min-w-0">
                  <p className="truncate font-mono text-base font-black tracking-tight text-white">
                    #{pedido.codigo_tracking || pedido.id}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                    <Timer size={11} />
                    <span>{obtenerTiempoTranscurrido(pedido.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60">
              {pedido.modalidad_entrega === 'consumo_local' ? (
                <UtensilsCrossed size={12} />
              ) : (
                <ShoppingBag size={12} />
              )}
              {pedido.modalidad_entrega === 'consumo_local'
                ? 'Consumo en local'
                : 'Para retirar'}
            </span>

            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${COLOR_ESTADO[pedido.estado_pedido] || 'bg-white/10 text-white/60'}`}>
              <Icono size={11} />
              {ETIQUETA_ESTADO[pedido.estado_pedido] || pedido.estado_pedido}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                Preparación
              </p>
              <span className="text-[11px] text-white/30">
                {detalles.reduce(
                  (total, detalle) => total + Number(detalle.cantidad || 0),
                  0
                )}{' '}
                productos
              </span>
            </div>

            <ul className="max-h-96 divide-y divide-white/[0.05] overflow-y-auto custom-kitchen-scrollbar">
              {detalles.length > 0 ? (
                detalles.map((detalle, indice) => (
                  <li
                    key={detalle.id || `${pedido.id}-${indice}`}
                    className="flex items-start gap-3 px-3.5 py-3"
                  >
                    <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff8a3d]/10 px-1.5 text-xs font-black text-[#ffae73] ring-1 ring-inset ring-[#ff8a3d]/15">
                      {detalle.cantidad || 1}x
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5 text-white/90">
                        {detalle.producto?.nombre || 'Producto'}
                      </p>

                      {(() => {
                        const lineasPreparacion =
                          construirDetallesPreparacion(
                            detalle
                          )

                        if (
                          lineasPreparacion.length ===
                          0
                        ) {
                          return null
                        }

                        return (
                          <div className="mt-2 space-y-1.5">
                            {lineasPreparacion.map(
                              (
                                linea,
                                lineaIndice
                              ) => (
                                <div
                                  key={`${linea.etiqueta}-${lineaIndice}`}
                                  className={`rounded-lg border px-2.5 py-2 ${linea.estilo}`}
                                >
                                  <div className="flex items-start gap-2">
                                    {linea.importante && (
                                      <AlertTriangle
                                        size={13}
                                        className="mt-0.5 shrink-0"
                                      />
                                    )}

                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-60">
                                        {linea.etiqueta}
                                      </p>
                                      <p className="mt-0.5 break-words text-[11px] font-semibold leading-4">
                                        {linea.valor}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-3.5 py-5 text-center text-xs text-white/35">
                  Sin productos registrados
                </li>
              )}
            </ul>
          </div>

          {(pedido.observaciones || pedido.notas) && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-100/70">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
              <span>{pedido.observaciones || pedido.notas}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                <UserRound size={12} />
                <span className="truncate">
                  {pedido.cliente?.nombre || pedido.cliente?.name || 'Cliente general'}
                </span>
              </div>
              <p className="mt-1 font-mono text-lg font-black text-white">
                ₡{Number(pedido.total || 0).toLocaleString('es-CR')}
              </p>
            </div>
          </div>

          {SIGUIENTE_ESTADO[pedido.estado_pedido] && (
            <button
              type="button"
              onClick={() => avanzarEstado(pedido)}
              disabled={actualizando !== null}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${columna.boton}`}
            >
              {estaActualizando ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  {ETIQUETA_ACCION[pedido.estado_pedido]}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </article>
    )
  }

  return (
    <DashboardLayout titulo="Cocina" dark>
      <div className="relative space-y-6 pb-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ff6b2c]/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-64 h-72 w-72 rounded-full bg-[#ffb15a]/[0.04] blur-3xl" />

        {alertaNuevoPedido && (
          <div
            role="alert"
            aria-live="assertive"
            className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-[#ff9d45]/40 bg-[#17100c]/95 shadow-[0_24px_90px_rgba(255,120,40,0.32)] backdrop-blur-2xl"
          >
            <div className="h-1 bg-gradient-to-r from-[#d83b16] via-[#ff9d45] to-[#d83b16]" />
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffb45f] to-[#ff6a2c] text-[#1b0d07] shadow-lg shadow-orange-500/20">
                <BellRing className="h-6 w-6 animate-bounce" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-black text-white">
                  {alertaNuevoPedido.cantidad === 1
                    ? '¡Nuevo pedido en cocina!'
                    : `¡${alertaNuevoPedido.cantidad} pedidos nuevos!`}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  {alertaNuevoPedido.codigos
                    .map((codigo) => `#${codigo}`)
                    .join(', ')}
                </p>
                {!sonidoActivo && (
                  <p className="mt-2 text-xs font-semibold text-[#ffad70]">
                    Activa el sonido para escuchar las próximas alertas.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={ocultarAlertaNuevoPedido}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar alerta"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#1b130e] via-[#130e0b] to-[#0d0a08] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-7">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-[radial-gradient(circle_at_top_right,rgba(255,141,66,0.18),transparent_65%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#ff9d45]/20 bg-[#ff9d45]/10 shadow-inner shadow-[#ff9d45]/10">
                <ChefHat className="h-7 w-7 text-[#ffad70]" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Centro de cocina
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    En vivo
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">
                  Controla el flujo de pedidos y avanza cada preparación sin perder de vista los tiempos.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => cargarPedidos(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white/65 transition hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>

              <button
                type="button"
                onClick={cambiarEstadoSonido}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-all ${
                  sonidoActivo
                    ? 'border-emerald-400/25 bg-emerald-400/[0.10] text-emerald-300 hover:bg-emerald-400/[0.16]'
                    : 'border-[#ff9d45]/25 bg-[#ff9d45]/[0.08] text-[#ffad70] hover:bg-[#ff9d45]/[0.14]'
                }`}
              >
                {sonidoActivo ? <Volume2 size={17} /> : <VolumeX size={17} />}
                {sonidoActivo ? 'Sonido activado' : 'Activar sonido'}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {CONFIGURACION_COLUMNAS.map((columna) => {
            const IconoResumen = columna.icono
            const cantidad = resumenEstados[columna.estado] || 0

            return (
              <button
                key={columna.estado}
                type="button"
                onClick={() =>
                  setFiltroEstado((actual) =>
                    actual === columna.estado ? 'todos' : columna.estado
                  )
                }
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 sm:p-5 ${
                  filtroEstado === columna.estado
                    ? columna.tarjetaActiva
                    : 'border-white/[0.07] bg-[#15100d]/80 hover:border-white/[0.14]'
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${columna.linea}`} />
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${columna.iconoFondo}`}>
                    <IconoResumen size={19} className={columna.iconoTexto} />
                  </span>
                  <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {cantidad}
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-white/75">{columna.titulo}</p>
                <p className="mt-0.5 text-xs text-white/35">{columna.descripcion}</p>
              </button>
            )
          })}
        </section>

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => cargarPedidos(false)}
              className="rounded-lg border border-red-300/20 px-3 py-1.5 text-xs font-bold transition hover:bg-red-300/10"
            >
              Reintentar
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#100c0a]/85 shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-[#ff9d45]" />
                <h2 className="font-black text-white">Flujo de pedidos</h2>
              </div>
              <p className="mt-1 text-xs text-white/35">
                {pedidos.length} {pedidos.length === 1 ? 'pedido activo' : 'pedidos activos'}
              </p>
            </div>

            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/20 p-1 custom-kitchen-scrollbar">
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  filtroEstado === 'todos'
                    ? 'bg-white/[0.10] text-white shadow-sm'
                    : 'text-white/35 hover:text-white/65'
                }`}
              >
                Todos
              </button>
              {CONFIGURACION_COLUMNAS.map((columna) => (
                <button
                  key={columna.estado}
                  type="button"
                  onClick={() => setFiltroEstado(columna.estado)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    filtroEstado === columna.estado
                      ? 'bg-white/[0.10] text-white shadow-sm'
                      : 'text-white/35 hover:text-white/65'
                  }`}
                >
                  {columna.titulo} ({resumenEstados[columna.estado] || 0})
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 xl:p-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="h-5 w-28 animate-pulse rounded bg-white/[0.07]" />
                  <div className="h-36 animate-pulse rounded-xl bg-white/[0.04]" />
                  <div className="h-11 animate-pulse rounded-xl bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#ff9d45]/15 bg-[#ff9d45]/[0.06]">
                <ChefHat className="h-9 w-9 text-[#ffad70]/70" />
              </div>
              <h3 className="mt-5 text-lg font-black text-white">Cocina al día</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
                No hay pedidos activos en este momento. Los nuevos pedidos aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-4 p-4 sm:p-5 xl:p-6 ${columnasVisibles.length === 1 ? 'max-w-2xl' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
              {columnasVisibles.map((columna) => {
                const pedidosColumna = pedidos.filter(
                  (pedido) => pedido.estado_pedido === columna.estado
                )
                const IconoColumna = columna.icono

                return (
                  <div key={columna.estado} className="min-w-0">
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${columna.iconoFondo}`}>
                          <IconoColumna size={15} className={columna.iconoTexto} />
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-white/80">{columna.titulo}</h3>
                          <p className="text-[10px] text-white/30">{columna.descripcion}</p>
                        </div>
                      </div>
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white/[0.06] px-2 text-xs font-black text-white/55">
                        {pedidosColumna.length}
                      </span>
                    </div>

                    <div>
                      {pedidosColumna.length > 0 ? (() => {
                        const pedidosOrdenados = [...pedidosColumna].sort(
                          (pedidoA, pedidoB) =>
                            new Date(pedidoA.created_at || 0).getTime() -
                            new Date(pedidoB.created_at || 0).getTime()
                        )

                        const ultimoIndice = pedidosOrdenados.length - 1
                        const indiceActual = Math.min(
                          indicePorEstado[columna.estado] || 0,
                          ultimoIndice
                        )
                        const pedidoVisible = pedidosOrdenados[indiceActual]

                        const cambiarPedidoVisible = (direccion) => {
                          setIndicePorEstado((indicesActuales) => {
                            const indiceGuardado = Math.min(
                              indicesActuales[columna.estado] || 0,
                              ultimoIndice
                            )

                            const siguienteIndice =
                              direccion === 'anterior'
                                ? Math.max(0, indiceGuardado - 1)
                                : Math.min(ultimoIndice, indiceGuardado + 1)

                            return {
                              ...indicesActuales,
                              [columna.estado]: siguienteIndice,
                            }
                          })
                        }

                        return (
                          <div>
                            {pedidosOrdenados.length > 1 && (
                              <div className="mb-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-2.5 py-2">
                                <button
                                  type="button"
                                  onClick={() => cambiarPedidoVisible('anterior')}
                                  disabled={indiceActual === 0}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/55 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                  aria-label={`Pedido anterior de ${columna.titulo}`}
                                >
                                  <ChevronLeft size={16} />
                                </button>

                                <div className="text-center">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                    Prioridad por antigüedad
                                  </p>
                                  <p className="mt-0.5 text-xs font-black text-white/70">
                                    Pedido {indiceActual + 1} de {pedidosOrdenados.length}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => cambiarPedidoVisible('siguiente')}
                                  disabled={indiceActual === ultimoIndice}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/55 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                  aria-label={`Siguiente pedido de ${columna.titulo}`}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            )}

                            <div key={pedidoVisible.id} className="animate-kitchen-card-in">
                              {renderTarjetaPedido(pedidoVisible, columna)}
                            </div>

                            {pedidosOrdenados.length > 1 && (
                              <div className="mt-3 flex items-center justify-center gap-1.5">
                                {pedidosOrdenados.map((pedido, indice) => (
                                  <button
                                    key={pedido.id}
                                    type="button"
                                    onClick={() =>
                                      setIndicePorEstado((indicesActuales) => ({
                                        ...indicesActuales,
                                        [columna.estado]: indice,
                                      }))
                                    }
                                    className={`h-1.5 rounded-full transition-all ${
                                      indice === indiceActual
                                        ? 'w-6 bg-[#ff9d45]'
                                        : 'w-1.5 bg-white/15 hover:bg-white/30'
                                    }`}
                                    aria-label={`Mostrar pedido ${indice + 1} de ${columna.titulo}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })() : (
                        <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-4 text-center">
                          <IconoColumna size={22} className="text-white/15" />
                          <p className="mt-2 text-xs font-medium text-white/25">
                            Sin pedidos en esta etapa
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <style>{`
          .custom-kitchen-scrollbar::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }

          .custom-kitchen-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-kitchen-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.10);
            border-radius: 999px;
          }

          .custom-kitchen-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.18);
          }

          @keyframes kitchen-card-in {
            from {
              opacity: 0;
              transform: translateX(10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .animate-kitchen-card-in {
            animation: kitchen-card-in 180ms ease-out;
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}

export default CocinaDashboard