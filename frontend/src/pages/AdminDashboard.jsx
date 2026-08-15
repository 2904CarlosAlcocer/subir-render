import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import AdminHome from '../components/admin/AdminHome'
import AdminDashboardHomeLayout from '../components/admin/AdminDashboardHomeLayout'
import AdminCajaPanel from '../components/admin/AdminCajaPanel'
import useAuthStore from '../store/authStore'
import {
  Coffee,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Pizza,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
  Utensils,
  X,
} from 'lucide-react'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'caja', label: 'Caja' },
]

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

const COLOR_ESTADO = {
  pendiente: 'bg-amber-50/10 text-amber-400 ring-amber-400/20',
  confirmado: 'bg-blue-50/10 text-blue-400 ring-blue-400/20',
  en_preparacion: 'bg-orange-50/10 text-orange-400 ring-orange-400/20',
  listo: 'bg-emerald-50/10 text-emerald-400 ring-emerald-400/20',
  entregado: 'bg-gray-50/10 text-gray-400 ring-gray-400/20',
}

const ETIQUETA_GRUPO_PASTA = {
  tipo_pasta: 'Tipos de pasta',
  proteina: 'Proteínas',
  salsa: 'Salsas',
  ingrediente: 'Ingredientes adicionales',
}

const ORDEN_GRUPOS_PASTA = ['tipo_pasta', 'proteina', 'salsa', 'ingrediente']

// ============================================================
// FUNCIÓN DE UTILIDAD
// ============================================================

const normalizarTexto = (valor) => {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/#/g, '')
    .toLowerCase()
    .trim()
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

function AdminDashboard() {
  const navigate = useNavigate()
  const [vistaAdmin, setVistaAdmin] = useState('dashboard')
  const { user, isAuthenticated } = useAuthStore()

  // Estados de Personal
  const [usuarios, setUsuarios] = useState([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [errorLista, setErrorLista] = useState('')

  // Estados de Pedidos
  const [pedidos, setPedidos] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [vistaOrdenes, setVistaOrdenes] = useState('activas')

  // Estados del Modal
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [rol, setRol] = useState('cocina')
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Estados de Comprobantes
  const [comprobantes, setComprobantes] = useState([])
  const [cargandoComprobantes, setCargandoComprobantes] = useState(false)
  const [filtroComprobantes, setFiltroComprobantes] = useState('todos')
  const [busquedaComprobantes, setBusquedaComprobantes] = useState('')

  // Estados de Ingredientes
  const [ingredientes, setIngredientes] = useState([])
  const [preciosIngredientes, setPreciosIngredientes] = useState({})
  const [cargandoIngredientes, setCargandoIngredientes] = useState(false)
  const [guardandoIngredienteId, setGuardandoIngredienteId] = useState(null)
  const [errorIngredientes, setErrorIngredientes] = useState('')
  const [mensajeIngredientes, setMensajeIngredientes] = useState('')

  // Estados para crear ingrediente extra
  const [mostrarModalIngrediente, setMostrarModalIngrediente] = useState(false)
  const [ingredienteEditando, setIngredienteEditando] = useState(null)
  const [nuevoIngredienteNombre, setNuevoIngredienteNombre] = useState('')
  const [nuevoIngredientePrecio, setNuevoIngredientePrecio] = useState('')
  const [nuevoIngredienteEstado, setNuevoIngredienteEstado] = useState('disponible')
  const [creandoIngrediente, setCreandoIngrediente] = useState(false)
  const [errorNuevoIngrediente, setErrorNuevoIngrediente] = useState('')

  // Estados de Opciones de Pasta
  const [opcionesPasta, setOpcionesPasta] = useState([])
  const [preciosOpcionesPasta, setPreciosOpcionesPasta] = useState({})
  const [cargandoOpcionesPasta, setCargandoOpcionesPasta] = useState(false)
  const [guardandoOpcionPastaId, setGuardandoOpcionPastaId] = useState(null)
  const [errorOpcionesPasta, setErrorOpcionesPasta] = useState('')
  const [mensajeOpcionesPasta, setMensajeOpcionesPasta] = useState('')

  // Estados para crear / editar opciones de pasta
  const [mostrarModalOpcionPasta, setMostrarModalOpcionPasta] = useState(false)
  const [opcionPastaEditando, setOpcionPastaEditando] = useState(null)
  const [nuevaOpcionPastaGrupo, setNuevaOpcionPastaGrupo] = useState('tipo_pasta')
  const [nuevaOpcionPastaNombre, setNuevaOpcionPastaNombre] = useState('')
  const [nuevaOpcionPastaPrecio, setNuevaOpcionPastaPrecio] = useState('')
  const [nuevaOpcionPastaOrden, setNuevaOpcionPastaOrden] = useState('0')
  const [nuevaOpcionPastaEstado, setNuevaOpcionPastaEstado] = useState('disponible')
  const [guardandoOpcionPastaModal, setGuardandoOpcionPastaModal] = useState(false)
  const [errorNuevaOpcionPasta, setErrorNuevaOpcionPasta] = useState('')

  // Estados de Acompañamientos
  const [acompanamientos, setAcompanamientos] = useState([])
  const [preciosAcompanamientos, setPreciosAcompanamientos] = useState({})
  const [cargandoAcompanamientos, setCargandoAcompanamientos] = useState(false)
  const [guardandoAcompanamientoId, setGuardandoAcompanamientoId] = useState(null)
  const [errorAcompanamientos, setErrorAcompanamientos] = useState('')
  const [mensajeAcompanamientos, setMensajeAcompanamientos] = useState('')

  // Estados para crear / editar acompañamientos
  const [mostrarModalAcompanamiento, setMostrarModalAcompanamiento] = useState(false)
  const [acompanamientoEditando, setAcompanamientoEditando] = useState(null)
  const [nuevoAcompanamientoNombre, setNuevoAcompanamientoNombre] = useState('')
  const [nuevoAcompanamientoPrecio, setNuevoAcompanamientoPrecio] = useState('')
  const [nuevoAcompanamientoOrden, setNuevoAcompanamientoOrden] = useState('0')
  const [nuevoAcompanamientoEstado, setNuevoAcompanamientoEstado] = useState('disponible')
  const [guardandoAcompanamientoModal, setGuardandoAcompanamientoModal] = useState(false)
  const [errorNuevoAcompanamiento, setErrorNuevoAcompanamiento] = useState('')

  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [resumenCajaHoy, setResumenCajaHoy] = useState(null)

  // ============================================================
  // VERIFICAR AUTENTICACIÓN
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated || user?.rol !== 'admin') {
      navigate('/login')
    }
  }, [isAuthenticated, user, navigate])

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  const cargarUsuarios = async () => {
    setCargandoLista(true)
    setErrorLista('')
    try {
      const response = await api.get('/users')
      setUsuarios(response.data)
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      setErrorLista('No se pudo cargar la lista de personal.')
    } finally {
      setCargandoLista(false)
    }
  }

  const cargarPedidos = async (silencioso = false) => {
    if (!silencioso) setCargandoPedidos(true)
    try {
      const response = await api.get('/pedidos')
      setPedidos(response.data)
    } catch (err) {
      console.error('Error al actualizar pedidos:', err)
    } finally {
      if (!silencioso) setCargandoPedidos(false)
    }
  }

  const cargarResumenCajaHoy = async () => {
    try {
      const response = await api.get('/caja/actual')

      setResumenCajaHoy(
        response.data?.resumen_hoy ||
        response.data?.resumen ||
        null
      )
    } catch (err) {
      console.error(
        'Error cargando resumen diario de caja:',
        err
      )
    }
  }

  const cargarComprobantes = async (silencioso = false) => {
    if (!silencioso) setCargandoComprobantes(true)
    try {
      const response = await api.get('/admin/comprobantes')
      setComprobantes(response.data)
    } catch (err) {
      console.error('Error al actualizar comprobantes:', err)
    } finally {
      if (!silencioso) setCargandoComprobantes(false)
    }
  }

  const cargarIngredientes = async () => {
    setCargandoIngredientes(true)
    setErrorIngredientes('')
    try {
      const response = await api.get('/ingredientes')
      setIngredientes(response.data)
      setPreciosIngredientes(
        response.data.reduce((acumulador, ingrediente) => {
          acumulador[ingrediente.id] = ingrediente.precio_extra
          return acumulador
        }, {})
      )
    } catch (err) {
      console.error('Error cargando ingredientes:', err)
      setErrorIngredientes('No se pudieron cargar los ingredientes extras.')
    } finally {
      setCargandoIngredientes(false)
    }
  }

  const cargarOpcionesPasta = async () => {
    setCargandoOpcionesPasta(true)
    setErrorOpcionesPasta('')
    try {
      const response = await api.get('/opciones-pasta')
      const datos = Array.isArray(response.data) ? response.data : []
      setOpcionesPasta(datos)
      setPreciosOpcionesPasta(
        datos.reduce((acumulador, opcion) => {
          acumulador[opcion.id] = opcion.precio_extra
          return acumulador
        }, {})
      )
    } catch (err) {
      console.error('Error cargando opciones de pasta:', err)
      setErrorOpcionesPasta('No se pudieron cargar las opciones de pasta.')
    } finally {
      setCargandoOpcionesPasta(false)
    }
  }

  const cargarAcompanamientos = async () => {
    setCargandoAcompanamientos(true)
    setErrorAcompanamientos('')
    try {
      const response = await api.get('/acompanamientos')
      const datos = Array.isArray(response.data) ? response.data : []
      setAcompanamientos(datos)
      setPreciosAcompanamientos(
        datos.reduce((acumulador, acompanamiento) => {
          acumulador[acompanamiento.id] = acompanamiento.precio_extra
          return acumulador
        }, {})
      )
    } catch (err) {
      console.error('Error cargando acompañamientos:', err)
      setErrorAcompanamientos('No se pudieron cargar los acompañamientos.')
    } finally {
      setCargandoAcompanamientos(false)
    }
  }

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    if (isAuthenticated && user?.rol === 'admin') {
      const cargarDatosIniciales = async () => {
        await Promise.all([
          cargarUsuarios(),
          cargarPedidos(false),
          cargarComprobantes(false),
          cargarResumenCajaHoy(),
          cargarIngredientes(),
          cargarOpcionesPasta(),
          cargarAcompanamientos(),
        ])
        setLastUpdated(new Date())
      }
      cargarDatosIniciales()
    }
  }, [isAuthenticated, user])

  // ============================================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ============================================================

  useEffect(() => {
    const actualizarSilenciosamente = () => {
      if (document.visibilityState !== 'visible') return
      cargarPedidos(true)
      cargarComprobantes(true)
      cargarResumenCajaHoy()
      setLastUpdated(new Date())
    }

    const intervalo = setInterval(actualizarSilenciosamente, 5000)
    return () => clearInterval(intervalo)
  }, [])

  // ============================================================
  // FUNCIONES CRUD
  // ============================================================

  const abrirModal = () => {
    setNombre('')
    setEmail('')
    setPassword('')
    setRol('cocina')
    setErrorForm('')
    setMostrarPassword(false)
    setMostrarModal(true)
  }

  const handleCrearUsuario = async (event) => {
    event.preventDefault()
    setErrorForm('')
    setGuardando(true)

    try {
      await api.post('/users', { name: nombre, email, password, rol })
      setMostrarModal(false)
      cargarUsuarios()
    } catch (err) {
      if (err.response?.data?.errors) {
        const primerError = Object.values(err.response.data.errors)[0][0]
        setErrorForm(primerError)
      } else {
        setErrorForm('No se pudo crear el usuario. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleEstado = async (usuario) => {
    try {
      await api.patch(`/users/${usuario.id}/toggle-estado`)
      cargarUsuarios()
    } catch (err) {
      setErrorLista('No se pudo actualizar el estado del usuario.')
    }
  }

  const verificarComprobante = async (pedidoId, estado) => {
    try {
      await api.patch(`/admin/comprobantes/${pedidoId}/verificar`, { estado })
      cargarComprobantes()
    } catch (err) {
      alert('Error al verificar el comprobante')
    }
  }

  const verComprobante = async (url) => {
    const ventanaComprobante = window.open('', '_blank')
    if (!ventanaComprobante) {
      alert('Permite las ventanas emergentes e intenta de nuevo.')
      return
    }

    ventanaComprobante.opener = null
    ventanaComprobante.document.title = 'Cargando comprobante...'
    ventanaComprobante.document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="text-align:center;">
          <div style="display:inline-block;width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <p style="margin-top:16px;color:rgba(255,255,255,0.5);font-size:14px;">Cargando comprobante...</p>
        </div>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </div>
    `

    try {
      const response = await api.get(url, { responseType: 'blob' })
      const tipoContenido = response.headers['content-type'] || response.data?.type || 'application/octet-stream'
      const blob = new Blob([response.data], { type: tipoContenido })
      const urlTemporal = URL.createObjectURL(blob)
      ventanaComprobante.location.href = urlTemporal
      setTimeout(() => URL.revokeObjectURL(urlTemporal), 60000)
    } catch (err) {
      ventanaComprobante.close()
      console.error('Error al visualizar comprobante:', err)
      alert('No se pudo visualizar el comprobante. Intenta de nuevo.')
    }
  }

  const abrirModalNuevoIngrediente = () => {
    setIngredienteEditando(null)
    setNuevoIngredienteNombre('')
    setNuevoIngredientePrecio('')
    setNuevoIngredienteEstado('disponible')
    setErrorNuevoIngrediente('')
    setMostrarModalIngrediente(true)
  }

  const abrirModalEditarIngrediente = (ingrediente) => {
    setIngredienteEditando(ingrediente)
    setNuevoIngredienteNombre(ingrediente.nombre || '')
    setNuevoIngredientePrecio(
      ingrediente.precio_extra !== null &&
      ingrediente.precio_extra !== undefined
        ? String(Math.round(Number(ingrediente.precio_extra)))
        : ''
    )
    setNuevoIngredienteEstado(
      ingrediente.estado === 'agotado'
        ? 'agotado'
        : 'disponible'
    )
    setErrorNuevoIngrediente('')
    setMostrarModalIngrediente(true)
  }

  const cerrarModalIngrediente = () => {
    if (creandoIngrediente) return

    setMostrarModalIngrediente(false)
    setIngredienteEditando(null)
    setNuevoIngredienteNombre('')
    setNuevoIngredientePrecio('')
    setNuevoIngredienteEstado('disponible')
    setErrorNuevoIngrediente('')
  }

  const guardarIngredienteModal = async (event) => {
    event.preventDefault()

    const nombreLimpio = nuevoIngredienteNombre.trim()
    const precio = Number(nuevoIngredientePrecio)

    setErrorNuevoIngrediente('')
    setErrorIngredientes('')
    setMensajeIngredientes('')

    if (!nombreLimpio) {
      setErrorNuevoIngrediente('Escribe el nombre del ingrediente.')
      return
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setErrorNuevoIngrediente(
        'Ingresa un precio válido mayor o igual a cero.'
      )
      return
    }

    setCreandoIngrediente(true)

    try {
      let ingredienteGuardado

      if (ingredienteEditando) {
        const response = await api.put(
          `/ingredientes/${ingredienteEditando.id}`,
          {
            nombre: nombreLimpio,
            precio_extra: precio,
          }
        )

        ingredienteGuardado = response.data.ingrediente

        /*
         * El endpoint PUT actualiza nombre y precio.
         * Si el administrador cambió el estado desde el modal,
         * usamos el endpoint existente de toggle para sincronizarlo.
         */
        if (
          ingredienteGuardado.estado !==
          nuevoIngredienteEstado
        ) {
          const responseEstado = await api.patch(
            `/ingredientes/${ingredienteEditando.id}/toggle-estado`
          )

          ingredienteGuardado =
            responseEstado.data.ingrediente
        }
      } else {
        const response = await api.post('/ingredientes', {
          nombre: nombreLimpio,
          precio_extra: precio,
          estado: nuevoIngredienteEstado,
        })

        ingredienteGuardado = response.data.ingrediente
      }

      setIngredientes((listaActual) => {
        const existe = listaActual.some(
          (item) => item.id === ingredienteGuardado.id
        )

        const nuevaLista = existe
          ? listaActual.map((item) =>
              item.id === ingredienteGuardado.id
                ? ingredienteGuardado
                : item
            )
          : [...listaActual, ingredienteGuardado]

        return nuevaLista.sort((a, b) =>
          String(a.nombre || '').localeCompare(
            String(b.nombre || ''),
            'es',
            { sensitivity: 'base' }
          )
        )
      })

      setPreciosIngredientes((valoresActuales) => ({
        ...valoresActuales,
        [ingredienteGuardado.id]:
          ingredienteGuardado.precio_extra,
      }))

      const estabaEditando = Boolean(ingredienteEditando)

      setMostrarModalIngrediente(false)
      setIngredienteEditando(null)
      setNuevoIngredienteNombre('')
      setNuevoIngredientePrecio('')
      setNuevoIngredienteEstado('disponible')
      setErrorNuevoIngrediente('')

      setMensajeIngredientes(
        estabaEditando
          ? `${ingredienteGuardado.nombre}: ingrediente actualizado correctamente.`
          : `${ingredienteGuardado.nombre}: ingrediente agregado correctamente.`
      )
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(
            err.response.data.errors
          )
            .flat()
            .find(Boolean)
        : null

      setErrorNuevoIngrediente(
        primerError ||
          err.response?.data?.message ||
          (ingredienteEditando
            ? 'No se pudo actualizar el ingrediente.'
            : 'No se pudo crear el ingrediente.')
      )
    } finally {
      setCreandoIngrediente(false)
    }
  }

  const guardarPrecioIngrediente = async (ingrediente) => {
    const precio = Number(preciosIngredientes[ingrediente.id])
    setErrorIngredientes('')
    setMensajeIngredientes('')

    if (!Number.isFinite(precio) || precio < 0) {
      setErrorIngredientes('Ingresa un precio válido mayor o igual a cero.')
      return
    }

    setGuardandoIngredienteId(ingrediente.id)
    try {
      const response = await api.put(`/ingredientes/${ingrediente.id}`, {
        nombre: ingrediente.nombre,
        precio_extra: precio,
      })
      const ingredienteActualizado = response.data.ingrediente
      setIngredientes((listaActual) =>
        listaActual.map((item) =>
          item.id === ingredienteActualizado.id ? ingredienteActualizado : item
        )
      )
      setPreciosIngredientes((valoresActuales) => ({
        ...valoresActuales,
        [ingredienteActualizado.id]: ingredienteActualizado.precio_extra,
      }))
      setMensajeIngredientes(`${ingredienteActualizado.nombre}: precio actualizado correctamente.`)
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0][0]
        : null
      setErrorIngredientes(primerError || 'No se pudo actualizar el precio del ingrediente.')
    } finally {
      setGuardandoIngredienteId(null)
    }
  }

  const cambiarEstadoIngrediente = async (ingrediente) => {
    setErrorIngredientes('')
    setMensajeIngredientes('')
    setGuardandoIngredienteId(ingrediente.id)
    try {
      const response = await api.patch(`/ingredientes/${ingrediente.id}/toggle-estado`)
      const ingredienteActualizado = response.data.ingrediente
      setIngredientes((listaActual) =>
        listaActual.map((item) =>
          item.id === ingredienteActualizado.id ? ingredienteActualizado : item
        )
      )
      setMensajeIngredientes(`${ingredienteActualizado.nombre}: estado actualizado correctamente.`)
    } catch (err) {
      setErrorIngredientes('No se pudo actualizar el estado del ingrediente.')
    } finally {
      setGuardandoIngredienteId(null)
    }
  }

  const ordenarOpcionesPasta = (lista) => {
    return [...lista].sort((a, b) => {
      const indiceGrupoA = ORDEN_GRUPOS_PASTA.indexOf(a.grupo)
      const indiceGrupoB = ORDEN_GRUPOS_PASTA.indexOf(b.grupo)

      const grupoA = indiceGrupoA === -1
        ? ORDEN_GRUPOS_PASTA.length
        : indiceGrupoA

      const grupoB = indiceGrupoB === -1
        ? ORDEN_GRUPOS_PASTA.length
        : indiceGrupoB

      if (grupoA !== grupoB) {
        return grupoA - grupoB
      }

      const ordenA = Number(a.orden) || 0
      const ordenB = Number(b.orden) || 0

      if (ordenA !== ordenB) {
        return ordenA - ordenB
      }

      return String(a.nombre || '').localeCompare(
        String(b.nombre || ''),
        'es',
        { sensitivity: 'base' }
      )
    })
  }

  const abrirModalNuevaOpcionPasta = (grupoInicial = 'tipo_pasta') => {
    setOpcionPastaEditando(null)
    setNuevaOpcionPastaGrupo(
      ORDEN_GRUPOS_PASTA.includes(grupoInicial)
        ? grupoInicial
        : 'tipo_pasta'
    )
    setNuevaOpcionPastaNombre('')
    setNuevaOpcionPastaPrecio('')
    setNuevaOpcionPastaOrden('0')
    setNuevaOpcionPastaEstado('disponible')
    setErrorNuevaOpcionPasta('')
    setMostrarModalOpcionPasta(true)
  }

  const abrirModalEditarOpcionPasta = (opcion) => {
    setOpcionPastaEditando(opcion)
    setNuevaOpcionPastaGrupo(
      ORDEN_GRUPOS_PASTA.includes(opcion.grupo)
        ? opcion.grupo
        : 'tipo_pasta'
    )
    setNuevaOpcionPastaNombre(opcion.nombre || '')
    setNuevaOpcionPastaPrecio(
      opcion.precio_extra !== null &&
      opcion.precio_extra !== undefined
        ? String(Math.round(Number(opcion.precio_extra)))
        : ''
    )
    setNuevaOpcionPastaOrden(
      opcion.orden !== null &&
      opcion.orden !== undefined
        ? String(Number(opcion.orden) || 0)
        : '0'
    )
    setNuevaOpcionPastaEstado(
      opcion.estado === 'agotado'
        ? 'agotado'
        : 'disponible'
    )
    setErrorNuevaOpcionPasta('')
    setMostrarModalOpcionPasta(true)
  }

  const cerrarModalOpcionPasta = () => {
    if (guardandoOpcionPastaModal) return

    setMostrarModalOpcionPasta(false)
    setOpcionPastaEditando(null)
    setNuevaOpcionPastaGrupo('tipo_pasta')
    setNuevaOpcionPastaNombre('')
    setNuevaOpcionPastaPrecio('')
    setNuevaOpcionPastaOrden('0')
    setNuevaOpcionPastaEstado('disponible')
    setErrorNuevaOpcionPasta('')
  }

  const guardarOpcionPastaModal = async (event) => {
    event.preventDefault()

    const nombreLimpio = nuevaOpcionPastaNombre.trim()
    const precio = Number(nuevaOpcionPastaPrecio)
    const orden = Number(nuevaOpcionPastaOrden)

    setErrorNuevaOpcionPasta('')
    setErrorOpcionesPasta('')
    setMensajeOpcionesPasta('')

    if (!ORDEN_GRUPOS_PASTA.includes(nuevaOpcionPastaGrupo)) {
      setErrorNuevaOpcionPasta('Selecciona un grupo válido.')
      return
    }

    if (!nombreLimpio) {
      setErrorNuevaOpcionPasta('Escribe el nombre de la opción.')
      return
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setErrorNuevaOpcionPasta(
        'Ingresa un precio adicional válido mayor o igual a cero.'
      )
      return
    }

    if (
      !Number.isInteger(orden) ||
      orden < 0 ||
      orden > 9999
    ) {
      setErrorNuevaOpcionPasta(
        'El orden debe ser un número entero entre 0 y 9999.'
      )
      return
    }

    setGuardandoOpcionPastaModal(true)

    try {
      let opcionGuardada

      const payload = {
        grupo: nuevaOpcionPastaGrupo,
        nombre: nombreLimpio,
        precio_extra: precio,
        orden,
      }

      if (opcionPastaEditando) {
        const response = await api.put(
          `/opciones-pasta/${opcionPastaEditando.id}`,
          payload
        )

        opcionGuardada = response.data.opcion
      } else {
        const response = await api.post(
          '/opciones-pasta',
          payload
        )

        opcionGuardada = response.data.opcion
      }

      /*
       * El store del backend crea la opción como "disponible" y
       * el PUT no modifica estado. Si el administrador eligió
       * otro estado, usamos el endpoint existente de toggle.
       */
      if (
        opcionGuardada.estado !==
        nuevaOpcionPastaEstado
      ) {
        const responseEstado = await api.patch(
          `/opciones-pasta/${opcionGuardada.id}/toggle-estado`
        )

        opcionGuardada = responseEstado.data.opcion
      }

      setOpcionesPasta((listaActual) => {
        const existe = listaActual.some(
          (item) => item.id === opcionGuardada.id
        )

        const nuevaLista = existe
          ? listaActual.map((item) =>
              item.id === opcionGuardada.id
                ? opcionGuardada
                : item
            )
          : [...listaActual, opcionGuardada]

        return ordenarOpcionesPasta(nuevaLista)
      })

      setPreciosOpcionesPasta((valoresActuales) => ({
        ...valoresActuales,
        [opcionGuardada.id]:
          opcionGuardada.precio_extra,
      }))

      const estabaEditando = Boolean(opcionPastaEditando)

      setMostrarModalOpcionPasta(false)
      setOpcionPastaEditando(null)
      setNuevaOpcionPastaGrupo('tipo_pasta')
      setNuevaOpcionPastaNombre('')
      setNuevaOpcionPastaPrecio('')
      setNuevaOpcionPastaOrden('0')
      setNuevaOpcionPastaEstado('disponible')
      setErrorNuevaOpcionPasta('')

      setMensajeOpcionesPasta(
        estabaEditando
          ? `${opcionGuardada.nombre}: opción actualizada correctamente.`
          : `${opcionGuardada.nombre}: opción agregada correctamente.`
      )
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(
            err.response.data.errors
          )
            .flat()
            .find(Boolean)
        : null

      setErrorNuevaOpcionPasta(
        primerError ||
          err.response?.data?.message ||
          (opcionPastaEditando
            ? 'No se pudo actualizar la opción de pasta.'
            : 'No se pudo crear la opción de pasta.')
      )
    } finally {
      setGuardandoOpcionPastaModal(false)
    }
  }

  const guardarPrecioOpcionPasta = async (opcion) => {
    const precio = Number(preciosOpcionesPasta[opcion.id])
    setErrorOpcionesPasta('')
    setMensajeOpcionesPasta('')

    if (!Number.isFinite(precio) || precio < 0) {
      setErrorOpcionesPasta('Ingresa un precio válido mayor o igual a cero.')
      return
    }

    setGuardandoOpcionPastaId(opcion.id)
    try {
      const response = await api.put(`/opciones-pasta/${opcion.id}`, {
        grupo: opcion.grupo,
        nombre: opcion.nombre,
        precio_extra: precio,
        orden: Number(opcion.orden) || 0,
      })
      const opcionActualizada = response.data.opcion
      setOpcionesPasta((listaActual) =>
        listaActual.map((item) =>
          item.id === opcionActualizada.id ? opcionActualizada : item
        )
      )
      setPreciosOpcionesPasta((valoresActuales) => ({
        ...valoresActuales,
        [opcionActualizada.id]: opcionActualizada.precio_extra,
      }))
      setMensajeOpcionesPasta(`${opcionActualizada.nombre}: precio actualizado correctamente.`)
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0][0]
        : null
      setErrorOpcionesPasta(primerError || 'No se pudo actualizar el precio de la opción de pasta.')
    } finally {
      setGuardandoOpcionPastaId(null)
    }
  }

  const cambiarEstadoOpcionPasta = async (opcion) => {
    setErrorOpcionesPasta('')
    setMensajeOpcionesPasta('')
    setGuardandoOpcionPastaId(opcion.id)
    try {
      const response = await api.patch(`/opciones-pasta/${opcion.id}/toggle-estado`)
      const opcionActualizada = response.data.opcion
      setOpcionesPasta((listaActual) =>
        listaActual.map((item) =>
          item.id === opcionActualizada.id ? opcionActualizada : item
        )
      )
      setMensajeOpcionesPasta(`${opcionActualizada.nombre}: estado actualizado correctamente.`)
    } catch (err) {
      setErrorOpcionesPasta('No se pudo actualizar el estado de la opción de pasta.')
    } finally {
      setGuardandoOpcionPastaId(null)
    }
  }

  const ordenarAcompanamientos = (lista) => {
    return [...lista].sort((a, b) => {
      const ordenA = Number(a.orden) || 0
      const ordenB = Number(b.orden) || 0

      if (ordenA !== ordenB) {
        return ordenA - ordenB
      }

      return String(a.nombre || '').localeCompare(
        String(b.nombre || ''),
        'es',
        { sensitivity: 'base' }
      )
    })
  }

  const abrirModalNuevoAcompanamiento = () => {
    setAcompanamientoEditando(null)
    setNuevoAcompanamientoNombre('')
    setNuevoAcompanamientoPrecio('')
    setNuevoAcompanamientoOrden('0')
    setNuevoAcompanamientoEstado('disponible')
    setErrorNuevoAcompanamiento('')
    setMostrarModalAcompanamiento(true)
  }

  const abrirModalEditarAcompanamiento = (acompanamiento) => {
    setAcompanamientoEditando(acompanamiento)
    setNuevoAcompanamientoNombre(acompanamiento.nombre || '')
    setNuevoAcompanamientoPrecio(
      acompanamiento.precio_extra !== null &&
      acompanamiento.precio_extra !== undefined
        ? String(Math.round(Number(acompanamiento.precio_extra)))
        : ''
    )
    setNuevoAcompanamientoOrden(
      acompanamiento.orden !== null &&
      acompanamiento.orden !== undefined
        ? String(Number(acompanamiento.orden) || 0)
        : '0'
    )
    setNuevoAcompanamientoEstado(
      acompanamiento.estado === 'agotado'
        ? 'agotado'
        : 'disponible'
    )
    setErrorNuevoAcompanamiento('')
    setMostrarModalAcompanamiento(true)
  }

  const cerrarModalAcompanamiento = () => {
    if (guardandoAcompanamientoModal) return

    setMostrarModalAcompanamiento(false)
    setAcompanamientoEditando(null)
    setNuevoAcompanamientoNombre('')
    setNuevoAcompanamientoPrecio('')
    setNuevoAcompanamientoOrden('0')
    setNuevoAcompanamientoEstado('disponible')
    setErrorNuevoAcompanamiento('')
  }

  const guardarAcompanamientoModal = async (event) => {
    event.preventDefault()

    const nombreLimpio = nuevoAcompanamientoNombre.trim()
    const precio = Number(nuevoAcompanamientoPrecio)
    const orden = Number(nuevoAcompanamientoOrden)

    setErrorNuevoAcompanamiento('')
    setErrorAcompanamientos('')
    setMensajeAcompanamientos('')

    if (!nombreLimpio) {
      setErrorNuevoAcompanamiento(
        'Escribe el nombre del acompañamiento.'
      )
      return
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setErrorNuevoAcompanamiento(
        'Ingresa un precio adicional válido mayor o igual a cero.'
      )
      return
    }

    if (
      !Number.isInteger(orden) ||
      orden < 0 ||
      orden > 9999
    ) {
      setErrorNuevoAcompanamiento(
        'El orden debe ser un número entero entre 0 y 9999.'
      )
      return
    }

    setGuardandoAcompanamientoModal(true)

    try {
      let acompanamientoGuardado

      const payload = {
        nombre: nombreLimpio,
        precio_extra: precio,
        orden,
      }

      if (acompanamientoEditando) {
        const response = await api.put(
          `/acompanamientos/${acompanamientoEditando.id}`,
          payload
        )

        acompanamientoGuardado =
          response.data.acompanamiento
      } else {
        const response = await api.post(
          '/acompanamientos',
          payload
        )

        acompanamientoGuardado =
          response.data.acompanamiento
      }

      /*
       * El backend crea nuevos acompañamientos como disponibles
       * y el PUT actualiza nombre, precio y orden. Si el estado
       * elegido en el modal es diferente, sincronizamos usando
       * el endpoint de toggle que ya existe.
       */
      if (
        acompanamientoGuardado.estado !==
        nuevoAcompanamientoEstado
      ) {
        const responseEstado = await api.patch(
          `/acompanamientos/${acompanamientoGuardado.id}/toggle-estado`
        )

        acompanamientoGuardado =
          responseEstado.data.acompanamiento
      }

      setAcompanamientos((listaActual) => {
        const existe = listaActual.some(
          (item) =>
            item.id === acompanamientoGuardado.id
        )

        const nuevaLista = existe
          ? listaActual.map((item) =>
              item.id === acompanamientoGuardado.id
                ? acompanamientoGuardado
                : item
            )
          : [...listaActual, acompanamientoGuardado]

        return ordenarAcompanamientos(nuevaLista)
      })

      setPreciosAcompanamientos((valoresActuales) => ({
        ...valoresActuales,
        [acompanamientoGuardado.id]:
          acompanamientoGuardado.precio_extra,
      }))

      const estabaEditando =
        Boolean(acompanamientoEditando)

      setMostrarModalAcompanamiento(false)
      setAcompanamientoEditando(null)
      setNuevoAcompanamientoNombre('')
      setNuevoAcompanamientoPrecio('')
      setNuevoAcompanamientoOrden('0')
      setNuevoAcompanamientoEstado('disponible')
      setErrorNuevoAcompanamiento('')

      setMensajeAcompanamientos(
        estabaEditando
          ? `${acompanamientoGuardado.nombre}: acompañamiento actualizado correctamente.`
          : `${acompanamientoGuardado.nombre}: acompañamiento agregado correctamente.`
      )
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(
            err.response.data.errors
          )
            .flat()
            .find(Boolean)
        : null

      setErrorNuevoAcompanamiento(
        primerError ||
          err.response?.data?.message ||
          (acompanamientoEditando
            ? 'No se pudo actualizar el acompañamiento.'
            : 'No se pudo crear el acompañamiento.')
      )
    } finally {
      setGuardandoAcompanamientoModal(false)
    }
  }

  const guardarPrecioAcompanamiento = async (acompanamiento) => {
    const precio = Number(preciosAcompanamientos[acompanamiento.id])
    setErrorAcompanamientos('')
    setMensajeAcompanamientos('')

    if (!Number.isFinite(precio) || precio < 0) {
      setErrorAcompanamientos('Ingresa un precio válido mayor o igual a cero.')
      return
    }

    setGuardandoAcompanamientoId(acompanamiento.id)
    try {
      const response = await api.put(`/acompanamientos/${acompanamiento.id}`, {
        nombre: acompanamiento.nombre,
        precio_extra: precio,
        orden: Number(acompanamiento.orden) || 0,
      })
      const acompanamientoActualizado = response.data.acompanamiento
      setAcompanamientos((listaActual) =>
        listaActual.map((item) =>
          item.id === acompanamientoActualizado.id ? acompanamientoActualizado : item
        )
      )
      setPreciosAcompanamientos((valoresActuales) => ({
        ...valoresActuales,
        [acompanamientoActualizado.id]: acompanamientoActualizado.precio_extra,
      }))
      setMensajeAcompanamientos(`${acompanamientoActualizado.nombre}: precio actualizado correctamente.`)
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0][0]
        : null
      setErrorAcompanamientos(primerError || 'No se pudo actualizar el precio del acompañamiento.')
    } finally {
      setGuardandoAcompanamientoId(null)
    }
  }

  const cambiarEstadoAcompanamiento = async (acompanamiento) => {
    setErrorAcompanamientos('')
    setMensajeAcompanamientos('')
    setGuardandoAcompanamientoId(acompanamiento.id)
    try {
      const response = await api.patch(`/acompanamientos/${acompanamiento.id}/toggle-estado`)
      const acompanamientoActualizado = response.data.acompanamiento
      setAcompanamientos((listaActual) =>
        listaActual.map((item) =>
          item.id === acompanamientoActualizado.id ? acompanamientoActualizado : item
        )
      )
      setMensajeAcompanamientos(`${acompanamientoActualizado.nombre}: estado actualizado correctamente.`)
    } catch (err) {
      setErrorAcompanamientos('No se pudo actualizar el estado del acompañamiento.')
    } finally {
      setGuardandoAcompanamientoId(null)
    }
  }

  // ============================================================
  // FILTROS
  // ============================================================

  const ordenesActivas = pedidos.filter((pedido) => pedido.estado_pedido !== 'entregado')
  const ordenesEntregadas = pedidos.filter((pedido) => pedido.estado_pedido === 'entregado')
  const ordenesAMostrar = vistaOrdenes === 'activas' ? ordenesActivas : ordenesEntregadas

  const terminoBusqueda = normalizarTexto(busquedaComprobantes)
  const comprobantesFiltrados = comprobantes.filter((comprobante) => {
    const coincideEstado = filtroComprobantes === 'todos' || comprobante.estado_pago === filtroComprobantes
    const coincideBusqueda =
      terminoBusqueda === '' ||
      normalizarTexto(comprobante.codigo_tracking).includes(terminoBusqueda) ||
      normalizarTexto(comprobante.pedido_id).includes(terminoBusqueda) ||
      normalizarTexto(comprobante.cliente_nombre).includes(terminoBusqueda)
    return coincideEstado && coincideBusqueda
  })

  // ============================================================
  // CALCULAR ESTADÍSTICAS
  // ============================================================

  const estadisticas = {
    ordenesPendientes: pedidos.filter((p) => p.estado_pedido === 'pendiente').length,
    ordenesActivas: ordenesActivas.length,
    comprobantesPendientes: comprobantes.filter((c) => c.estado_pago === 'pendiente_verificacion').length,
    totalUsuarios: usuarios.length,
    totalPedidos: pedidos.length,
    totalIngredientes: ingredientes.length,
    totalOpcionesPasta: opcionesPasta.length,
  }


  // ============================================================
  // RENDER TARJETAS DE GESTIÓN
  // ============================================================

  const renderTarjetaOpcionPasta = (opcion) => {
    const estaGuardando = guardandoOpcionPastaId === opcion.id
    const disponible = opcion.estado === 'disponible'

    return (
      <div
        key={opcion.id}
        className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white/90 group-hover:text-white">
              {opcion.nombre}
            </h4>
            <p className="mt-0.5 text-xs text-white/40">
              {ETIQUETA_GRUPO_PASTA[opcion.grupo] || opcion.grupo}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                abrirModalEditarOpcionPasta(opcion)
              }
              disabled={estaGuardando}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/40 transition hover:border-amber-400/20 hover:bg-amber-400/[0.06] hover:text-amber-300 disabled:opacity-40"
            >
              <Pencil size={11} />
              Editar
            </button>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${disponible
                ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-400/30'
                : 'bg-white/5 text-white/30 ring-white/10'
                }`}
            >
              {disponible ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-amber-400">₡</span>
            <input
              type="number"
              min="0"
              step="1"
              value={preciosOpcionesPasta[opcion.id] ?? ''}
              onChange={(event) =>
                setPreciosOpcionesPasta((valoresActuales) => ({
                  ...valoresActuales,
                  [opcion.id]: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 pl-7 text-xs font-mono text-white outline-none transition focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={() => guardarPrecioOpcionPasta(opcion)}
            disabled={estaGuardando}
            className="rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-3 py-1.5 text-[10px] font-medium text-amber-400 transition-all hover:from-amber-500/30 hover:to-amber-600/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {estaGuardando ? '...' : 'Guardar'}
          </button>
          <button
            onClick={() => cambiarEstadoOpcionPasta(opcion)}
            disabled={estaGuardando}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/30 transition-all hover:border-white/20 hover:text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disponible ? '×' : '✓'}
          </button>
        </div>
      </div>
    )
  }

  const renderTarjetaAcompanamiento = (acompanamiento) => {
    const estaGuardando = guardandoAcompanamientoId === acompanamiento.id
    const disponible = acompanamiento.estado === 'disponible'

    return (
      <div
        key={acompanamiento.id}
        className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white/90 group-hover:text-white">
              {acompanamiento.nombre}
            </h4>
            <p className="mt-0.5 text-xs text-white/40">3ra selección+</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                abrirModalEditarAcompanamiento(
                  acompanamiento
                )
              }
              disabled={estaGuardando}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/40 transition hover:border-violet-400/20 hover:bg-violet-400/[0.06] hover:text-violet-300 disabled:opacity-40"
            >
              <Pencil size={11} />
              Editar
            </button>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${disponible
                ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-400/30'
                : 'bg-white/5 text-white/30 ring-white/10'
                }`}
            >
              {disponible ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-violet-400">₡</span>
            <input
              type="number"
              min="0"
              step="1"
              value={preciosAcompanamientos[acompanamiento.id] ?? ''}
              onChange={(event) =>
                setPreciosAcompanamientos((valoresActuales) => ({
                  ...valoresActuales,
                  [acompanamiento.id]: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 pl-7 text-xs font-mono text-white outline-none transition focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          <button
            onClick={() => guardarPrecioAcompanamiento(acompanamiento)}
            disabled={estaGuardando}
            className="rounded-lg bg-gradient-to-r from-violet-500/20 to-violet-600/20 px-3 py-1.5 text-[10px] font-medium text-violet-400 transition-all hover:from-violet-500/30 hover:to-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {estaGuardando ? '...' : 'Guardar'}
          </button>
          <button
            onClick={() => cambiarEstadoAcompanamiento(acompanamiento)}
            disabled={estaGuardando}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/30 transition-all hover:border-white/20 hover:text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disponible ? '×' : '✓'}
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // CONFIGURACIÓN DE MÓDULOS
  // ============================================================

  const modulosAdministrativos = [
    {
      id: 'productos',
      title: 'Productos',
      description: 'Administra las pizzas, bebidas, platos y precios visibles en el menú.',
      icon: Pizza,
      accent: 'orange',
      countLabel: 'en menú',
      onClick: () => navigate('/admin/productos'),
      featured: true,
    },
    {
      id: 'ordenes',
      title: 'Pedidos',
      description: 'Consulta las órdenes activas, entregadas y el detalle de cada pedido.',
      icon: ShoppingBag,
      accent: 'blue',
      count: estadisticas.ordenesActivas,
      countLabel: 'activas',
      onClick: () => setVistaAdmin('ordenes'),
      featured: true,
    },
    {
      id: 'caja',
      title: 'Control de caja',
      description: 'Consulta ventas por método de pago, apertura, efectivo esperado e historial de cierres.',
      icon: CreditCard,
      accent: 'emerald',
      countLabel: 'finanzas',
      onClick: () => setVistaAdmin('caja'),
      featured: true,
    },
    {
      id: 'comprobantes',
      title: 'Comprobantes',
      description: 'Revisa y valida los pagos recibidos mediante SINPE Móvil.',
      icon: CreditCard,
      accent: 'violet',
      count: estadisticas.comprobantesPendientes,
      countLabel: 'pendientes',
      onClick: () => setVistaAdmin('comprobantes'),
    },
    {
      id: 'ingredientes',
      title: 'Ingredientes',
      description: 'Controla precios adicionales y disponibilidad de ingredientes extra.',
      icon: Package,
      accent: 'rose',
      count: estadisticas.totalIngredientes,
      countLabel: 'registrados',
      onClick: () => setVistaAdmin('ingredientes'),
    },
    {
      id: 'pasta',
      title: 'Opciones de pasta',
      description: 'Gestiona tipos de pasta, proteínas, salsas y complementos.',
      icon: Utensils,
      accent: 'amber',
      count: estadisticas.totalOpcionesPasta,
      countLabel: 'opciones',
      onClick: () => setVistaAdmin('pasta'),
    },
    {
      id: 'acompanamientos',
      title: 'Acompañamientos',
      description: 'Configura acompañamientos disponibles y sus precios adicionales.',
      icon: Coffee,
      accent: 'emerald',
      count: acompanamientos.length,
      countLabel: 'disponibles',
      onClick: () => setVistaAdmin('acompanamientos'),
    },
    {
      id: 'personal',
      title: 'Personal',
      description: 'Crea usuarios, asigna roles y controla el acceso del equipo.',
      icon: Users,
      accent: 'cyan',
      count: usuarios.length,
      countLabel: 'usuarios',
      onClick: () => setVistaAdmin('personal'),
    },
    {
      id: 'horario',
      title: 'Horario y pedidos',
      description: 'Configura el último pedido, extiende el horario de hoy o pausa nuevas órdenes.',
      icon: Clock3,
      accent: 'orange',
      count: '21:30',
      countLabel: 'límite',
      onClick: () => navigate('/admin/horario'),
      featured: true,
    },
  ]

  // ============================================================
  // RENDER DASHBOARD
  // ============================================================

  const renderDashboard = () => (
    <div className="space-y-6">
      <AdminCajaPanel
        compacto
        onVerDetalle={() => setVistaAdmin('caja')}
      />

      <AdminHome
        user={user}
        modules={modulosAdministrativos}
        orders={pedidos}
        users={usuarios}
        activeOrders={estadisticas.ordenesActivas}
        pendingPayments={estadisticas.comprobantesPendientes}
        paymentSummary={resumenCajaHoy}
        lastUpdated={lastUpdated}
        onRefresh={() => {
          cargarPedidos(false)
          cargarComprobantes(false)
          cargarResumenCajaHoy()
          setLastUpdated(new Date())
        }}
      />
    </div>
  )

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <AdminDashboardHomeLayout
      onSelectView={setVistaAdmin}
      activeView={vistaAdmin}
    >
      {/* DASHBOARD */}
      {vistaAdmin === 'dashboard' && renderDashboard()}

      {/* CONTROL DE CAJA */}
      {vistaAdmin === 'caja' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Control de caja
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Ventas por método de pago, apertura, efectivo esperado e historial de cierres.
            </p>
          </div>

          <AdminCajaPanel />
        </div>
      )}

      {/* ÓRDENES */}
      {vistaAdmin === 'ordenes' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Órdenes</h2>
            <p className="text-sm text-white/40">Gestión de pedidos</p>
          </div>

          <div className="flex gap-1 border-b border-white/10 pb-4">
            <button
              onClick={() => setVistaOrdenes('activas')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${vistaOrdenes === 'activas'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
                }`}
            >
              Activas ({ordenesActivas.length})
            </button>
            <button
              onClick={() => setVistaOrdenes('entregadas')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${vistaOrdenes === 'entregadas'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
                }`}
            >
              Entregadas ({ordenesEntregadas.length})
            </button>
          </div>

          {cargandoPedidos ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-white/40">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Cargando...</span>
              </div>
            </div>
          ) : ordenesAMostrar.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-sm text-white/30">
                {vistaOrdenes === 'activas' ? 'No hay órdenes activas' : 'No hay órdenes entregadas'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ordenesAMostrar.map((pedido) => (
                <div
                  key={pedido.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-white">
                          #{pedido.codigo_tracking}
                        </p>
                        <p className="mt-0.5 text-xs text-white/40">
                          {pedido.modalidad_entrega === 'consumo_local' ? 'Local' : 'Retirar'}
                        </p>
                        {pedido.cliente && (
                          <p className="mt-1 text-xs text-white/30">{pedido.cliente.nombre}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${COLOR_ESTADO[pedido.estado_pedido]}`}>
                        {ETIQUETA_ESTADO[pedido.estado_pedido]}
                      </span>
                    </div>

                    <ul className="mb-4 space-y-1 rounded-xl bg-black/30 p-3">
                      {pedido.detalles.slice(0, 3).map((detalle) => (
                        <li key={detalle.id} className="flex justify-between text-sm">
                          <span className="text-white/70">
                            {detalle.cantidad}x {detalle.producto.nombre}
                          </span>
                          <span className="text-white/40">
                            ₡{parseFloat(detalle.subtotal).toLocaleString('es-CR')}
                          </span>
                        </li>
                      ))}
                      {pedido.detalles.length > 3 && (
                        <li className="text-xs text-white/30">+{pedido.detalles.length - 3} más</li>
                      )}
                    </ul>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-xs font-medium text-white/40">Total</span>
                      <span className="font-mono text-base font-bold text-amber-400">
                        ₡{parseFloat(pedido.total).toLocaleString('es-CR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INGREDIENTES */}
      {vistaAdmin === 'ingredientes' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Ingredientes Extras</h2>
              <p className="text-sm text-white/40">
                Agrega ingredientes para pizzas y administra su precio y disponibilidad
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModalNuevoIngrediente}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E4002B] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-950/20 transition-all hover:bg-[#ff173e] hover:shadow-rose-950/35"
            >
              <Plus size={16} />
              Nuevo ingrediente
            </button>
          </div>

          {mensajeIngredientes && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {mensajeIngredientes}
            </div>
          )}

          {errorIngredientes && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {errorIngredientes}
            </div>
          )}

          {cargandoIngredientes ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-white/40">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Cargando...</span>
              </div>
            </div>
          ) : ingredientes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-sm text-white/30">No hay ingredientes registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ingredientes.map((ingrediente) => {
                const estaGuardando = guardandoIngredienteId === ingrediente.id
                const disponible = ingrediente.estado === 'disponible'

                return (
                  <div
                    key={ingrediente.id}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white/90 group-hover:text-white">
                          {ingrediente.nombre}
                        </h4>
                        <p className="mt-0.5 text-xs text-white/40">Por unidad extra</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            abrirModalEditarIngrediente(
                              ingrediente
                            )
                          }
                          disabled={estaGuardando}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/40 transition hover:border-rose-400/20 hover:bg-rose-400/[0.06] hover:text-rose-300 disabled:opacity-40"
                        >
                          <Pencil size={11} />
                          Editar
                        </button>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${disponible
                            ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-400/30'
                            : 'bg-white/5 text-white/30 ring-white/10'
                            }`}
                        >
                          {disponible ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-rose-400">₡</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={preciosIngredientes[ingrediente.id] ?? ''}
                          onChange={(event) =>
                            setPreciosIngredientes((valoresActuales) => ({
                              ...valoresActuales,
                              [ingrediente.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 pl-7 text-xs font-mono text-white outline-none transition focus:border-rose-500/30 focus:ring-1 focus:ring-rose-500/20"
                        />
                      </div>
                      <button
                        onClick={() => guardarPrecioIngrediente(ingrediente)}
                        disabled={estaGuardando}
                        className="rounded-lg bg-gradient-to-r from-rose-500/20 to-rose-600/20 px-3 py-1.5 text-[10px] font-medium text-rose-400 transition-all hover:from-rose-500/30 hover:to-rose-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {estaGuardando ? '...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => cambiarEstadoIngrediente(ingrediente)}
                        disabled={estaGuardando}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/30 transition-all hover:border-white/20 hover:text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {disponible ? '×' : '✓'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* PASTA */}
      {vistaAdmin === 'pasta' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Opciones de Pasta
              </h2>
              <p className="text-sm text-white/40">
                Agrega y edita tipos de pasta, proteínas, salsas y extras
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                abrirModalNuevaOpcionPasta('tipo_pasta')
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-black shadow-lg shadow-amber-950/20 transition-all hover:bg-amber-400 hover:shadow-amber-950/35"
            >
              <Plus size={16} />
              Nueva opción
            </button>
          </div>

          {mensajeOpcionesPasta && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {mensajeOpcionesPasta}
            </div>
          )}

          {errorOpcionesPasta && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {errorOpcionesPasta}
            </div>
          )}

          {cargandoOpcionesPasta ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-white/40">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Cargando...</span>
              </div>
            </div>
          ) : opcionesPasta.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-sm text-white/30">No hay opciones de pasta registradas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {ORDEN_GRUPOS_PASTA.map((grupo) => {
                const opcionesDelGrupo = opcionesPasta.filter((opcion) => opcion.grupo === grupo)
                if (opcionesDelGrupo.length === 0) return null

                return (
                  <div key={grupo}>
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400/60">
                        {ETIQUETA_GRUPO_PASTA[grupo]}
                      </h3>
                      <span className="h-px flex-1 bg-white/10" />
                      <span className="text-xs text-white/30">{opcionesDelGrupo.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {opcionesDelGrupo.map(renderTarjetaOpcionPasta)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ACOMPAÑAMIENTOS */}
      {vistaAdmin === 'acompanamientos' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Acompañamientos
              </h2>
              <p className="text-sm text-white/40">
                Agrega acompañamientos y administra precio, orden y disponibilidad
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModalNuevoAcompanamiento}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-950/20 transition-all hover:bg-violet-400 hover:shadow-violet-950/35"
            >
              <Plus size={16} />
              Nuevo acompañamiento
            </button>
          </div>

          {mensajeAcompanamientos && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {mensajeAcompanamientos}
            </div>
          )}

          {errorAcompanamientos && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {errorAcompanamientos}
            </div>
          )}

          {cargandoAcompanamientos ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-white/40">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Cargando...</span>
              </div>
            </div>
          ) : acompanamientos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-sm text-white/30">No hay acompañamientos registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {acompanamientos.map(renderTarjetaAcompanamiento)}
            </div>
          )}
        </div>
      )}

      {/* COMPROBANTES */}
      {vistaAdmin === 'comprobantes' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Comprobantes</h2>
            <p className="text-sm text-white/40">Verificación de pagos Sinpe Móvil</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="search"
                value={busquedaComprobantes}
                onChange={(event) => setBusquedaComprobantes(event.target.value)}
                placeholder="Buscar por pedido o cliente..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:ring-2 focus:ring-white/10"
              />
            </div>
            <select
              value={filtroComprobantes}
              onChange={(event) =>
                setFiltroComprobantes(
                  event.target.value
                )
              }
              style={{
                colorScheme: 'dark',
              }}
              className="
    min-w-[160px]
    rounded-xl
    border border-white/10
    bg-[#17110d]
    px-4 py-3
    text-sm font-medium
    text-white
    outline-none
    transition
    focus:border-orange-400/40
    focus:ring-2
    focus:ring-orange-400/10
  "
            >
              <option
                value="todos"
                className="bg-[#17110d] text-white"
              >
                Todos los estados
              </option>

              <option
                value="pendiente_verificacion"
                className="bg-[#17110d] text-white"
              >
                Pendientes
              </option>

              <option
                value="verificado"
                className="bg-[#17110d] text-white"
              >
                Verificados
              </option>

              <option
                value="rechazado"
                className="bg-[#17110d] text-white"
              >
                Rechazados
              </option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {cargandoComprobantes ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-white/30">
                        Cargando...
                      </td>
                    </tr>
                  ) : comprobantesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-white/30">
                        No hay comprobantes
                      </td>
                    </tr>
                  ) : (
                    comprobantesFiltrados.map((comprobante) => (
                      <tr key={comprobante.pedido_id} className="transition-colors hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-white">
                          #{comprobante.codigo_tracking}
                        </td>
                        <td className="px-4 py-3 text-white/60">
                          {comprobante.cliente_nombre || 'Anónimo'}
                        </td>
                        <td className="px-4 py-3 text-white/40">
                          {new Date(comprobante.fecha).toLocaleDateString('es-CR')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${comprobante.estado_pago === 'verificado'
                              ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-400/30'
                              : comprobante.estado_pago === 'rechazado'
                                ? 'bg-rose-500/20 text-rose-400 ring-rose-400/30'
                                : 'bg-amber-500/20 text-amber-400 ring-amber-400/30'
                              }`}
                          >
                            {comprobante.estado_pago === 'verificado'
                              ? 'Verificado'
                              : comprobante.estado_pago === 'rechazado'
                                ? 'Rechazado'
                                : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => verComprobante(comprobante.comprobante_url)}
                              className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-medium text-white/40 transition-all hover:bg-white/10 hover:text-white/70"
                            >
                              Ver
                            </button>
                            {comprobante.estado_pago !== 'verificado' && (
                              <button
                                onClick={() => verificarComprobante(comprobante.pedido_id, 'verificado')}
                                className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[10px] font-medium text-emerald-400 transition-all hover:bg-emerald-500/30"
                              >
                                ✓
                              </button>
                            )}
                            {comprobante.estado_pago !== 'rechazado' && (
                              <button
                                onClick={() => verificarComprobante(comprobante.pedido_id, 'rechazado')}
                                className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-[10px] font-medium text-rose-400 transition-all hover:bg-rose-500/30"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL */}
      {vistaAdmin === 'personal' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Personal</h2>
              <p className="text-sm text-white/40">
                Gestión de usuarios y permisos
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/80 to-cyan-600/80 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40"
            >
              <Plus size={16} />
              Nuevo usuario
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Correo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Rol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {cargandoLista ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-white/30">
                        Cargando...
                      </td>
                    </tr>
                  ) : errorLista ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-rose-400">
                        {errorLista}
                      </td>
                    </tr>
                  ) : usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-white/30">
                        No hay usuarios
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((usuario) => (
                      <tr key={usuario.id} className="transition-colors hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/80 to-cyan-600/80 text-xs font-bold text-white shadow-lg shadow-cyan-500/20">
                              {usuario.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{usuario.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-white/40">
                          {usuario.email}
                        </td>
                        <td className="px-4 py-3 text-white/50">
                          {ROLES.find((r) => r.value === usuario.rol)?.label || usuario.rol}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${usuario.estado === 'activo'
                              ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-400/30'
                              : 'bg-white/5 text-white/30 ring-white/10'
                              }`}
                          >
                            {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleEstado(usuario)}
                            className="text-xs font-medium text-amber-400/70 transition-colors hover:text-amber-400"
                          >
                            {usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
      MODAL CREAR USUARIO
      ========================================================== */}
      {/* MODAL: CREAR / EDITAR ACOMPAÑAMIENTO */}
      {mostrarModalAcompanamiento && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#11100f] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] bg-[#151311] px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300/60">
                  Personalización de platos
                </p>

                <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                  {acompanamientoEditando
                    ? 'Editar acompañamiento'
                    : 'Nuevo acompañamiento'}
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/30">
                  {acompanamientoEditando
                    ? 'Modifica nombre, precio adicional, orden o disponibilidad.'
                    : 'Agrega una nueva opción para carnes y platos personalizables.'}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalAcompanamiento}
                disabled={guardandoAcompanamientoModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/35 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarAcompanamientoModal}>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    Nombre
                  </label>

                  <input
                    autoFocus
                    type="text"
                    maxLength={100}
                    value={nuevoAcompanamientoNombre}
                    onChange={(event) => {
                      setNuevoAcompanamientoNombre(
                        event.target.value
                      )
                      setErrorNuevoAcompanamiento('')
                    }}
                    placeholder="Ej. Papa majada, vegetales, arroz..."
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-white/15 focus:border-violet-400/40 focus:bg-black/35 focus:ring-2 focus:ring-violet-400/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                      Precio desde 3ra selección
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-black text-violet-300">
                        ₡
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={nuevoAcompanamientoPrecio}
                        onChange={(event) => {
                          const valor =
                            event.target.value.replace(
                              /\D/g,
                              ''
                            )

                          setNuevoAcompanamientoPrecio(
                            valor
                          )
                          setErrorNuevoAcompanamiento('')
                        }}
                        placeholder="0"
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-black/25 py-3 pl-10 pr-4 font-mono text-sm font-bold text-white outline-none transition placeholder:text-white/15 focus:border-violet-400/40 focus:bg-black/35 focus:ring-2 focus:ring-violet-400/10"
                      />
                    </div>

                    <p className="mt-1.5 text-[10px] leading-4 text-white/20">
                      Este valor se cobra cuando el acompañamiento ocupa la tercera selección o una posterior.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                      Orden
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="9999"
                      step="1"
                      value={nuevoAcompanamientoOrden}
                      onChange={(event) => {
                        setNuevoAcompanamientoOrden(
                          event.target.value
                        )
                        setErrorNuevoAcompanamiento('')
                      }}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 font-mono text-sm font-bold text-white outline-none transition focus:border-violet-400/40 focus:bg-black/35 focus:ring-2 focus:ring-violet-400/10"
                    />

                    <p className="mt-1.5 text-[10px] text-white/20">
                      Menor número = aparece primero.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    {acompanamientoEditando
                      ? 'Estado'
                      : 'Estado inicial'}
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoAcompanamientoEstado(
                          'disponible'
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        nuevoAcompanamientoEstado ===
                        'disponible'
                          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                          : 'border-white/[0.08] bg-white/[0.025] text-white/30 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      ✓ Disponible
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNuevoAcompanamientoEstado(
                          'agotado'
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        nuevoAcompanamientoEstado ===
                        'agotado'
                          ? 'border-violet-400/25 bg-violet-400/10 text-violet-300'
                          : 'border-white/[0.08] bg-white/[0.025] text-white/30 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      × Agotado
                    </button>
                  </div>
                </div>

                {errorNuevoAcompanamiento && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-xs font-semibold text-rose-300">
                    {errorNuevoAcompanamiento}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-[#151311] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalAcompanamiento}
                  disabled={guardandoAcompanamientoModal}
                  className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-xs font-bold text-white/35 transition hover:border-white/15 hover:bg-white/[0.04] hover:text-white/65 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoAcompanamientoModal}
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-2.5 text-xs font-black text-white shadow-[0_10px_30px_rgba(139,92,246,0.16)] transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {acompanamientoEditando
                    ? <Pencil size={15} />
                    : <Plus size={15} />}

                  {guardandoAcompanamientoModal
                    ? 'Guardando...'
                    : acompanamientoEditando
                      ? 'Guardar cambios'
                      : 'Agregar acompañamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR OPCIÓN DE PASTA */}
      {mostrarModalOpcionPasta && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#11100f] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] bg-[#151311] px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300/60">
                  Personalización de pasta
                </p>

                <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                  {opcionPastaEditando
                    ? 'Editar opción de pasta'
                    : 'Nueva opción de pasta'}
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/30">
                  {opcionPastaEditando
                    ? 'Modifica el grupo, nombre, precio, orden o disponibilidad.'
                    : 'Agrega un tipo de pasta, proteína, salsa o ingrediente adicional.'}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalOpcionPasta}
                disabled={guardandoOpcionPastaModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/35 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarOpcionPastaModal}>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    Grupo
                  </label>

                  <select
                    value={nuevaOpcionPastaGrupo}
                    onChange={(event) => {
                      setNuevaOpcionPastaGrupo(event.target.value)
                      setErrorNuevaOpcionPasta('')
                    }}
                    style={{ colorScheme: 'dark' }}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0d0c0b] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/10"
                    required
                  >
                    {ORDEN_GRUPOS_PASTA.map((grupo) => (
                      <option
                        key={grupo}
                        value={grupo}
                        className="bg-[#11100f] text-white"
                      >
                        {ETIQUETA_GRUPO_PASTA[grupo] || grupo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    Nombre
                  </label>

                  <input
                    autoFocus
                    type="text"
                    maxLength={100}
                    value={nuevaOpcionPastaNombre}
                    onChange={(event) => {
                      setNuevaOpcionPastaNombre(event.target.value)
                      setErrorNuevaOpcionPasta('')
                    }}
                    placeholder={
                      nuevaOpcionPastaGrupo === 'tipo_pasta'
                        ? 'Ej. Linguine'
                        : nuevaOpcionPastaGrupo === 'proteina'
                          ? 'Ej. Salmón'
                          : nuevaOpcionPastaGrupo === 'salsa'
                            ? 'Ej. Pesto'
                            : 'Ej. Champiñones'
                    }
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-white/15 focus:border-amber-400/40 focus:bg-black/35 focus:ring-2 focus:ring-amber-400/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                      Precio adicional
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-black text-amber-300">
                        ₡
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={nuevaOpcionPastaPrecio}
                        onChange={(event) => {
                          const valor = event.target.value.replace(/\D/g, '')
                          setNuevaOpcionPastaPrecio(valor)
                          setErrorNuevaOpcionPasta('')
                        }}
                        placeholder="0"
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-black/25 py-3 pl-10 pr-4 font-mono text-sm font-bold text-white outline-none transition placeholder:text-white/15 focus:border-amber-400/40 focus:bg-black/35 focus:ring-2 focus:ring-amber-400/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                      Orden
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="9999"
                      step="1"
                      value={nuevaOpcionPastaOrden}
                      onChange={(event) => {
                        setNuevaOpcionPastaOrden(event.target.value)
                        setErrorNuevaOpcionPasta('')
                      }}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 font-mono text-sm font-bold text-white outline-none transition focus:border-amber-400/40 focus:bg-black/35 focus:ring-2 focus:ring-amber-400/10"
                    />

                    <p className="mt-1.5 text-[10px] text-white/20">
                      Menor número = aparece primero.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    {opcionPastaEditando ? 'Estado' : 'Estado inicial'}
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNuevaOpcionPastaEstado('disponible')
                      }
                      className={`rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        nuevaOpcionPastaEstado === 'disponible'
                          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                          : 'border-white/[0.08] bg-white/[0.025] text-white/30 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      ✓ Disponible
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNuevaOpcionPastaEstado('agotado')
                      }
                      className={`rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        nuevaOpcionPastaEstado === 'agotado'
                          ? 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                          : 'border-white/[0.08] bg-white/[0.025] text-white/30 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      × Agotado
                    </button>
                  </div>
                </div>

                {errorNuevaOpcionPasta && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-xs font-semibold text-rose-300">
                    {errorNuevaOpcionPasta}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-[#151311] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalOpcionPasta}
                  disabled={guardandoOpcionPastaModal}
                  className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-xs font-bold text-white/35 transition hover:border-white/15 hover:bg-white/[0.04] hover:text-white/65 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoOpcionPastaModal}
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-black text-black shadow-[0_10px_30px_rgba(245,158,11,0.16)] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {opcionPastaEditando
                    ? <Pencil size={15} />
                    : <Plus size={15} />}

                  {guardandoOpcionPastaModal
                    ? 'Guardando...'
                    : opcionPastaEditando
                      ? 'Guardar cambios'
                      : 'Agregar opción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO INGREDIENTE EXTRA */}
      {mostrarModalIngrediente && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#11100f] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] bg-[#151311] px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-300/60">
                  Ingredientes de pizza
                </p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                  {ingredienteEditando
                    ? 'Editar ingrediente extra'
                    : 'Nuevo ingrediente extra'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-white/30">
                  {ingredienteEditando
                    ? 'Modifica el nombre, precio o disponibilidad del ingrediente.'
                    : 'El ingrediente quedará disponible para usarlo como extra en las pizzas.'}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalIngrediente}
                disabled={creandoIngrediente}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/35 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarIngredienteModal}>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    Nombre del ingrediente
                  </label>
                  <input
                    autoFocus
                    type="text"
                    maxLength={100}
                    value={nuevoIngredienteNombre}
                    onChange={(event) => {
                      setNuevoIngredienteNombre(event.target.value)
                      setErrorNuevoIngrediente('')
                    }}
                    placeholder="Ej. pepperoni, aceitunas, tocino..."
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-white/15 focus:border-rose-400/40 focus:bg-black/35 focus:ring-2 focus:ring-rose-400/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    Precio por unidad extra
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-black text-rose-300">
                      ₡
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={nuevoIngredientePrecio}
                      onChange={(event) => {
                        const valor = event.target.value.replace(/\D/g, '')
                        setNuevoIngredientePrecio(valor)
                        setErrorNuevoIngrediente('')
                      }}
                      placeholder="1500"
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-black/25 py-3 pl-10 pr-4 font-mono text-sm font-bold text-white outline-none transition placeholder:text-white/15 focus:border-rose-400/40 focus:bg-black/35 focus:ring-2 focus:ring-rose-400/10"
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-white/20">
                    Este monto se sumará al precio del producto cuando el cliente lo seleccione como extra.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                    {ingredienteEditando ? 'Estado' : 'Estado inicial'}
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoIngredienteEstado('disponible')}
                      className={`rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        nuevoIngredienteEstado === 'disponible'
                          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                          : 'border-white/[0.08] bg-white/[0.025] text-white/30 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      ✓ Disponible
                    </button>

                    <button
                      type="button"
                      onClick={() => setNuevoIngredienteEstado('agotado')}
                      className={`rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        nuevoIngredienteEstado === 'agotado'
                          ? 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                          : 'border-white/[0.08] bg-white/[0.025] text-white/30 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      × Agotado
                    </button>
                  </div>
                </div>

                {errorNuevoIngrediente && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-xs font-semibold text-rose-300">
                    {errorNuevoIngrediente}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-[#151311] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalIngrediente}
                  disabled={creandoIngrediente}
                  className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-xs font-bold text-white/35 transition hover:border-white/15 hover:bg-white/[0.04] hover:text-white/65 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creandoIngrediente}
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-[#E4002B] px-6 py-2.5 text-xs font-black text-white shadow-[0_10px_30px_rgba(228,0,43,0.18)] transition hover:bg-[#ff173e] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {ingredienteEditando
                    ? <Pencil size={15} />
                    : <Plus size={15} />}
                  {creandoIngrediente
                    ? 'Guardando...'
                    : ingredienteEditando
                      ? 'Guardar cambios'
                      : 'Agregar ingrediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-base font-bold text-white">Nuevo Usuario</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">Contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                  >
                    {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">Rol</label>
                <select
                  value={rol}
                  onChange={(event) => setRol(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                >
                  {ROLES.map((rolDisponible) => (
                    <option key={rolDisponible.value} value={rolDisponible.value}>
                      {rolDisponible.label}
                    </option>
                  ))}
                </select>
              </div>

              {errorForm && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
                  {errorForm}
                </div>
              )}

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500/80 to-cyan-600/80 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminDashboardHomeLayout>
  )
}

export default AdminDashboard