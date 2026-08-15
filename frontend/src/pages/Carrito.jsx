import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  Clock,
  Shield,
  Truck,
  User,
  PackageCheck,
  AlertCircle,
  Clock as ClockIcon,
  Undo2,
  Copy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import fondoPrincipal from '../assets/fondoPrincipal1.png'
import useCarritoStore from '../store/carritoStore'
import useAuthStore from '../store/authStore'
import api from '../api/axios'
import HorarioPedidosBanner from '../components/HorarioPedidosBanner'
import useHorarioPedidos from '../hooks/useHorarioPedidos'
import {
  alertaError,
  alertaExito,
  alertaInfo,
  confirmarEliminacion,
} from '../utils/alertas'

export default function Carrito() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }, [])

  const {
    items,
    eliminarProducto,
    actualizarCantidad,
    limpiarCarrito,
    obtenerTotal,
    obtenerCantidadItems,
  } = useCarritoStore()

  const { user, token } = useAuthStore()

  const [modalidad, setModalidad] = useState('consumo_local')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [pedidoCreado, setPedidoCreado] = useState(null)
  const [codigoCopiado, setCodigoCopiado] = useState(false)
  const [cargandoCliente, setCargandoCliente] = useState(false)

  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [puedeCancelar, setPuedeCancelar] = useState(false)
  const [pedidoEnEspera, setPedidoEnEspera] = useState(null)
  const [mostrarModalEspera, setMostrarModalEspera] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const {
    estado: estadoHorario,
    cargando: cargandoHorario,
    recargar: recargarHorario,
  } = useHorarioPedidos()

  const COSTO_EMPAQUE_RETIRO = 500

  const subtotal = obtenerTotal ? obtenerTotal() : 0
  const costoEmpaque = modalidad === 'retiro' ? COSTO_EMPAQUE_RETIRO : 0
  const total = subtotal + costoEmpaque
  const cantidadItems = obtenerCantidadItems ? obtenerCantidadItems() : 0

  const formatearPrecio = (monto) => {
    return Number(monto || 0).toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  useEffect(() => {
    let componenteActivo = true

    const cargarClienteAutenticado = async () => {
      if (!token || !user) {
        setClienteSeleccionado(null)
        setCargandoCliente(false)
        return
      }

      const rolActual = String(user.rol || '').trim().toLowerCase()

      if (rolActual !== 'cliente') {
        setClienteSeleccionado(null)
        setCargandoCliente(false)
        setMensaje({
          tipo: 'error',
          texto: 'Debes iniciar sesión con una cuenta de cliente para realizar un pedido.',
        })
        return
      }

      setCargandoCliente(true)

      try {
        const response = await api.get('/user')
        if (!componenteActivo) return

        const cliente = response.data?.cliente
        if (cliente) {
          setClienteSeleccionado(cliente)
          setMensaje(null)
        } else {
          setClienteSeleccionado(null)
          setMensaje({
            tipo: 'error',
            texto: 'Tu cuenta no tiene información de cliente asociada.',
          })
        }
      } catch (err) {
        console.error('Error al cargar la información del cliente:', err)
        if (!componenteActivo) return
        setClienteSeleccionado(null)
        setMensaje({
          tipo: 'error',
          texto: err.response?.data?.message || 'No se pudo cargar tu información de cliente.',
        })
      } finally {
        if (componenteActivo) {
          setCargandoCliente(false)
        }
      }
    }

    cargarClienteAutenticado()

    return () => {
      componenteActivo = false
    }
  }, [token, user])

  useEffect(() => {
    if (tiempoRestante > 0 && puedeCancelar) {
      const timer = setTimeout(() => {
        setTiempoRestante((tiempoActual) => tiempoActual - 1)
      }, 1000)

      return () => {
        clearTimeout(timer)
      }
    }

    if (tiempoRestante === 0 && puedeCancelar) {
      confirmarPedidoFinal()
    }
  }, [tiempoRestante, puedeCancelar])

  const obtenerNombreOpcion = (opcion) => {
    if (typeof opcion === 'string') {
      return opcion.trim()
    }
    return String(opcion?.nombre || '').trim()
  }

  const obtenerNombresOpciones = (opciones) => {
    if (!Array.isArray(opciones)) {
      return []
    }
    return opciones.map(obtenerNombreOpcion).filter(Boolean)
  }

  const renderExtrasYObservaciones = (item) => {
    const detalles = []

    const personalizacion =
      item.personalizacion &&
      typeof item.personalizacion === 'object' &&
      !Array.isArray(item.personalizacion)
        ? item.personalizacion
        : null

    const tamanoPizza = String(item.tamano_pizza || personalizacion?.tamano_pizza || '')
      .trim()
      .toLowerCase()

    if (tamanoPizza === 'grande' || tamanoPizza === 'personal') {
      detalles.push(`🍕 Tamaño: ${tamanoPizza === 'personal' ? 'Personal' : 'Grande'}`)
    }

    if (item.extras) {
      detalles.push(`➕ Extras: ${item.extras}`)
    }

    if (personalizacion?.tipo === 'pasta') {
      const tipoPasta = obtenerNombreOpcion(personalizacion.tipo_pasta)
      const proteinas = obtenerNombresOpciones(personalizacion.proteinas)
      const salsa = obtenerNombreOpcion(personalizacion.salsa)
      const ingredientes = obtenerNombresOpciones(personalizacion.ingredientes)

      if (tipoPasta) {
        detalles.push(`🍝 Pasta: ${tipoPasta}`)
      }
      detalles.push(`🥩 Proteínas: ${proteinas.length > 0 ? proteinas.join(', ') : 'Sin proteína'}`)
      detalles.push(`🥣 Salsa: ${salsa || 'Sin salsa'}`)
      detalles.push(`🧄 Ingredientes: ${ingredientes.length > 0 ? ingredientes.join(', ') : 'Sin adicionales'}`)
    }

    if (personalizacion?.tipo === 'acompanamientos') {
      const acompanamientos = Array.isArray(personalizacion.acompanamientos)
        ? personalizacion.acompanamientos
        : []

      const incluidos = acompanamientos
        .filter((acompanamiento) => acompanamiento?.incluido !== false)
        .map(obtenerNombreOpcion)
        .filter(Boolean)

      const adicionales = acompanamientos
        .filter((acompanamiento) => acompanamiento?.incluido === false)
        .map((acompanamiento) => {
          const nombre = obtenerNombreOpcion(acompanamiento)
          const precio = Number(
            acompanamiento?.precio_aplicado ?? acompanamiento?.precio_extra ?? 0
          )
          if (!nombre) return ''
          return precio > 0 ? `${nombre} (+₡${formatearPrecio(precio)})` : nombre
        })
        .filter(Boolean)

      detalles.push(`🥗 Incluidos: ${incluidos.length > 0 ? incluidos.join(', ') : 'Ninguno'}`)
      if (adicionales.length > 0) {
        detalles.push(`➕ Adicionales: ${adicionales.join(', ')}`)
      }
    }

    if (item.observaciones) {
      detalles.push(`📝 ${item.observaciones}`)
    }

    if (detalles.length === 0) {
      return null
    }

    return (
      <div className="mt-1 space-y-0.5 text-[10px] text-white/50">
        {detalles.map((detalle, indice) => (
          <p key={`${indice}-${detalle}`} className="truncate" title={detalle}>
            {detalle}
          </p>
        ))}
      </div>
    )
  }

  const tieneExtras = (item) => {
    const tienePasta = item.pasta && typeof item.pasta === 'object'
    const tieneAcompanamientos = Array.isArray(item.acompanamientos_ids) && item.acompanamientos_ids.length > 0
    const tieneTamanoPizza = item.tamano_pizza === 'grande' || item.tamano_pizza === 'personal'

    return Boolean(
      item.extras ||
        item.observaciones ||
        tienePasta ||
        tieneAcompanamientos ||
        tieneTamanoPizza ||
        item.personalizacion
    )
  }

  const estaAutenticado = () => {
    return Boolean(user && token)
  }

  const rolUsuario = String(user?.rol || '').trim().toLowerCase()
  const esClienteAutenticado = estaAutenticado() && rolUsuario === 'cliente'

  const crearPedidoConEspera = async () => {
    const estadoActual = await recargarHorario({ silencioso: true })

    if (!estadoActual.abierta) {
      setMensaje({
        tipo: 'error',
        texto: estadoActual.mensaje,
      })
      return
    }

    if (!estaAutenticado()) {
      setMensaje({
        tipo: 'error',
        texto: 'Debes iniciar sesión para hacer un pedido.',
      })
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      return
    }

    if (!esClienteAutenticado) {
      setMensaje({
        tipo: 'error',
        texto: 'Debes iniciar sesión con una cuenta de cliente para realizar un pedido.',
      })
      return
    }

    if (items.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Tu carrito está vacío.',
      })
      return
    }

    if (!clienteSeleccionado) {
      setMensaje({
        tipo: 'error',
        texto: 'No se encontró tu información de cliente.',
      })
      return
    }

    setMostrarModalEspera(true)
    setTiempoRestante(10)
    setPuedeCancelar(true)
    setMensaje(null)

    setPedidoEnEspera({
      items: [...items],
      cliente: clienteSeleccionado,
      modalidad,
    })
  }

  const cancelarPedido = () => {
    setPuedeCancelar(false)
    setTiempoRestante(0)
    setMostrarModalEspera(false)
    setPedidoEnEspera(null)
    setMensaje(null)

    alertaInfo(
      'Puedes modificar tu carrito y volver a confirmar cuando estés listo.',
      'Pedido cancelado'
    )
  }

  const confirmarPedidoFinal = async () => {
    if (!pedidoEnEspera) {
      return
    }

    const estadoActual = await recargarHorario({ silencioso: true })

    if (!estadoActual.abierta) {
      setPuedeCancelar(false)
      setTiempoRestante(0)
      setMostrarModalEspera(false)
      setPedidoEnEspera(null)
      setMensaje(null)

      alertaError(
        estadoActual.mensaje,
        estadoActual.titulo || 'Pedidos cerrados'
      )
      return
    }

    setPuedeCancelar(false)
    setEnviando(true)

    try {
      const formData = new FormData()

      formData.append('cliente_id', pedidoEnEspera.cliente.id)
      formData.append('modalidad_entrega', pedidoEnEspera.modalidad)

      const productosPayload = pedidoEnEspera.items.map((item) => {
        const pasta =
          item.pasta &&
          typeof item.pasta === 'object' &&
          !Array.isArray(item.pasta)
            ? {
                tipo_pasta_id: item.pasta.tipo_pasta_id ?? null,
                proteina_ids: Array.isArray(item.pasta.proteina_ids) ? item.pasta.proteina_ids : [],
                salsa_id: item.pasta.salsa_id ?? null,
                ingrediente_ids: Array.isArray(item.pasta.ingrediente_ids) ? item.pasta.ingrediente_ids : [],
              }
            : null

        return {
          producto_id: item.producto_id ?? item.id,
          cantidad: Number(item.cantidad) || 1,
          tamano_pizza:
            item.tamano_pizza === 'personal'
              ? 'personal'
              : item.tamano_pizza === 'grande'
              ? 'grande'
              : null,
          extras: item.extras || null,
          extras_ids: Array.isArray(item.extras_ids) ? item.extras_ids : [],
          pasta,
          acompanamientos_ids: Array.isArray(item.acompanamientos_ids) ? item.acompanamientos_ids : [],
          observaciones: item.observaciones || null,
          alergias: item.alergias || null,
        }
      })

      formData.append('productos', JSON.stringify(productosPayload))

      const response = await api.post('/pedidos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setCodigoCopiado(false)
      setMostrarModalEspera(false)
      setPedidoEnEspera(null)
      setMensaje(null)

      await alertaExito(
        'Tu pedido fue enviado correctamente.',
        'Pedido creado'
      )

      setPedidoCreado(response.data.pedido)
    } catch (err) {
      console.error('Error al crear el pedido:', err)

      setMostrarModalEspera(false)

      const erroresValidacion = err.response?.data?.errors
      const primerError =
        erroresValidacion && typeof erroresValidacion === 'object'
          ? Object.values(erroresValidacion).flat().find(Boolean)
          : null

      const mensajeError =
        primerError ||
        err.response?.data?.message ||
        'No se pudo crear el pedido.'

      setMensaje(null)

      alertaError(
        mensajeError,
        'No se pudo crear el pedido'
      )
    } finally {
      setEnviando(false)
    }
  }

  const obtenerIdentificadorLinea = (item) => {
    return item.linea_id ?? item.id
  }

  const handleCantidad = (identificadorLinea, delta) => {
    const item = items.find(
      (producto) => obtenerIdentificadorLinea(producto) === identificadorLinea
    )

    if (!item) {
      return
    }

    const nuevaCantidad = Number(item.cantidad) + delta

    if (nuevaCantidad <= 0) {
      eliminarProducto(identificadorLinea)
      return
    }

    actualizarCantidad(identificadorLinea, nuevaCantidad)
  }

  const confirmarVaciarCarrito = async () => {
    const confirmado = await confirmarEliminacion({
      titulo: '¿Vaciar el carrito?',
      mensaje: 'Se eliminarán todos los productos y personalizaciones agregadas.',
      textoConfirmar: 'Sí, vaciar',
    })

    if (!confirmado) {
      return
    }

    limpiarCarrito()
    setMensaje(null)

    alertaInfo(
      'Todos los productos fueron eliminados.',
      'Carrito vacío'
    )
  }

  const confirmarEliminarProducto = async (item) => {
    const confirmado = await confirmarEliminacion({
      titulo: '¿Eliminar producto?',
      mensaje: `Se eliminará ${item.nombre} del carrito.`,
      textoConfirmar: 'Sí, eliminar',
    })

    if (!confirmado) {
      return
    }

    eliminarProducto(obtenerIdentificadorLinea(item))

    alertaInfo(
      `${item.nombre} fue eliminado del carrito.`,
      'Producto eliminado'
    )
  }

  const modalidadTexto = () => {
    if (modalidad === 'retiro') {
      return 'Para retirar'
    }
    return 'Consumo en local'
  }

  const copiarCodigo = async () => {
    if (!pedidoCreado?.codigo_tracking) {
      return
    }

    try {
      await navigator.clipboard.writeText(pedidoCreado.codigo_tracking)
      setCodigoCopiado(true)

      alertaExito(
        'El número de pedido se copió al portapapeles.',
        'Código copiado'
      )

      setTimeout(() => {
        setCodigoCopiado(false)
      }, 2000)
    } catch (err) {
      console.error('No se pudo copiar el código:', err)

      alertaError(
        'No fue posible copiar el número de pedido. Puedes seleccionarlo y copiarlo manualmente.',
        'No se pudo copiar'
      )
    }
  }

  const limpiarDespuesDePedido = () => {
    limpiarCarrito()
    setMensaje(null)
    setPedidoCreado(null)
  }

  const verSeguimiento = () => {
    const codigo = pedidoCreado?.codigo_tracking
    limpiarDespuesDePedido()
    navigate('/estado-pedido', {
      state: {
        codigo,
      },
    })
  }

  const autenticado = estaAutenticado()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120C08] text-white">
      <section
        className="relative flex min-h-screen items-start overflow-hidden bg-cover bg-center px-3 py-10 pt-20 sm:px-4 sm:py-12 sm:pt-24 lg:px-6 lg:py-16 lg:pt-28"
        style={{
          backgroundImage: `url(${fondoPrincipal})`,
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/85 via-black/80 to-[#120C08]/95" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#E4002B]/40 bg-[#E4002B]/20 px-4 py-2 backdrop-blur-sm">
              <ShoppingCart className="h-4 w-4 text-[#F5A300]" />
              <span className="text-sm font-semibold text-[#F5A300]">
                Tu pedido
              </span>
            </div>

            <h1 className="text-4xl font-black leading-tight lg:text-6xl">
              <span className="text-white">Tu</span>
              <span className="block bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-[#F5A300] bg-clip-text text-transparent">
                Carrito
              </span>
            </h1>

            <p className="mt-3 font-semibold text-white">
              Revisa tu pedido y confirma la orden.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/50 p-12 text-center backdrop-blur-sm">
                  <h3 className="mb-2 text-2xl font-bold text-white">
                    Tu carrito está vacío
                  </h3>

                  <p className="mb-6 text-white/60">
                    Parece que aún no has agregado nada a tu pedido.
                  </p>

                  <Link
                    to="/menu"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-6 py-3 font-bold"
                  >
                    Explorar menú
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                      Tu pedido ({cantidadItems} productos)
                    </h3>

                    <button
                      type="button"
                      onClick={confirmarVaciarCarrito}
                      className="flex items-center gap-1 text-sm text-white/40 hover:text-[#E4002B]"
                    >
                      <Trash2 size={14} />
                      Vaciar carrito
                    </button>
                  </div>

                  {items.map((item) => (
                    <div
                      key={obtenerIdentificadorLinea(item)}
                      className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-2xl border border-white/10 bg-black/50 p-3 backdrop-blur-sm sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-x-4 sm:p-4"
                    >
                      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-black/50 sm:h-20 sm:w-20">
                        {item.imagen_url ? (
                          <img
                            src={item.imagen_url}
                            alt={item.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl text-white/20">
                            {item.nombre.toLowerCase().includes('pizza') ? '🍕' : '🍽️'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 self-start sm:self-center">
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                          <h4 className="line-clamp-2 text-sm font-bold leading-tight text-white sm:text-base">
                            {item.nombre}
                          </h4>

                          {tieneExtras(item) && (
                            <span className="shrink-0 rounded-full bg-[#F5A300]/20 px-1.5 py-0.5 text-[8px] text-[#F5A300]">
                              Personalizado
                            </span>
                          )}
                        </div>

                        <p className="mt-1 whitespace-nowrap font-mono text-sm font-bold text-[#F5A300]">
                          ₡{formatearPrecio(item.precio)} c/u
                        </p>

                        {renderExtrasYObservaciones(item)}
                      </div>

                      <div className="col-span-2 flex w-full items-center justify-between gap-3 border-t border-white/10 pt-3 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:border-0 sm:pt-0">
                        <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          <button
                            type="button"
                            onClick={() =>
                              handleCantidad(
                                obtenerIdentificadorLinea(item),
                                -1
                              )
                            }
                            aria-label={`Disminuir cantidad de ${item.nombre}`}
                            className="flex h-9 w-9 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-[#F5A300]"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="w-8 select-none text-center text-sm font-bold text-white">
                            {item.cantidad}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCantidad(
                                obtenerIdentificadorLinea(item),
                                1
                              )
                            }
                            aria-label={`Aumentar cantidad de ${item.nombre}`}
                            className="flex h-9 w-9 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-[#F5A300]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="ml-auto whitespace-nowrap font-mono text-sm font-bold text-white sm:min-w-[82px] sm:text-right">
                          ₡{formatearPrecio(item.precio * item.cantidad)}
                        </p>

                        <button
                          type="button"
                          onClick={() => confirmarEliminarProducto(item)}
                          aria-label={`Eliminar ${item.nombre}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-[#E4002B]/15 hover:text-[#E4002B]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <Sparkles size={18} className="text-[#F5A300]" />
                  Resumen del pedido
                </h3>

                {items.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/60">
                        Cliente
                      </label>

                      {!autenticado ? (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                          <p className="text-sm font-medium text-red-400">
                            Debes iniciar sesión para hacer un pedido
                          </p>

                          <Link
                            to="/login"
                            className="mt-2 inline-block rounded-lg bg-gradient-to-r from-[#E80000] to-[#FF6B00] px-4 py-2 text-sm font-bold text-white"
                          >
                            Iniciar sesión
                          </Link>
                        </div>
                      ) : !esClienteAutenticado ? (
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
                          <p className="text-sm text-yellow-400">
                            Debes usar una cuenta de cliente.
                          </p>
                        </div>
                      ) : cargandoCliente ? (
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
                          <p className="text-sm text-yellow-400">
                            Cargando tu información...
                          </p>
                        </div>
                      ) : clienteSeleccionado ? (
                        <div className="rounded-xl border border-[#F5A300]/30 bg-[#F5A300]/10 p-3">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-[#F5A300]" />
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {clienteSeleccionado.nombre}
                              </p>
                              <p className="text-xs text-white/40">
                                {clienteSeleccionado.telefono || 'Sin teléfono'} •{' '}
                                {clienteSeleccionado.correo}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
                          <p className="text-sm text-yellow-400">
                            No se encontró tu información
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 max-h-[160px] space-y-2 overflow-y-auto pr-1">
                      {items.map((item) => (
                        <div
                          key={obtenerIdentificadorLinea(item)}
                          className="flex justify-between text-sm"
                        >
                          <span className="mr-2 truncate text-white/70">
                            {item.cantidad}x {item.nombre}
                            {item.tamano_pizza && (
                              <> — {item.tamano_pizza === 'personal' ? 'Personal' : 'Grande'}</>
                            )}
                            {tieneExtras(item) && ' ✨'}
                          </span>

                          <span className="font-medium text-white">
                            ₡{formatearPrecio(item.precio * item.cantidad)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4 border-t border-white/10 pt-4">
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-white/60">Subtotal</span>
                        <span className="text-sm font-medium text-white">
                          ₡{formatearPrecio(subtotal)}
                        </span>
                      </div>

                      {modalidad === 'retiro' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-white/60">Empaque para retiro</span>
                          <span className="text-sm font-medium text-[#F5A300]">
                            ₡{formatearPrecio(costoEmpaque)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 border-t border-white/10 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="font-mono text-xl font-black text-[#F5A300]">
                          ₡{formatearPrecio(total)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/60">
                        Modalidad de entrega
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setModalidad('consumo_local')}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold ${
                            modalidad === 'consumo_local'
                              ? 'border-[#F5A300] bg-[#F5A300]/10 text-[#F5A300]'
                              : 'border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          <Clock size={14} />
                          Local
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalidad('retiro')}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold ${
                            modalidad === 'retiro'
                              ? 'border-[#F5A300] bg-[#F5A300]/10 text-[#F5A300]'
                              : 'border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          <Truck size={14} />
                          Retiro
                        </button>
                      </div>
                    </div>

                    <HorarioPedidosBanner
                      estado={estadoHorario}
                      cargando={cargandoHorario}
                      compacto
                      className="mb-4"
                    />

                    {mensaje && (
                      <div
                        className={`mb-3 rounded-lg border px-3 py-2 text-sm font-medium ${
                          mensaje.tipo === 'exito'
                            ? 'border-[#C9E0B0] bg-[#EAF3DE] text-[#3B6D11]'
                            : mensaje.tipo === 'info'
                            ? 'border-[#B0C4DE] bg-[#E8EEF7] text-[#3D5B8C]'
                            : 'border-[#F09595] bg-[#FCEBEB] text-[#A32D2D]'
                        }`}
                      >
                        {mensaje.texto}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={crearPedidoConEspera}
                      disabled={
                        enviando ||
                        cargandoHorario ||
                        !estadoHorario.abierta ||
                        !esClienteAutenticado ||
                        !clienteSeleccionado ||
                        items.length === 0
                      }
                      className="flex w-full transform items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] py-3 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#E4002B]/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {enviando
                        ? '⏳ Enviando...'
                        : cargandoHorario
                        ? 'Verificando horario...'
                        : !estadoHorario.abierta
                        ? 'Pedidos cerrados'
                        : !autenticado
                        ? 'Inicia sesión para pedir'
                        : !esClienteAutenticado
                        ? 'Usa una cuenta de cliente'
                        : (
                          <>
                            <ClockIcon size={18} />
                            Confirmar pedido (10s)
                          </>
                        )}
                    </button>

                    {!autenticado && (
                      <p className="mt-2 text-center text-xs text-[#E4002B]">
                        Debes iniciar sesión para hacer un pedido.
                      </p>
                    )}

                    {autenticado && !esClienteAutenticado && (
                      <p className="mt-2 text-center text-xs text-yellow-400">
                        Debes usar una cuenta con rol cliente para realizar pedidos.
                      </p>
                    )}

                    {esClienteAutenticado && !clienteSeleccionado && !cargandoCliente && (
                      <p className="mt-2 text-center text-xs text-yellow-400">
                        No se encontró tu información de cliente.
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-white/30">
                      <Shield size={12} />
                      <span>Pedido seguro</span>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-white/50">
                      No hay productos en tu carrito.
                    </p>

                    <Link
                      to="/menu"
                      className="mt-4 inline-block text-sm text-[#F5A300] hover:underline"
                    >
                      Ir al menú
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {mostrarModalEspera && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#F5A300]/30 bg-[#160F0B] shadow-2xl">
            <div className="h-[4px] bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

            <div className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F5A300]/20">
                  <ClockIcon className="h-10 w-10 animate-pulse text-[#F5A300]" />
                </div>
              </div>

              <h2 className="mb-2 text-2xl font-black text-white">
                ⏳ Confirmando pedido...
              </h2>

              <p className="mb-4 text-sm text-white/60">
                Tienes{' '}
                <span className="text-xl font-bold text-[#F5A300]">
                  {tiempoRestante}
                </span>{' '}
                segundos para cancelar si deseas hacer algún cambio.
              </p>

              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#F5A300] to-[#E4002B] transition-all duration-1000"
                  style={{
                    width: `${(tiempoRestante / 10) * 100}%`,
                  }}
                />
              </div>

              <div className="mb-4 flex items-center justify-center gap-2 text-xs text-white/40">
                <AlertCircle size={14} />
                <span>El pedido se confirmará automáticamente</span>
              </div>

              <button
                type="button"
                onClick={cancelarPedido}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E4002B] py-3 font-bold text-white transition-colors hover:bg-[#A32D2D]"
              >
                <Undo2 size={18} />
                Cancelar pedido
              </button>

              <p className="mt-3 text-[10px] text-white/30">
                Puedes modificar tu carrito y volver a confirmar
              </p>
            </div>
          </div>
        </div>
      )}

      {pedidoCreado && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#F5A300]/30 bg-[#160F0B] shadow-2xl">
            <div className="h-[4px] bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

            <div className="p-5 sm:p-6">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3DE] shadow-lg">
                  <PackageCheck className="h-8 w-8 text-[#3B6D11]" />
                </div>
              </div>

              <h2 className="mb-2 text-center text-2xl font-black text-white sm:text-3xl">
                ¡Pedido realizado! 🎉
              </h2>

              <p className="mb-5 text-center text-sm text-white/60">
                Guarda este código para consultar el estado de tu pedido.
              </p>

              <div className="mb-4 rounded-2xl border border-[#F5A300]/40 bg-black/40 p-4 text-center">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/45">
                  Tu número de pedido es
                </p>

                <p className="font-mono text-3xl font-black tracking-wide text-[#F5A300] sm:text-4xl">
                  {pedidoCreado.codigo_tracking}
                </p>
              </div>

              <div className="mb-4 space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-bold text-white/45">Cliente</span>
                  <span className="text-right text-white">
                    {pedidoCreado.cliente?.nombre || clienteSeleccionado?.nombre}
                  </span>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-bold text-white/45">Modalidad</span>
                  <span className="text-right text-white">{modalidadTexto()}</span>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-bold text-white/45">Estado</span>
                  <span className="text-right font-bold text-[#F5A300]">Pendiente</span>
                </div>

                {Number(pedidoCreado.costo_empaque || 0) > 0 && (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-bold text-white/45">Empaque para retiro</span>
                    <span className="font-mono text-right text-white">
                      ₡{formatearPrecio(pedidoCreado.costo_empaque)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-3 border-t border-white/10 pt-2.5">
                  <span className="font-bold text-white/45">Total</span>
                  <span className="font-mono font-black text-[#F5A300]">
                    ₡{formatearPrecio(pedidoCreado.total)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 font-bold text-white transition-colors hover:bg-white/15"
                >
                  <Copy size={17} />
                  {codigoCopiado ? '✅ Código copiado' : '📋 Copiar número'}
                </button>

                <button
                  type="button"
                  onClick={verSeguimiento}
                  className="w-full rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] py-3 font-black text-white transition-all hover:scale-[1.01]"
                >
                  📦 Ver seguimiento
                </button>

                <button
                  type="button"
                  onClick={limpiarDespuesDePedido}
                  className="w-full py-2 text-sm text-white/45 hover:text-white"
                >
                  Cerrar y seguir comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}