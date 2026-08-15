import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'
import CajaLayout from '../components/CajaLayout'

import PersonalizadorPizza from '../components/PersonalizadorPizza'
import PersonalizadorPasta from '../components/PersonalizadorPasta'
import PersonalizadorAcompanamientos from '../components/PersonalizadorAcompanamientos'
import HorarioPedidosBanner from '../components/HorarioPedidosBanner'
import useHorarioPedidos from '../hooks/useHorarioPedidos'

import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ImageOff,
  Search,
  User,
  CreditCard,
  DollarSign,
  Smartphone,
  Store,
  UtensilsCrossed,
  Sparkles,
  X,
  CheckCircle2,
  Package,
  Clock,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react'

const MODALIDADES = [
  { value: 'consumo_local', label: 'Consumo en local' },
  { value: 'retiro', label: 'Para retirar' },
]

const METODOS_PAGO = [
  { value: 'sinpe', label: 'SINPE', icon: Smartphone },
  { value: 'efectivo', label: 'Efectivo', icon: DollarSign },
  { value: 'tarjeta', label: 'Datáfono', icon: CreditCard },
]

const OPCIONES_CAJA = [
  { value: 'venta', label: 'Venta', descripcion: 'Crear pedidos', icon: ShoppingCart },
  { value: 'pedidos', label: 'Pedidos', descripcion: 'Pedidos listos para cobrar', icon: Package },
  { value: 'caja', label: 'Caja', descripcion: 'Turno y movimientos', icon: DollarSign },
]

function CajaDashboard() {
  // =========================================================
  // NAVEGACIÓN DEL POS
  // =========================================================

  const [seccionActiva, setSeccionActiva] = useState('venta')

  // =========================================================
  // USUARIO ACTUAL
  // =========================================================

  const [usuario, setUsuario] = useState(null)

  // =========================================================
  // PRODUCTOS
  // =========================================================

  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)

  const [carrito, setCarrito] = useState([])
  const [modalidad, setModalidad] = useState('consumo_local')

  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')

  // =========================================================
  // PEDIDOS WEB PARA CAJA
  // =========================================================

  const [pedidosWeb, setPedidosWeb] = useState([])
  const [cargandoPedidosWeb, setCargandoPedidosWeb] = useState(false)
  const [ultimaActualizacionPedidos, setUltimaActualizacionPedidos] = useState(null)
  const cargandoPedidosWebRef = useRef(false)

  // =========================================================
  // MODAL DE COBRO
  // =========================================================

  const [mostrarModalCobro, setMostrarModalCobro] = useState(false)
  const [pedidoACobrar, setPedidoACobrar] = useState(null)
  const [metodoPagoCobro, setMetodoPagoCobro] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [cobrando, setCobrando] = useState(false)
  const [errorCobro, setErrorCobro] = useState('')

  // =========================================================
  // SELECTOR DE CLIENTE
  // =========================================================

  const [mostrarSelectorCliente, setMostrarSelectorCliente] = useState(false)

  // =========================================================
  // APERTURA, MOVIMIENTOS, ARQUEO Y CIERRE
  // =========================================================

  const [estadoCaja, setEstadoCaja] = useState(null)
  const [cargandoCaja, setCargandoCaja] = useState(true)

  const [mostrarMovimientoCaja, setMostrarMovimientoCaja] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState('salida')
  const [montoMovimiento, setMontoMovimiento] = useState('')
  const [motivoMovimiento, setMotivoMovimiento] = useState('')
  const [observacionesMovimiento, setObservacionesMovimiento] = useState('')
  const [errorMovimiento, setErrorMovimiento] = useState('')
  const [registrandoMovimiento, setRegistrandoMovimiento] = useState(false)

  // =========================================================
  // HORARIO
  // =========================================================

  const {
    estado: estadoHorario,
    cargando: cargandoHorario,
    recargar: recargarHorario,
  } = useHorarioPedidos()

  // =========================================================
  // PERSONALIZADORES
  // =========================================================

  const [productoPersonalizando, setProductoPersonalizando] = useState(null)
  const [productoPastaPersonalizando, setProductoPastaPersonalizando] = useState(null)
  const [productoAcompanamientosPersonalizando, setProductoAcompanamientosPersonalizando] = useState(null)

  // =========================================================
  // CLIENTES
  // =========================================================

  const [clientes, setClientes] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    correo: '',
  })

  // =========================================================
  // SINPE
  // =========================================================

  const DATOS_SINPE = {
    telefono: '8888-8888',
    nombre: 'Pizzería Rooster S.A.',
  }

  // =========================================================
  // FORMATEO
  // =========================================================

  const formatearPrecio = (monto) => {
    const valor = Number(monto)
    if (!Number.isFinite(valor)) {
      return '0'
    }
    return valor.toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatearFechaHora = (valor) => {
    if (!valor) {
      return '—'
    }
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) {
      return '—'
    }
    return new Intl.DateTimeFormat('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(fecha)
  }

  // =========================================================
  // CARGAR USUARIO ACTUAL
  // =========================================================

  useEffect(() => {
    const userStr = sessionStorage.getItem('rooster_user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUsuario(user)
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }
  }, [])

  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'administrador'

  // =========================================================
  // ESTADO DE CAJA
  // =========================================================

  const cargarEstadoCaja = async (silencioso = false) => {
    if (!silencioso) {
      setCargandoCaja(true)
    }

    try {
      const response = await api.get('/caja/actual')
      setEstadoCaja(response.data)
      return response.data
    } catch (err) {
      console.error('Error consultando el estado de caja:', err)
      if (!silencioso) {
        setMensaje({
          tipo: 'error',
          texto: err.response?.data?.message || 'No se pudo consultar el estado de la caja.',
        })
      }
      return null
    } finally {
      if (!silencioso) {
        setCargandoCaja(false)
      }
    }
  }

  // =========================================================
  // CARGAR PEDIDOS WEB
  // =========================================================

  const cargarPedidosWeb = useCallback(
    async ({ silencioso = false } = {}) => {
      if (cargandoPedidosWebRef.current) {
        return
      }

      cargandoPedidosWebRef.current = true

      if (!silencioso) {
        setCargandoPedidosWeb(true)
      }

      try {
        const response = await api.get(
          '/caja/pedidos-pendientes'
        )

        const pedidos = Array.isArray(
          response.data?.pedidos
        )
          ? response.data.pedidos
          : []

        /*
         * Esta vista solamente contiene pedidos que ya pueden
         * pasar por cobro. Incluye pedidos Web y POS.
         */
        const pedidosListos = pedidos.filter(
          (pedido) =>
            pedido.estado_pedido === 'listo' &&
            pedido.estado_pago !== 'pagado'
        )

        setPedidosWeb(pedidosListos)
        setUltimaActualizacionPedidos(new Date())
      } catch (err) {
        console.error(
          'Error cargando pedidos listos para cobrar:',
          err
        )

        /*
         * Las consultas automáticas no deben llenar la pantalla
         * con mensajes si hay un fallo momentáneo de red.
         */
        if (!silencioso) {
          setMensaje({
            tipo: 'error',
            texto:
              err.response?.data?.message ||
              'No se pudieron cargar los pedidos listos para cobrar.',
          })
        }
      } finally {
        cargandoPedidosWebRef.current = false

        if (!silencioso) {
          setCargandoPedidosWeb(false)
        }
      }
    },
    []
  )



  // =========================================================
  // CARGA INICIAL
  // =========================================================

  useEffect(() => {
    cargarEstadoCaja(false)

    const intervaloEstadoCaja = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarEstadoCaja(true)
      }
    }, 10000)

    return () =>
      clearInterval(intervaloEstadoCaja)
  }, [])

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [productosRes, clientesRes] = await Promise.all([
          api.get('/productos'),
          api.get('/clientes'),
        ])
        setProductos(productosRes.data)
        setClientes(clientesRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setCargandoProductos(false)
      }
    }

    cargarDatos()
  }, [])

  useEffect(() => {
    if (seccionActiva !== 'pedidos') {
      return undefined
    }

    /*
     * Primera carga visible al entrar a la pestaña.
     */
    cargarPedidosWeb({ silencioso: false })

    /*
     * Luego sincroniza en segundo plano cada 4 segundos.
     * No muestra pantalla de carga para evitar parpadeos.
     */
    const intervaloPedidos = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarPedidosWeb({ silencioso: true })
      }
    }, 4000)

    const manejarVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        cargarPedidosWeb({ silencioso: true })
      }
    }

    document.addEventListener(
      'visibilitychange',
      manejarVisibilidad
    )

    return () => {
      clearInterval(intervaloPedidos)

      document.removeEventListener(
        'visibilitychange',
        manejarVisibilidad
      )
    }
  }, [seccionActiva, cargarPedidosWeb])

  // =========================================================
  // FILTRO CLIENTES
  // =========================================================

  const terminoCliente = busquedaCliente.trim().toLowerCase()
  const clientesFiltrados = clientes.filter((cliente) => {
    const nombre = String(cliente.nombre || '').toLowerCase()
    const telefono = String(cliente.telefono || '')
    const correo = String(cliente.correo || '').toLowerCase()
    return (
      terminoCliente === '' ||
      nombre.includes(terminoCliente) ||
      telefono.includes(busquedaCliente.trim()) ||
      correo.includes(terminoCliente)
    )
  })

  // =========================================================
  // AGREGAR PRODUCTOS
  // =========================================================

  const agregarAlCarrito = (producto) => {
    if (!estadoCaja?.abierta || !estadoCaja?.puede_operar) {
      setMensaje({
        tipo: 'error',
        texto: 'No tienes una caja asignada o la caja no está abierta.',
      })
      return
    }

    if (producto.es_pizza) {
      setProductoPersonalizando(producto)
      return
    }

    if (producto.es_pasta_personalizable) {
      setProductoPastaPersonalizando(producto)
      return
    }

    if (producto.usa_acompanamientos) {
      setProductoAcompanamientosPersonalizando(producto)
      return
    }

    setCarrito((prev) => {
      const existente = prev.find(
        (item) => Number(item.producto_id) === Number(producto.id) && !tieneExtras(item)
      )

      if (existente) {
        return prev.map((item) =>
          item.linea_id === existente.linea_id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }

      return [
        ...prev,
        {
          linea_id: crearLineaId(producto.id),
          producto_id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion || null,
          imagen_url: producto.imagen_url || null,
          precio: Number(producto.precio) || 0,
          cantidad: 1,
          tamano_pizza: null,
          extras: null,
          extras_ids: [],
          pasta: null,
          acompanamientos_ids: [],
          observaciones: null,
          alergias: null,
          personalizacion: null,
        },
      ]
    })
  }

  const handleConfirmarPersonalizacion = (itemPersonalizado) => {
    const productoOrigen =
      productoPersonalizando || productoPastaPersonalizando || productoAcompanamientosPersonalizando

    const productoId = itemPersonalizado.producto_id ?? productoOrigen?.id

    if (!productoId) {
      setMensaje({
        tipo: 'error',
        texto: 'No se pudo identificar el producto personalizado.',
      })
      return
    }

    const nuevaLinea = {
      linea_id: crearLineaId(productoId),
      producto_id: productoId,
      nombre: itemPersonalizado.nombre || productoOrigen?.nombre || 'Producto',
      descripcion: itemPersonalizado.descripcion || productoOrigen?.descripcion || null,
      imagen_url: itemPersonalizado.imagen_url || productoOrigen?.imagen_url || null,
      precio: Number(itemPersonalizado.precio) || Number(productoOrigen?.precio) || 0,
      cantidad: Number(itemPersonalizado.cantidad) || 1,
      tamano_pizza:
        itemPersonalizado.tamano_pizza === 'personal'
          ? 'personal'
          : itemPersonalizado.tamano_pizza === 'grande'
            ? 'grande'
            : null,
      extras: itemPersonalizado.extras || null,
      extras_ids: Array.isArray(itemPersonalizado.extras_ids) ? itemPersonalizado.extras_ids : [],
      pasta:
        itemPersonalizado.pasta && typeof itemPersonalizado.pasta === 'object' && !Array.isArray(itemPersonalizado.pasta)
          ? itemPersonalizado.pasta
          : null,
      acompanamientos_ids: Array.isArray(itemPersonalizado.acompanamientos_ids)
        ? itemPersonalizado.acompanamientos_ids
        : [],
      observaciones: itemPersonalizado.observaciones || null,
      alergias: itemPersonalizado.alergias || null,
      personalizacion: itemPersonalizado.personalizacion || null,
    }

    setCarrito((prev) => [...prev, nuevaLinea])

    setProductoPersonalizando(null)
    setProductoPastaPersonalizando(null)
    setProductoAcompanamientosPersonalizando(null)
  }

  const cambiarCantidad = (lineaId, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) => (item.linea_id === lineaId ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter((item) => item.cantidad > 0)
    )
  }

  const quitarDelCarrito = (lineaId) => {
    setCarrito((prev) => prev.filter((item) => item.linea_id !== lineaId))
  }

  const tieneExtras = (item) => {
    const tienePasta = item.pasta && typeof item.pasta === 'object' && !Array.isArray(item.pasta)
    const tieneAcompanamientos = Array.isArray(item.acompanamientos_ids) && item.acompanamientos_ids.length > 0
    const tieneTamanoPizza = item.tamano_pizza === 'grande' || item.tamano_pizza === 'personal'

    return Boolean(
      item.extras ||
      item.observaciones ||
      item.alergias ||
      tienePasta ||
      tieneAcompanamientos ||
      tieneTamanoPizza ||
      item.personalizacion
    )
  }

  const crearLineaId = (productoId) => {
    const identificador =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    return `${productoId}-${identificador}`
  }

  // =========================================================
  // TOTALES
  // =========================================================

  const COSTO_EMPAQUE_RETIRO = 500

  const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const costoEmpaque = modalidad === 'retiro' ? COSTO_EMPAQUE_RETIRO : 0
  const total = subtotal + costoEmpaque

  // =========================================================
  // CREAR CLIENTE
  // =========================================================

  const handleCrearCliente = async (event) => {
    event.preventDefault()

    try {
      const response = await api.post('/clientes', nuevoCliente)
      setClientes((prev) => [...prev, response.data])
      setClienteSeleccionado(response.data)
      setMostrarFormCliente(false)
      setMostrarSelectorCliente(false)
      setBusquedaCliente('')
      setNuevoCliente({ nombre: '', telefono: '', correo: '' })

      setMensaje({
        tipo: 'exito',
        texto: `Cliente ${response.data.nombre} registrado correctamente`,
      })
    } catch (err) {
      console.error('Error registrando cliente:', err)
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al registrar cliente',
      })
    }
  }

  // =========================================================
  // CREAR PEDIDO (CAJA)
  // =========================================================

  const crearPedido = async () => {
    const cajaActualizada = await cargarEstadoCaja(true)

    if (!cajaActualizada?.abierta || !cajaActualizada?.puede_operar) {
      setMensaje({
        tipo: 'error',
        texto: 'No tienes una caja asignada o la caja no está abierta.',
      })
      return
    }

    const estadoActual = await recargarHorario({ silencioso: true })

    if (!estadoActual.abierta) {
      setMensaje({
        tipo: 'error',
        texto: estadoActual.mensaje,
      })
      return
    }

    if (carrito.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Agrega productos al carrito',
      })
      return
    }

    if (!clienteSeleccionado) {
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona o registra un cliente',
      })
      return
    }

    setEnviando(true)
    setMensaje(null)

    try {
      const productosPayload = carrito.map((item) => {
        const pasta =
          item.pasta && typeof item.pasta === 'object' && !Array.isArray(item.pasta)
            ? {
              tipo_pasta_id: item.pasta.tipo_pasta_id ?? null,
              proteina_ids: Array.isArray(item.pasta.proteina_ids) ? item.pasta.proteina_ids : [],
              salsa_id: item.pasta.salsa_id ?? null,
              ingrediente_ids: Array.isArray(item.pasta.ingrediente_ids) ? item.pasta.ingrediente_ids : [],
            }
            : null

        return {
          producto_id: item.producto_id,
          cantidad: Number(item.cantidad) || 1,
          tamano_pizza:
            item.tamano_pizza === 'personal' ? 'personal' : item.tamano_pizza === 'grande' ? 'grande' : null,
          extras: item.extras || null,
          extras_ids: Array.isArray(item.extras_ids) ? item.extras_ids : [],
          pasta,
          acompanamientos_ids: Array.isArray(item.acompanamientos_ids) ? item.acompanamientos_ids : [],
          observaciones: item.observaciones || null,
          alergias: item.alergias || null,
        }
      })

      const payload = {
        cliente_id: clienteSeleccionado.id,
        modalidad_entrega: modalidad,
        productos: JSON.stringify(productosPayload),
      }

      const response = await api.post('/pedidos', payload)

      const pedido = response.data.pedido

      setMensaje({
        tipo: 'exito',
        texto: `✅ Pedido #${pedido.codigo_tracking} creado para ${clienteSeleccionado.nombre}`,
      })

      setCarrito([])
      await cargarEstadoCaja(true)
    } catch (err) {
      console.error('Error creando pedido:', err)

      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al crear el pedido',
      })
    } finally {
      setEnviando(false)
    }
  }

  // =========================================================
  // COBRAR PEDIDO
  // =========================================================

  const abrirModalCobro = (pedido) => {
    setPedidoACobrar(pedido)
    setMetodoPagoCobro('efectivo')
    setMontoRecibido('')
    setErrorCobro('')
    setMostrarModalCobro(true)
  }

  const cerrarModalCobro = () => {
    if (cobrando) return
    setMostrarModalCobro(false)
    setPedidoACobrar(null)
    setMetodoPagoCobro('efectivo')
    setMontoRecibido('')
    setErrorCobro('')
  }

  const calcularCambio = () => {
    if (!pedidoACobrar || metodoPagoCobro !== 'efectivo') return 0
    const recibido = Number(montoRecibido) || 0
    const totalPedido = Number(pedidoACobrar.total) || 0
    return recibido >= totalPedido ? recibido - totalPedido : 0
  }

  const confirmarCobro = async () => {
    if (!pedidoACobrar) return

    if (metodoPagoCobro === 'efectivo') {
      const recibido = Number(montoRecibido) || 0
      if (recibido < pedidoACobrar.total) {
        setErrorCobro('El monto recibido debe ser igual o mayor al total del pedido.')
        return
      }
    }

    setCobrando(true)
    setErrorCobro('')

    try {
      const payload = {
        metodo_pago: metodoPagoCobro,
      }

      if (metodoPagoCobro === 'efectivo') {
        payload.monto_recibido = Number(montoRecibido) || 0
      }

      const pedidoCobradoId = pedidoACobrar.id
      const codigoCobrado =
        pedidoACobrar.codigo_tracking

      await api.post(
        `/pedidos/${pedidoCobradoId}/cobrar`,
        payload
      )

      /*
       * Se elimina inmediatamente de la cola visible y después
       * se hace una sincronización silenciosa de respaldo.
       */
      setPedidosWeb((listaActual) =>
        listaActual.filter(
          (pedido) =>
            pedido.id !== pedidoCobradoId
        )
      )

      setMostrarModalCobro(false)
      setPedidoACobrar(null)
      setMetodoPagoCobro('efectivo')
      setMontoRecibido('')
      setErrorCobro('')

      await cargarPedidosWeb({
        silencioso: true,
      })
      await cargarEstadoCaja(true)

      setMensaje({
        tipo: 'exito',
        texto: `Pedido #${codigoCobrado} cobrado correctamente.`,
      })
    } catch (err) {
      console.error('Error al cobrar pedido:', err)
      const mensajeError = err.response?.data?.message || 'No se pudo cobrar el pedido.'
      setErrorCobro(mensajeError)
    } finally {
      setCobrando(false)
    }
  }

  // =========================================================
  // MOVIMIENTOS DE CAJA
  // =========================================================

  const motivosMovimiento =
    tipoMovimiento === 'entrada'
      ? ['Refuerzo de cambio', 'Reintegro de efectivo', 'Corrección de entrada', 'Otro']
      : ['Compra operativa', 'Retiro de efectivo', 'Pago menor', 'Corrección de salida', 'Otro']

  const registrarMovimientoCaja = async (event) => {
    event.preventDefault()

    const monto = Number(montoMovimiento)

    if (!Number.isFinite(monto) || monto < 1) {
      setErrorMovimiento('Ingresa un monto válido mayor o igual a ₡1.')
      return
    }

    if (!motivoMovimiento) {
      setErrorMovimiento('Selecciona un motivo para el movimiento.')
      return
    }

    setRegistrandoMovimiento(true)
    setErrorMovimiento('')

    try {
      const response = await api.post('/caja/movimientos', {
        tipo: tipoMovimiento,
        monto,
        motivo: motivoMovimiento,
        observaciones: observacionesMovimiento.trim() || null,
      })

      if (response.data?.estado) {
        setEstadoCaja(response.data.estado)
      } else {
        await cargarEstadoCaja(true)
      }

      setMostrarMovimientoCaja(false)
      setMontoMovimiento('')
      setMotivoMovimiento('')
      setObservacionesMovimiento('')
      setErrorMovimiento('')

      setMensaje({
        tipo: 'exito',
        texto:
          response.data?.message ||
          `${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente.`,
      })
    } catch (err) {
      console.error('Error registrando movimiento de caja:', err)

      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().find(Boolean)
        : null

      setErrorMovimiento(
        primerError ||
          err.response?.data?.message ||
          'No se pudo registrar el movimiento de caja.'
      )
    } finally {
      setRegistrandoMovimiento(false)
    }
  }

  // =========================================================
  // FILTROS PRODUCTOS
  // =========================================================

  const productosPorCategoria = productos.reduce((acc, producto) => {
    const categoria = producto.categoria?.nombre || 'Otros'
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(producto)
    return acc
  }, {})

  const categorias = ['Todos', ...Object.keys(productosPorCategoria)]

  const terminoProducto = busquedaProducto.trim().toLowerCase()

  const productosFiltrados = productos.filter((producto) => {
    const categoria = producto.categoria?.nombre || 'Otros'
    const coincideCategoria = categoriaActiva === 'Todos' || categoria === categoriaActiva
    const coincideBusqueda =
      terminoProducto === '' ||
      producto.nombre?.toLowerCase().includes(terminoProducto) ||
      producto.descripcion?.toLowerCase().includes(terminoProducto) ||
      categoria.toLowerCase().includes(terminoProducto)

    return coincideCategoria && coincideBusqueda
  })

  const cantidadItems = carrito.reduce((suma, item) => suma + item.cantidad, 0)

  const cerrarSelectorCliente = () => {
    setMostrarSelectorCliente(false)
    setBusquedaCliente('')
    setMostrarFormCliente(false)
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <CajaLayout titulo="Punto de venta" estadoCaja={estadoCaja}>
      <style>{`
        .caja-dashboard {
          background: #0c0a08;
        }
        .custom-pos-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 163, 0, 0.3) transparent;
        }
        .custom-pos-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-pos-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-pos-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 163, 0, 0.3);
          border-radius: 999px;
        }
        .custom-pos-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 163, 0, 0.6);
        }
        .fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(245, 163, 0, 0.15);
        }
        .btn-glow {
          box-shadow: 0 0 20px rgba(245, 163, 0, 0.15);
        }
        .btn-glow:hover {
          box-shadow: 0 0 30px rgba(245, 163, 0, 0.25);
        }
        .input-modern {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s ease;
        }
        .input-modern:focus {
          border-color: rgba(245, 163, 0, 0.5);
          box-shadow: 0 0 0 3px rgba(245, 163, 0, 0.05);
          outline: none;
        }
        .input-modern::placeholder {
          color: rgba(255,255,255,0.15);
        }
        .tab-active {
          border-bottom: 2px solid #F5A300;
          color: white;
        }
        .tab-inactive {
          border-bottom: 2px solid transparent;
          color: rgba(255,255,255,0.3);
        }
        .tab-inactive:hover {
          color: rgba(255,255,255,0.6);
          border-bottom-color: rgba(255,255,255,0.1);
        }
      `}</style>

      <div className="caja-dashboard min-h-[calc(100vh-6rem)] px-4 pb-8 pt-4 md:px-6 lg:px-8">
        {/* MENSAJES */}
        {mensaje && (
          <div
            className={`fade-in mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${mensaje.tipo === 'exito'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
              }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${mensaje.tipo === 'exito' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
            />
            {mensaje.texto}
          </div>
        )}

        {cargandoCaja ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/5 border-t-[#F5A300]" />
              <p className="mt-4 text-xs font-medium text-white/20">Cargando estado de caja...</p>
            </div>
          </div>
        ) : !estadoCaja?.abierta ? (
          /* =====================================================
              CAJA CERRADA - PANTALLA DE ESPERA
          ====================================================== */
          <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
            <div className="w-full rounded-3xl border border-white/5 bg-[#0f0d0b] p-12 text-center shadow-2xl">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
                <Lock size={48} />
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
                Caja no disponible
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                {esAdmin
                  ? 'No hay una caja abierta. Como administrador, puedes abrir una nueva caja.'
                  : 'La caja no está abierta o no ha sido asignada a tu usuario. Contacta al administrador para iniciar el turno.'}
              </p>

              {esAdmin ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F5A300] px-6 py-3 text-sm font-black text-black transition hover:bg-[#ffb72b]"
                >
                  <RefreshCw size={16} />
                  Reintentar
                </button>
              ) : (
                <p className="mt-4 text-xs text-white/20">
                  Un administrador debe abrir la caja y asignarla a un usuario.
                </p>
              )}
            </div>
          </div>
        ) : !estadoCaja?.puede_operar ? (
          /* =====================================================
              CAJA ABIERTA PERO NO ASIGNADA A ESTE USUARIO
          ====================================================== */
          <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
            <div className="w-full rounded-3xl border border-white/5 bg-[#0f0d0b] p-12 text-center shadow-2xl">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-400/10 text-rose-300">
                <AlertCircle size={48} />
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
                Caja asignada a otro usuario
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                La caja actual está asignada a{' '}
                <span className="font-bold text-white/60">
                  {estadoCaja.sesion?.usuarioAsignado?.name || 'otro usuario'}
                </span>
                . No puedes operar esta caja.
              </p>

              <p className="mt-2 text-xs text-white/20">
                Contacta al administrador para reasignar la caja a tu usuario.
              </p>
            </div>
          </div>
        ) : (
          /* =====================================================
              CAJA ABIERTA Y ASIGNADA - CONTENIDO NORMAL
          ====================================================== */
          <>
            {/* HEADER Y NAVEGACIÓN (TABS) */}
            <header className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-white">Punto de venta</h1>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                    {estadoCaja.sesion?.id ? `Turno #${estadoCaja.sesion.id}` : 'Activo'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/20">
                  {estadoCaja.sesion?.usuarioApertura?.name || 'Usuario'} · Inicio:{' '}
                  {formatearFechaHora(estadoCaja.sesion?.fecha_apertura)}
                  {estadoCaja.sesion?.usuarioAsignado && (
                    <>
                      {' '}· Asignado a: <span className="text-[#F5A300]">{estadoCaja.sesion.usuarioAsignado.name}</span>
                    </>
                  )}
                </p>
              </div>
              <nav className="flex w-full gap-1 overflow-x-auto md:w-auto">
                {OPCIONES_CAJA.map((opcion) => {
                  const Icon = opcion.icon
                  const isActive = seccionActiva === opcion.value
                  return (
                    <button
                      key={opcion.value}
                      type="button"
                      onClick={() => setSeccionActiva(opcion.value)}
                      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs font-bold transition-all ${isActive ? 'tab-active' : 'tab-inactive'
                        }`}
                    >
                      <Icon size={15} />
                      {opcion.label}
                    </button>
                  )
                })}
              </nav>
            </header>

            {/* =====================================================
                SECCIÓN: VENTA
            ====================================================== */}
            {seccionActiva === 'venta' && (
              <>
                <HorarioPedidosBanner
                  estado={estadoHorario}
                  cargando={cargandoHorario}
                  compacto
                  className="mb-6 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm"
                />

                <div className="grid items-start gap-6 xl:grid-cols-[1fr_420px]">
                  {/* COLUMNA IZQUIERDA: CATÁLOGO */}
                  <main className="min-w-0 space-y-5">
                    {/* Cliente */}
                    <section className="relative z-30 rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${clienteSeleccionado
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-white/5 text-white/20'
                              }`}
                          >
                            {clienteSeleccionado ? <CheckCircle2 size={18} /> : <User size={18} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Cliente</p>
                            {clienteSeleccionado ? (
                              <>
                                <p className="truncate text-sm font-bold text-white/80">
                                  {clienteSeleccionado.nombre}
                                </p>
                                <p className="truncate text-xs text-white/20">
                                  {clienteSeleccionado.telefono || 'Sin teléfono'}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-medium text-white/30">Selecciona un cliente</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {clienteSeleccionado && (
                            <button
                              type="button"
                              onClick={() => setClienteSeleccionado(null)}
                              className="rounded-xl border border-white/5 px-3 py-2 text-xs font-bold text-white/30 transition hover:bg-white/5"
                            >
                              Quitar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setMostrarSelectorCliente(!mostrarSelectorCliente)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A300] px-4 py-2 text-xs font-black text-black transition hover:bg-[#ffb72b]"
                          >
                            <Search size={14} />
                            {clienteSeleccionado ? 'Cambiar' : 'Seleccionar'}
                          </button>
                        </div>
                      </div>

                      {mostrarSelectorCliente && (
                        <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-50 max-h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d0b] shadow-2xl backdrop-blur-xl fade-in">
                          <div className="flex items-center gap-3 border-b border-white/5 p-3">
                            <div className="relative flex-1">
                              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                              <input
                                autoFocus
                                type="search"
                                placeholder="Buscar cliente..."
                                value={busquedaCliente}
                                onChange={(e) => setBusquedaCliente(e.target.value)}
                                className="input-modern w-full rounded-xl bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={cerrarSelectorCliente}
                              className="text-white/30 transition hover:text-white"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {!mostrarFormCliente ? (
                            <>
                              <div className="max-h-64 overflow-y-auto p-2 custom-pos-scrollbar">
                                {clientesFiltrados.length > 0 ? (
                                  clientesFiltrados.slice(0, 12).map((cliente) => (
                                    <button
                                      type="button"
                                      key={cliente.id}
                                      onClick={() => {
                                        setClienteSeleccionado(cliente)
                                        cerrarSelectorCliente()
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5"
                                    >
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs font-black text-white/50">
                                        {String(cliente.nombre || 'C').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-white/75">
                                          {cliente.nombre}
                                        </p>
                                        <p className="truncate text-[11px] text-white/30">
                                          {cliente.telefono || 'Sin teléfono'}
                                          {cliente.correo && ` · ${cliente.correo}`}
                                        </p>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-8 text-center">
                                    <User className="mx-auto h-7 w-7 text-white/10" />
                                    <p className="mt-2 text-sm font-semibold text-white/35">No encontramos clientes</p>
                                  </div>
                                )}
                              </div>
                              <div className="border-t border-white/5 p-3">
                                <button
                                  type="button"
                                  onClick={() => setMostrarFormCliente(true)}
                                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5A300]/20 bg-[#F5A300]/10 px-4 py-2.5 text-sm font-black text-[#F5A300] transition hover:bg-[#F5A300]/20"
                                >
                                  <Plus size={15} />
                                  Nuevo cliente
                                </button>
                              </div>
                            </>
                          ) : (
                            <form onSubmit={handleCrearCliente} className="space-y-3 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-black text-white">Registrar cliente</p>
                                  <p className="text-xs text-white/30">Datos básicos del cliente</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setMostrarFormCliente(false)}
                                  className="text-xs font-bold text-[#F5A300]"
                                >
                                  Volver
                                </button>
                              </div>
                              <div className="grid gap-3 md:grid-cols-3">
                                <input
                                  type="text"
                                  placeholder="Nombre completo"
                                  value={nuevoCliente.nombre}
                                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                                  required
                                  className="input-modern rounded-xl px-3 py-2.5 text-sm text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Teléfono"
                                  value={nuevoCliente.telefono}
                                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                                  className="input-modern rounded-xl px-3 py-2.5 text-sm text-white"
                                />
                                <input
                                  type="email"
                                  placeholder="Correo"
                                  value={nuevoCliente.correo}
                                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })}
                                  className="input-modern rounded-xl px-3 py-2.5 text-sm text-white"
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full rounded-xl bg-[#F5A300] py-2.5 text-sm font-black text-black transition hover:bg-[#ffb72b]"
                              >
                                Guardar cliente
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </section>

                    {/* Filtros de Productos */}
                    <section className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-bold text-white/60">Catálogo</h2>
                        <div className="relative w-full sm:max-w-xs">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
                          <input
                            type="search"
                            value={busquedaProducto}
                            onChange={(e) => setBusquedaProducto(e.target.value)}
                            placeholder="Buscar producto..."
                            className="input-modern w-full rounded-xl bg-black/20 py-2 pl-9 pr-3 text-sm text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 custom-pos-scrollbar">
                        {categorias.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategoriaActiva(cat)}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${categoriaActiva === cat
                                ? 'bg-[#F5A300] text-black'
                                : 'bg-white/5 text-white/30 hover:bg-white/10'
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Grid de Productos */}
                    {cargandoProductos ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="animate-pulse rounded-2xl bg-white/5 p-4">
                            <div className="aspect-square rounded-xl bg-white/5" />
                            <div className="mt-3 h-2.5 w-3/4 rounded bg-white/5" />
                            <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
                          </div>
                        ))}
                      </div>
                    ) : productosFiltrados.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
                        <Search className="mx-auto h-8 w-8 text-white/10" />
                        <p className="mt-3 text-sm font-medium text-white/20">No se encontraron productos</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {productosFiltrados.map((producto) => {
                          const esPersonalizable =
                            producto.es_pizza || producto.es_pasta_personalizable || producto.usa_acompanamientos
                          return (
                            <button
                              key={producto.id}
                              type="button"
                              onClick={() => agregarAlCarrito(producto)}
                              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 text-left transition hover:-translate-y-1 hover:border-[#F5A300]/30 hover:shadow-lg"
                            >
                              <div className="aspect-square overflow-hidden bg-black/20">
                                {producto.imagen_url ? (
                                  <img
                                    src={producto.imagen_url}
                                    alt={producto.nombre}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ImageOff size={24} className="text-white/10" />
                                  </div>
                                )}
                                {esPersonalizable && (
                                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#F5A300] backdrop-blur-sm">
                                    <Sparkles size={10} className="inline" /> Personalizable
                                  </span>
                                )}
                                <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:bg-[#F5A300] group-hover:text-black">
                                  <Plus size={14} />
                                </span>
                              </div>
                              <div className="p-3">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                                  {producto.categoria?.nombre || 'Otros'}
                                </p>
                                <h3 className="mt-0.5 truncate text-sm font-bold text-white/80">{producto.nombre}</h3>
                                <p className="mt-2 font-mono text-base font-black text-[#F5A300]">
                                  ₡{formatearPrecio(producto.precio)}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </main>

                  {/* COLUMNA DERECHA: CARRITO Y CHECKOUT */}
                  <aside className="sticky top-20 flex h-[calc(100vh-120px)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0f0d0b]">
                    <div className="shrink-0 border-b border-white/5 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart size={18} className="text-white/20" />
                          <h3 className="text-sm font-bold text-white">Pedido</h3>
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/30">
                            {cantidadItems}
                          </span>
                        </div>
                        {carrito.length > 0 && (
                          <button
                            onClick={() => setCarrito([])}
                            className="text-[10px] font-bold text-white/20 transition hover:text-rose-400"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-pos-scrollbar">
                      <div className="p-3">
                        {carrito.length === 0 ? (
                          <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                            <div className="rounded-full bg-white/5 p-3">
                              <ShoppingCart size={20} className="text-white/10" />
                            </div>
                            <p className="mt-3 text-sm font-medium text-white/20">Carrito vacío</p>
                            <p className="text-xs text-white/10">Agrega productos del catálogo</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {carrito.map((item, idx) => (
                              <div
                                key={item.linea_id}
                                className="rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-white/10"
                              >
                                <div className="flex gap-3">
                                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/20">
                                    {item.imagen_url ? (
                                      <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <ImageOff size={16} className="text-white/10" />
                                      </div>
                                    )}
                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[9px] font-black text-white backdrop-blur-sm">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="truncate text-sm font-bold text-white/80">{item.nombre}</p>
                                      <button
                                        onClick={() => quitarDelCarrito(item.linea_id)}
                                        className="shrink-0 text-white/15 transition hover:text-rose-400"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                    <p className="font-mono text-xs font-bold text-white/30">
                                      ₡{formatearPrecio(item.precio)} c/u
                                    </p>
                                    {/* Aquí iría renderExtrasYObservaciones pero lo omitimos por brevedad */}
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                                  <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-black/20 p-0.5">
                                    <button
                                      onClick={() => cambiarCantidad(item.linea_id, -1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-white/70">
                                      {item.cantidad}
                                    </span>
                                    <button
                                      onClick={() => cambiarCantidad(item.linea_id, 1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F5A300]/10 text-[#F5A300] transition hover:bg-[#F5A300] hover:text-black"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                  <span className="font-mono text-sm font-bold text-white/60">
                                    ₡{formatearPrecio(item.precio * item.cantidad)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-white/5 bg-black/10 p-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/15">Modalidad</p>
                          <div className="flex rounded-lg border border-white/5 bg-black/20 p-0.5">
                            {MODALIDADES.map((m) => (
                              <button
                                key={m.value}
                                onClick={() => setModalidad(m.value)}
                                className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition ${modalidad === m.value ? 'bg-[#F5A300] text-black' : 'text-white/30 hover:text-white/60'
                                  }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-end justify-end">
                          <span className="text-[9px] text-white/20">El pago se selecciona al cobrar</span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 rounded-xl bg-white/5 px-3 py-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/20">Subtotal</span>
                          <span className="font-mono font-bold text-white/40">₡{formatearPrecio(subtotal)}</span>
                        </div>
                        {modalidad === 'retiro' && (
                          <div className="flex justify-between text-xs">
                            <span className="text-white/20">Empaque</span>
                            <span className="font-mono font-bold text-[#F5A300]">
                              + ₡{formatearPrecio(costoEmpaque)}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-white/5 pt-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white/40">Total</span>
                            <span className="font-mono text-lg font-black text-white">
                              ₡{formatearPrecio(total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={crearPedido}
                        disabled={carrito.length === 0 || enviando || !estadoHorario.abierta || !clienteSeleccionado}
                        className="btn-glow mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A300] py-3 text-sm font-black text-black transition hover:bg-[#ffb72b] disabled:opacity-40"
                      >
                        {enviando
                          ? 'Procesando...'
                          : !estadoHorario.abierta
                            ? 'Pedidos cerrados'
                            : 'Crear pedido'}
                        <ShoppingCart size={15} />
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )}

            {/* =====================================================
                SECCIÓN: PEDIDOS - PEDIDOS WEB
            ====================================================== */}
            {seccionActiva === 'pedidos' && (
              <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight text-white">
                        Pedidos listos para cobrar
                      </h2>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Automático
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-white/20">
                      La lista se sincroniza sola cada 4 segundos.
                      {ultimaActualizacionPedidos && (
                        <>
                          {' '}Última revisión:{' '}
                          {ultimaActualizacionPedidos.toLocaleTimeString(
                            'es-CR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            }
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/30">
                      {pedidosWeb.length}{' '}
                      {pedidosWeb.length === 1
                        ? 'pedido'
                        : 'pedidos'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        cargarPedidosWeb({
                          silencioso: false,
                        })
                      }
                      disabled={cargandoPedidosWeb}
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:opacity-50"
                    >
                      <RefreshCw
                        size={16}
                        className={
                          cargandoPedidosWeb
                            ? 'animate-spin'
                            : ''
                        }
                      />
                      Actualizar ahora
                    </button>
                  </div>
                </div>

                {cargandoPedidosWeb ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/5 border-t-[#F5A300]" />
                      <p className="mt-4 text-xs font-medium text-white/35">Cargando pedidos...</p>
                    </div>
                  </div>
                ) : pedidosWeb.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <Package className="mx-auto h-12 w-12 text-white/10" />
                    <h3 className="mt-4 text-lg font-bold text-white">No hay pedidos pendientes</h3>
                    <p className="mt-1 text-sm text-white/30">Los pedidos de Web y del punto de venta aparecerán aquí automáticamente cuando Cocina los marque como LISTO.</p>
                    <p className="mt-2 text-xs text-white/20">
                      Asegúrate de que los pedidos estén en estado <span className="text-emerald-300">"LISTO"</span> en cocina.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {pedidosWeb.map((pedido) => (
                      <div
                        key={pedido.id}
                        className="glass-card overflow-hidden rounded-2xl transition hover:border-[#F5A300]/20"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 p-4">
                          <div>
                            <p className="font-mono text-sm font-bold text-white">
                              #{pedido.codigo_tracking}
                            </p>
                            <p className="text-xs text-white/30">
                              {formatearFechaHora(pedido.created_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${pedido.listo_para_cobrar
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-amber-400/10 text-amber-300'
                              }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${pedido.listo_para_cobrar ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            {pedido.listo_para_cobrar ? 'LISTO' : pedido.estado_pedido.toUpperCase()}
                          </span>
                        </div>

                        <div className="p-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-white/30" />
                            <span className="text-sm font-medium text-white/70">
                              {pedido.cliente?.nombre || 'Cliente'}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
                            <span>
                              {pedido.modalidad_entrega === 'consumo_local' ? '🏠 Local' : '📦 Retiro'}
                            </span>
                          </div>

                          <div className="mt-3 max-h-[100px] overflow-y-auto space-y-1 custom-pos-scrollbar">
                            {pedido.detalles?.slice(0, 3).map((detalle) => (
                              <div key={detalle.id} className="flex justify-between text-[11px] text-white/50">
                                <span>
                                  {detalle.cantidad}x {detalle.producto_nombre}
                                </span>
                                <span>₡{formatearPrecio(detalle.subtotal)}</span>
                              </div>
                            ))}
                            {pedido.detalles?.length > 3 && (
                              <div className="text-[10px] text-white/20">
                                +{pedido.detalles.length - 3} más
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-sm font-bold text-white/40">Total</span>
                            <span className="font-mono text-lg font-black text-[#F5A300]">
                              ₡{formatearPrecio(pedido.total)}
                            </span>
                          </div>

                          {pedido.listo_para_cobrar ? (
                            <button
                              type="button"
                              onClick={() => abrirModalCobro(pedido)}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5A300] to-[#E4002B] py-2.5 text-sm font-black text-white transition hover:scale-[1.02]"
                            >
                              💰 Cobrar pedido
                            </button>
                          ) : (
                            <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/30">
                              <Clock size={14} />
                              Esperando cocina...
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================
                SECCIÓN: CAJA
            ====================================================== */}
            {seccionActiva === 'caja' && (
              <div className="mx-auto max-w-5xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Control de caja</h2>
                  <p className="text-sm text-white/20">Resumen del turno y movimientos de efectivo</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Fondo inicial', value: estadoCaja.resumen?.monto_inicial, color: 'text-white' },
                    { label: 'Ventas en efectivo', value: estadoCaja.resumen?.efectivo, color: 'text-emerald-300' },
                    { label: 'Entradas', value: estadoCaja.resumen?.entradas_efectivo, color: 'text-emerald-300', prefix: '+' },
                    { label: 'Salidas', value: estadoCaja.resumen?.salidas_efectivo, color: 'text-rose-300', prefix: '-' },
                  ].map((item) => (
                    <div key={item.label} className="glass-card rounded-2xl p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">{item.label}</p>
                      <p className={`mt-1 font-mono text-xl font-black ${item.color}`}>
                        {item.prefix || ''} ₡{formatearPrecio(item.value)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-1">
                  <div className="glass-card flex flex-col rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5A300]/10 text-[#F5A300]">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Movimiento de caja</h3>
                        <p className="text-sm text-white/20">Registra entradas o salidas de efectivo manuales.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarMovimientoCaja(true)}
                        className="ml-auto flex items-center justify-center gap-2 rounded-xl bg-[#F5A300] px-6 py-3 text-sm font-black text-black transition hover:bg-[#ffb72b]"
                      >
                        <Plus size={15} /> Registrar movimiento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* =====================================================
            MODAL DE COBRO
        ====================================================== */}
        {mostrarModalCobro && pedidoACobrar && (
          <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center">
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/5 bg-[#0f0d0b] shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5A300]/50">
                      Cobrar pedido
                    </p>
                    <h2 className="text-xl font-black text-white">
                      Cobrar pedido #{pedidoACobrar.codigo_tracking}
                    </h2>
                  </div>
                  <button
                    onClick={cerrarModalCobro}
                    disabled={cobrando}
                    className="text-white/20 transition hover:text-white disabled:opacity-40"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-4 grid gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Cliente</span>
                      <span className="font-bold text-white">{pedidoACobrar.cliente?.nombre || 'Cliente'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Modalidad</span>
                      <span className="text-white">
                        {pedidoACobrar.modalidad_entrega === 'consumo_local' ? 'Consumo en local' : 'Para retirar'}
                      </span>
                    </div>
                    <div className="max-h-[120px] overflow-y-auto space-y-1 custom-pos-scrollbar border-t border-white/5 pt-2">
                      {pedidoACobrar.detalles?.map((detalle) => (
                        <div key={detalle.id} className="flex justify-between text-sm text-white/60">
                          <span>
                            {detalle.cantidad}x {detalle.producto_nombre}
                          </span>
                          <span>₡{formatearPrecio(detalle.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-2">
                      <span className="text-sm font-bold text-white/40">Total</span>
                      <span className="font-mono text-xl font-black text-[#F5A300]">
                        ₡{formatearPrecio(pedidoACobrar.total)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/30">
                      ¿Cómo pagará?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {METODOS_PAGO.map((metodo) => {
                        const Icon = metodo.icon
                        return (
                          <button
                            key={metodo.value}
                            type="button"
                            onClick={() => {
                              setMetodoPagoCobro(metodo.value)
                              setErrorCobro('')
                            }}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${metodoPagoCobro === metodo.value
                                ? 'border-[#F5A300] bg-[#F5A300]/10 text-[#F5A300]'
                                : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                              }`}
                          >
                            <Icon size={16} />
                            {metodo.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {metodoPagoCobro === 'efectivo' && (
                    <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-white/30">
                            Total
                          </label>
                          <p className="mt-1 font-mono text-2xl font-black text-white">
                            ₡{formatearPrecio(pedidoACobrar.total)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-white/30">
                            Cliente entrega
                          </label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-[#F5A300]">
                              ₡
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={montoRecibido}
                              onChange={(e) => {
                                setMontoRecibido(e.target.value)
                                setErrorCobro('')
                              }}
                              className="input-modern w-full rounded-xl px-4 pl-8 py-2.5 font-mono text-xl font-black text-white placeholder:text-white/5"
                              placeholder="0"
                              autoFocus
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between rounded-xl bg-black/20 px-4 py-2">
                        <span className="text-sm font-bold text-white/40">Cambio</span>
                        <span className="font-mono text-lg font-black text-emerald-300">
                          ₡{formatearPrecio(calcularCambio())}
                        </span>
                      </div>

                      {errorCobro && (
                        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                          {errorCobro}
                        </div>
                      )}
                    </div>
                  )}

                  {metodoPagoCobro === 'tarjeta' && (
                    <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4 text-center">
                      <CreditCard size={32} className="mx-auto text-white/20" />
                      <p className="mt-2 text-sm font-bold text-white">Total: ₡{formatearPrecio(pedidoACobrar.total)}</p>
                      <p className="mt-1 text-xs text-white/30">
                        Realiza el cobro en el datáfono y confirma cuando la transacción sea aprobada.
                      </p>
                      {errorCobro && (
                        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                          {errorCobro}
                        </div>
                      )}
                    </div>
                  )}

                  {metodoPagoCobro === 'sinpe' && (
                    <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <Smartphone size={24} className="text-[#F5A300]" />
                        <div>
                          <p className="text-sm font-bold text-white">SINPE Móvil</p>
                          <p className="text-xs text-white/30">Monto: ₡{formatearPrecio(pedidoACobrar.total)}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-3">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">Número</p>
                          <p className="font-mono text-sm font-black text-white">{DATOS_SINPE.telefono}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">A nombre de</p>
                          <p className="text-xs font-bold text-white/60">{DATOS_SINPE.nombre}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-xs text-white/30">
                        Confirma únicamente cuando el pago haya sido recibido.
                      </p>
                      {errorCobro && (
                        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                          {errorCobro}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={cerrarModalCobro}
                      disabled={cobrando}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/30 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmarCobro}
                      disabled={cobrando || (metodoPagoCobro === 'efectivo' && Number(montoRecibido) < pedidoACobrar.total)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5A300] to-[#E4002B] px-6 py-3 text-sm font-black text-white transition hover:scale-[1.02] disabled:opacity-40"
                    >
                      {cobrando ? 'Procesando...' : '✅ Confirmar cobro'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MODAL DE MOVIMIENTO
        ====================================================== */}
        {mostrarMovimientoCaja && estadoCaja?.abierta && estadoCaja?.puede_operar && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#0f0d0b] shadow-2xl">
              <form onSubmit={registrarMovimientoCaja}>
                <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Movimiento</p>
                    <h3 className="text-lg font-black text-white">Registrar movimiento</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarMovimientoCaja(false)}
                    className="text-white/20 transition hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
                    {['entrada', 'salida'].map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => {
                          setTipoMovimiento(tipo)
                          setMotivoMovimiento('')
                          setErrorMovimiento('')
                        }}
                        className={`rounded-lg py-2 text-xs font-bold transition ${tipoMovimiento === tipo
                            ? tipo === 'entrada'
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : 'bg-rose-400/10 text-rose-300'
                            : 'text-white/20 hover:text-white/50'
                          }`}
                      >
                        {tipo === 'entrada' ? '+ Entrada' : '− Salida'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/20">Monto</label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-black text-[#F5A300]">
                        ₡
                      </span>
                      <input
                        autoFocus
                        type="number"
                        min="1"
                        step="1"
                        value={montoMovimiento}
                        onChange={(e) => {
                          setMontoMovimiento(e.target.value)
                          setErrorMovimiento('')
                        }}
                        className="input-modern w-full rounded-xl px-4 pl-10 py-3 font-mono text-2xl font-black text-white placeholder:text-white/5"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/20">Motivo</label>
                    <select
                      value={motivoMovimiento}
                      onChange={(e) => {
                        setMotivoMovimiento(e.target.value)
                        setErrorMovimiento('')
                      }}
                      className="input-modern mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white"
                      required
                    >
                      <option value="">Selecciona un motivo</option>
                      {motivosMovimiento.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                        Observaciones
                      </label>
                      <span className="text-[9px] text-white/10">Opcional</span>
                    </div>
                    <textarea
                      rows="2"
                      value={observacionesMovimiento}
                      onChange={(e) => setObservacionesMovimiento(e.target.value)}
                      className="input-modern mt-1.5 w-full resize-none rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/10"
                      placeholder="Detalle adicional..."
                    />
                  </div>
                  {errorMovimiento && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
                      {errorMovimiento}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-white/5 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarMovimientoCaja(false)
                      setMontoMovimiento('')
                      setMotivoMovimiento('')
                      setObservacionesMovimiento('')
                      setErrorMovimiento('')
                    }}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold text-white/20 transition hover:text-white/60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={registrandoMovimiento}
                    className={`rounded-xl px-5 py-2.5 text-xs font-black transition disabled:opacity-40 ${tipoMovimiento === 'entrada'
                        ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                        : 'bg-rose-500 text-white hover:bg-rose-400'
                      }`}
                  >
                    {registrandoMovimiento
                      ? 'Registrando...'
                      : tipoMovimiento === 'entrada'
                        ? 'Registrar entrada'
                        : 'Registrar salida'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
            PERSONALIZADORES
        ====================================================== */}
        {productoPersonalizando && (
          <PersonalizadorPizza
            producto={productoPersonalizando}
            extrasDisponibles={productoPersonalizando.extras_disponibles || []}
            onConfirmar={handleConfirmarPersonalizacion}
            onCancelar={() => setProductoPersonalizando(null)}
          />
        )}
        {productoPastaPersonalizando && (
          <PersonalizadorPasta
            producto={productoPastaPersonalizando}
            opcionesPasta={productoPastaPersonalizando.opciones_pasta || null}
            onConfirmar={handleConfirmarPersonalizacion}
            onCancelar={() => setProductoPastaPersonalizando(null)}
          />
        )}
        {productoAcompanamientosPersonalizando && (
          <PersonalizadorAcompanamientos
            producto={productoAcompanamientosPersonalizando}
            acompanamientosDisponibles={productoAcompanamientosPersonalizando.acompanamientos_disponibles || []}
            onConfirmar={handleConfirmarPersonalizacion}
            onCancelar={() => setProductoAcompanamientosPersonalizando(null)}
          />
        )}
      </div>
    </CajaLayout>
  )
}

export default CajaDashboard