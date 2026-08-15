import { useState, useEffect } from 'react'
import api from '../../api/axios'
import {
  DollarSign,
  Store,
  Clock,
  User,
  CheckCircle2,
  CreditCard,
  Smartphone,
  XCircle,
  Plus,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Printer,
  X,
} from 'lucide-react'

function AdminCajaPanel({ compacto = false, onVerDetalle }) {
  const [estadoCaja, setEstadoCaja] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [historial, setHistorial] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [detalleHistorial, setDetalleHistorial] = useState(null)

  // Estados para apertura de caja
  const [mostrarFormApertura, setMostrarFormApertura] = useState(false)
  const [montoApertura, setMontoApertura] = useState('10000')
  const [usuarioAsignadoId, setUsuarioAsignadoId] = useState('')
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([])
  const [observacionesApertura, setObservacionesApertura] = useState('')
  const [abriendoCaja, setAbriendoCaja] = useState(false)
  const [mensajeApertura, setMensajeApertura] = useState(null)

  // Comprobante térmico de apertura
  const [mostrarComprobanteApertura, setMostrarComprobanteApertura] = useState(false)
  const [aperturaRecienCreada, setAperturaRecienCreada] = useState(null)

  // Comprobante térmico de cierre
  const [mostrarComprobanteCierre, setMostrarComprobanteCierre] = useState(false)
  const [cierreRecienRealizado, setCierreRecienRealizado] = useState(null)

  // Estados para cierre de caja
  const [mostrarCierre, setMostrarCierre] = useState(false)
  const [pasoCierre, setPasoCierre] = useState(1)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [resultadoArqueo, setResultadoArqueo] = useState(null)
  const [observacionesCierre, setObservacionesCierre] = useState('')
  const [errorCierre, setErrorCierre] = useState('')
  const [cerrandoCaja, setCerrandoCaja] = useState(false)
  const [previsualizandoCierre, setPrevisualizandoCierre] = useState(false)

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


  const formatearDuracion = (inicio, fin) => {
    if (!inicio || !fin) {
      return '—'
    }

    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)

    if (
      Number.isNaN(fechaInicio.getTime()) ||
      Number.isNaN(fechaFin.getTime())
    ) {
      return '—'
    }

    const minutosTotales = Math.max(
      0,
      Math.floor(
        (fechaFin.getTime() - fechaInicio.getTime()) /
          60000
      )
    )

    const horas = Math.floor(minutosTotales / 60)
    const minutos = minutosTotales % 60

    if (horas === 0) {
      return `${minutos} min`
    }

    return `${horas} h ${minutos} min`
  }

  const obtenerResultadoHistorial = (item) => {
    const resultado =
      item?.resumen?.resultado_arqueo ||
      item?.sesion?.resultado_arqueo ||
      null

    if (resultado === 'cuadrada') {
      return 'completo'
    }

    return resultado
  }

  const etiquetaResultadoHistorial = (item) => {
    const resultado = obtenerResultadoHistorial(item)

    if (resultado === 'completo') {
      return 'Completo'
    }

    if (resultado === 'faltante') {
      return 'Faltante'
    }

    if (resultado === 'sobrante') {
      return 'Sobrante'
    }

    return item?.sesion?.estado === 'abierta'
      ? 'En curso'
      : 'Sin arqueo'
  }

  const clasesResultadoHistorial = (item) => {
    const resultado = obtenerResultadoHistorial(item)

    if (resultado === 'completo') {
      return 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300'
    }

    if (resultado === 'faltante') {
      return 'border-rose-400/15 bg-rose-400/10 text-rose-300'
    }

    if (resultado === 'sobrante') {
      return 'border-amber-400/15 bg-amber-400/10 text-amber-300'
    }

    return 'border-white/10 bg-white/5 text-white/35'
  }

  const escaparHtml = (valor) =>
    String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')

  const imprimirComprobanteApertura = (estado = estadoCaja) => {
    const sesion = estado?.sesion
    const resumen = estado?.resumen || {}

    if (!sesion) {
      setMensajeApertura({
        tipo: 'error',
        texto: 'No hay información de apertura disponible para imprimir.',
      })
      return
    }

    const ventana = window.open(
      '',
      '_blank',
      'width=420,height=760'
    )

    if (!ventana) {
      setMensajeApertura({
        tipo: 'error',
        texto:
          'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e intenta de nuevo.',
      })
      return
    }

    const nombreApertura =
      sesion.usuario_apertura?.name ||
      sesion.usuarioApertura?.name ||
      '—'

    const nombreAsignado =
      sesion.usuario_asignado?.name ||
      sesion.usuarioAsignado?.name ||
      '—'

    const observaciones =
      sesion.observaciones_apertura ||
      'Sin observaciones.'

    ventana.document.open()
    ventana.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <title>
            Apertura de caja #${escaparHtml(sesion.id)}
          </title>

          <style>
            @page {
              size: 80mm auto;
              margin: 3mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
            }

            body {
              width: 74mm;
              margin: 0 auto;
              font-family:
                "Courier New",
                Courier,
                monospace;
              font-size: 10.5px;
              line-height: 1.35;
            }

            .ticket {
              width: 74mm;
              margin: 0 auto;
              padding: 2mm 0;
            }

            .centro {
              text-align: center;
            }

            .marca {
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 0.08em;
            }

            .subtitulo {
              margin-top: 2px;
              font-size: 10px;
              font-weight: 700;
            }

            .separador {
              margin: 8px 0;
              border-top: 1px dashed #000000;
            }

            .fila {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 4px 0;
            }

            .fila span:first-child {
              flex: 1 1 auto;
            }

            .fila strong {
              flex: 0 0 auto;
              max-width: 44mm;
              text-align: right;
              overflow-wrap: anywhere;
            }

            .fondo {
              margin: 8px 0;
              padding: 7px 0;
              border-top: 1px solid #000000;
              border-bottom: 1px solid #000000;
              font-size: 13px;
              font-weight: 900;
            }

            .observacion {
              margin-top: 5px;
              white-space: pre-wrap;
              overflow-wrap: anywhere;
            }

            .pie {
              margin-top: 10px;
              font-size: 9px;
            }

            @media print {
              html,
              body {
                width: 74mm;
              }

              .ticket {
                width: 74mm;
              }
            }
          </style>
        </head>

        <body>
          <main class="ticket">
            <div class="centro">
              <div class="marca">ROOSTER CR</div>
              <div class="subtitulo">
                COMPROBANTE DE APERTURA DE CAJA
              </div>
            </div>

            <div class="separador"></div>

            <div class="fila">
              <span>Turno:</span>
              <strong>#${escaparHtml(sesion.id)}</strong>
            </div>

            <div class="fila">
              <span>Fecha:</span>
              <strong>
                ${escaparHtml(
                  formatearFechaHora(
                    sesion.fecha_apertura
                  )
                )}
              </strong>
            </div>

            <div class="fila">
              <span>Abierta por:</span>
              <strong>${escaparHtml(nombreApertura)}</strong>
            </div>

            <div class="fila">
              <span>Asignada a:</span>
              <strong>${escaparHtml(nombreAsignado)}</strong>
            </div>

            <div class="fondo fila">
              <span>FONDO INICIAL:</span>
              <strong>
                ₡${escaparHtml(
                  formatearPrecio(
                    resumen.monto_inicial ??
                    sesion.monto_inicial
                  )
                )}
              </strong>
            </div>

            <div>
              <strong>Observaciones:</strong>
              <div class="observacion">
                ${escaparHtml(observaciones)}
              </div>
            </div>

            <div class="separador"></div>

            <div class="centro pie">
              Documento de control interno<br />
              Rooster CR
            </div>
          </main>
        </body>
      </html>
    `)

    ventana.document.close()
    ventana.focus()

    setTimeout(() => {
      ventana.print()
    }, 250)
  }

  const imprimirReporteCaja = (item) => {
    if (!item?.sesion) {
      return
    }

    const sesion = item.sesion
    const resumen = item.resumen || {}
    const movimientos = Array.isArray(item.movimientos)
      ? item.movimientos
      : []

    const ventana = window.open(
      '',
      '_blank',
      'width=420,height=860'
    )

    if (!ventana) {
      setMensajeApertura({
        tipo: 'error',
        texto:
          'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e intenta de nuevo.',
      })
      return
    }

    const nombreApertura =
      sesion.usuario_apertura?.name ||
      sesion.usuarioApertura?.name ||
      '—'

    const nombreAsignado =
      sesion.usuario_asignado?.name ||
      sesion.usuarioAsignado?.name ||
      '—'

    const nombreCierre =
      sesion.usuario_cierre?.name ||
      sesion.usuarioCierre?.name ||
      '—'

    const resultado =
      etiquetaResultadoHistorial(item)

    const diferencia =
      Number(
        resumen.diferencia ??
        sesion.diferencia ??
        0
      )

    const observaciones =
      sesion.observaciones ||
      sesion.detalle_diferencia ||
      'Sin observaciones.'

    const signoDiferencia =
      diferencia > 0
        ? '+'
        : ''

    const movimientosHtml =
      movimientos.length > 0
        ? movimientos
            .map((movimiento) => {
              const esEntrada =
                movimiento.tipo === 'entrada'

              return `
                <div class="movimiento">
                  <div class="movimiento-top">
                    <span>
                      ${escaparHtml(
                        esEntrada
                          ? 'ENTRADA'
                          : 'SALIDA'
                      )}
                    </span>
                    <strong>
                      ${esEntrada ? '+' : '-'}₡${escaparHtml(
                        formatearPrecio(
                          movimiento.monto
                        )
                      )}
                    </strong>
                  </div>

                  <div class="muted">
                    ${escaparHtml(
                      movimiento.motivo ||
                      'Sin motivo'
                    )}
                  </div>

                  <div class="muted">
                    ${escaparHtml(
                      formatearFechaHora(
                        movimiento.created_at
                      )
                    )}
                    ·
                    ${escaparHtml(
                      movimiento.usuario?.name ||
                      '—'
                    )}
                  </div>
                </div>
              `
            })
            .join('')
        : ''

    ventana.document.open()
    ventana.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>
            Cierre de caja #${escaparHtml(
              sesion.id
            )}
          </title>

          <style>
            @page {
              size: 80mm auto;
              margin: 3mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
            }

            body {
              width: 74mm;
              margin: 0 auto;
              font-family:
                "Courier New",
                Courier,
                monospace;
              font-size: 10px;
              line-height: 1.35;
            }

            .ticket {
              width: 74mm;
              margin: 0 auto;
              padding: 2mm 0;
            }

            .centro {
              text-align: center;
            }

            .marca {
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 0.08em;
            }

            .titulo {
              margin-top: 2px;
              font-size: 10px;
              font-weight: 900;
            }

            .separador {
              margin: 7px 0;
              border-top: 1px dashed #000000;
            }

            .separador-solido {
              margin: 7px 0;
              border-top: 1px solid #000000;
            }

            .seccion {
              margin-top: 8px;
            }

            .seccion-titulo {
              margin-bottom: 5px;
              font-size: 10px;
              font-weight: 900;
              text-align: center;
            }

            .fila {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 3px 0;
            }

            .fila > span:first-child {
              flex: 1 1 auto;
            }

            .fila > strong {
              flex: 0 0 auto;
              max-width: 44mm;
              text-align: right;
              overflow-wrap: anywhere;
            }

            .total {
              margin-top: 5px;
              padding-top: 5px;
              border-top: 1px solid #000000;
              font-size: 12px;
              font-weight: 900;
            }

            .arqueo {
              margin-top: 7px;
              padding: 6px 0;
              border-top: 1px solid #000000;
              border-bottom: 1px solid #000000;
            }

            .resultado {
              margin-top: 6px;
              text-align: center;
              font-size: 13px;
              font-weight: 900;
            }

            .observacion {
              margin-top: 4px;
              white-space: pre-wrap;
              overflow-wrap: anywhere;
            }

            .movimiento {
              padding: 5px 0;
              border-bottom: 1px dotted #777777;
            }

            .movimiento-top {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              font-weight: 900;
            }

            .muted {
              margin-top: 2px;
              font-size: 8.5px;
            }

            .pie {
              margin-top: 10px;
              font-size: 8.5px;
            }

            @media print {
              html,
              body,
              .ticket {
                width: 74mm;
              }
            }
          </style>
        </head>

        <body>
          <main class="ticket">
            <div class="centro">
              <div class="marca">
                ROOSTER CR
              </div>

              <div class="titulo">
                REPORTE DE CIERRE DE CAJA
              </div>
            </div>

            <div class="separador"></div>

            <div class="fila">
              <span>Turno:</span>
              <strong>
                #${escaparHtml(sesion.id)}
              </strong>
            </div>

            <div class="fila">
              <span>Apertura:</span>
              <strong>
                ${escaparHtml(
                  formatearFechaHora(
                    sesion.fecha_apertura
                  )
                )}
              </strong>
            </div>

            <div class="fila">
              <span>Cierre:</span>
              <strong>
                ${escaparHtml(
                  formatearFechaHora(
                    sesion.fecha_cierre
                  )
                )}
              </strong>
            </div>

            <div class="fila">
              <span>Duración:</span>
              <strong>
                ${escaparHtml(
                  formatearDuracion(
                    sesion.fecha_apertura,
                    sesion.fecha_cierre
                  )
                )}
              </strong>
            </div>

            <div class="separador"></div>

            <div class="fila">
              <span>Abierta por:</span>
              <strong>
                ${escaparHtml(nombreApertura)}
              </strong>
            </div>

            <div class="fila">
              <span>Asignada a:</span>
              <strong>
                ${escaparHtml(nombreAsignado)}
              </strong>
            </div>

            <div class="fila">
              <span>Cerrada por:</span>
              <strong>
                ${escaparHtml(nombreCierre)}
              </strong>
            </div>

            <div class="seccion">
              <div class="separador"></div>

              <div class="seccion-titulo">
                VENTAS DEL TURNO
              </div>

              <div class="fila">
                <span>Efectivo:</span>
                <strong>
                  ₡${escaparHtml(
                    formatearPrecio(
                      resumen.efectivo ??
                      sesion.ventas_efectivo
                    )
                  )}
                </strong>
              </div>

              <div class="fila">
                <span>SINPE Móvil:</span>
                <strong>
                  ₡${escaparHtml(
                    formatearPrecio(
                      resumen.sinpe ??
                      sesion.ventas_sinpe
                    )
                  )}
                </strong>
              </div>

              <div class="fila">
                <span>Datáfono:</span>
                <strong>
                  ₡${escaparHtml(
                    formatearPrecio(
                      resumen.tarjeta ??
                      sesion.ventas_tarjeta
                    )
                  )}
                </strong>
              </div>

              <div class="fila total">
                <span>TOTAL VENTAS:</span>
                <strong>
                  ₡${escaparHtml(
                    formatearPrecio(
                      resumen.total_ventas ??
                      sesion.total_ventas
                    )
                  )}
                </strong>
              </div>

              <div class="fila">
                <span>Pedidos cobrados:</span>
                <strong>
                  ${escaparHtml(
                    resumen.cantidad_pedidos ??
                    sesion.cantidad_pedidos ??
                    0
                  )}
                </strong>
              </div>
            </div>

            <div class="seccion">
              <div class="separador"></div>

              <div class="seccion-titulo">
                CONTROL DE EFECTIVO
              </div>

              <div class="fila">
                <span>Fondo inicial:</span>
                <strong>
                  ₡${escaparHtml(
                    formatearPrecio(
                      resumen.monto_inicial ??
                      sesion.monto_inicial
                    )
                  )}
                </strong>
              </div>

              <div class="fila">
                <span>Ventas efectivo:</span>
                <strong>
                  ₡${escaparHtml(
                    formatearPrecio(
                      resumen.efectivo ??
                      sesion.ventas_efectivo
                    )
                  )}
                </strong>
              </div>

              <div class="fila">
                <span>Entradas:</span>
                <strong>
                  +₡${escaparHtml(
                    formatearPrecio(
                      resumen.entradas_efectivo ??
                      sesion.entradas_efectivo
                    )
                  )}
                </strong>
              </div>

              <div class="fila">
                <span>Salidas:</span>
                <strong>
                  -₡${escaparHtml(
                    formatearPrecio(
                      resumen.salidas_efectivo ??
                      sesion.salidas_efectivo
                    )
                  )}
                </strong>
              </div>

              <div class="arqueo">
                <div class="fila">
                  <span>Esperado:</span>
                  <strong>
                    ₡${escaparHtml(
                      formatearPrecio(
                        resumen.efectivo_esperado ??
                        sesion.efectivo_esperado
                      )
                    )}
                  </strong>
                </div>

                <div class="fila">
                  <span>Contado:</span>
                  <strong>
                    ₡${escaparHtml(
                      formatearPrecio(
                        resumen.efectivo_contado ??
                        sesion.efectivo_contado
                      )
                    )}
                  </strong>
                </div>

                <div class="fila">
                  <span>Diferencia:</span>
                  <strong>
                    ${signoDiferencia}₡${escaparHtml(
                      formatearPrecio(
                        diferencia
                      )
                    )}
                  </strong>
                </div>

                <div class="resultado">
                  ${escaparHtml(
                    String(resultado).toUpperCase()
                  )}
                </div>
              </div>
            </div>

            ${
              movimientos.length > 0
                ? `
                  <div class="seccion">
                    <div class="separador"></div>

                    <div class="seccion-titulo">
                      MOVIMIENTOS MANUALES
                    </div>

                    ${movimientosHtml}
                  </div>
                `
                : ''
            }

            <div class="seccion">
              <div class="separador"></div>

              <div class="seccion-titulo">
                OBSERVACIONES
              </div>

              <div class="observacion">
                ${escaparHtml(observaciones)}
              </div>
            </div>

            <div class="separador"></div>

            <div class="centro pie">
              Reporte de control interno<br />
              Rooster CR
            </div>
          </main>
        </body>
      </html>
    `)

    ventana.document.close()
    ventana.focus()

    setTimeout(() => {
      ventana.print()
    }, 250)
  }

  const cargarEstadoCaja = async () => {
    setCargando(true)
    setError('')
    try {
      const response = await api.get('/caja/actual')
      setEstadoCaja(response.data)
    } catch (err) {
      console.error('Error cargando estado de caja:', err)
      setError(err.response?.data?.message || 'No se pudo cargar el estado de la caja.')
    } finally {
      setCargando(false)
    }
  }

  const cargarUsuariosDisponibles = async () => {
    try {
      const response = await api.get('/users')
      const usuarios = response.data.filter(
        (user) => (user.rol === 'admin' || user.rol === 'caja') && user.estado === 'activo'
      )
      setUsuariosDisponibles(usuarios)
      // 🔥 CORREGIDO: Seleccionar el primer usuario por defecto
      if (usuarios.length > 0) {
        setUsuarioAsignadoId(String(usuarios[0].id))
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    }
  }

  const cargarHistorial = async () => {
    setCargandoHistorial(true)
    try {
      const response = await api.get('/admin/caja/historial?limit=20')
      setHistorial(response.data.data || [])
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setCargandoHistorial(false)
    }
  }

  useEffect(() => {
    cargarEstadoCaja()
    cargarUsuariosDisponibles()
  }, [])

  const abrirCaja = async (event) => {
    event.preventDefault()

    const monto = Number(montoApertura)

    if (!Number.isFinite(monto) || monto < 0) {
      setMensajeApertura({
        tipo: 'error',
        texto: 'Ingresa un monto inicial válido.',
      })
      return
    }

    if (!usuarioAsignadoId) {
      setMensajeApertura({
        tipo: 'error',
        texto: 'Selecciona un usuario para asignar la caja.',
      })
      return
    }

    setAbriendoCaja(true)
    setMensajeApertura(null)

    try {
      const response = await api.post('/caja/abrir', {
        monto_inicial: monto,
        usuario_asignado_id: Number(usuarioAsignadoId),
        observaciones_apertura: observacionesApertura.trim() || null,
      })

      const estadoAbierto = response.data

      setEstadoCaja(estadoAbierto)
      setAperturaRecienCreada(estadoAbierto)
      setMostrarComprobanteApertura(true)
      setObservacionesApertura('')
      setMostrarFormApertura(false)

      const usuarioAsignado = usuariosDisponibles.find(
        (user) =>
          user.id === Number(usuarioAsignadoId)
      )

      setMensajeApertura({
        tipo: 'exito',
        texto: `Caja abierta con ₡${formatearPrecio(monto)}. Asignada a ${usuarioAsignado?.name || 'usuario'}.`,
      })

      setTimeout(() => setMensajeApertura(null), 5000)
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().find(Boolean)
        : null

      setMensajeApertura({
        tipo: 'error',
        texto: primerError || err.response?.data?.message || 'No se pudo abrir la caja.',
      })
    } finally {
      setAbriendoCaja(false)
    }
  }

  const iniciarCierre = () => {
    setPasoCierre(1)
    setEfectivoContado('')
    setResultadoArqueo(null)
    setObservacionesCierre('')
    setErrorCierre('')
    setMostrarCierre(true)
  }

  const cerrarModalCierre = () => {
    if (cerrandoCaja || previsualizandoCierre) return
    setMostrarCierre(false)
    setPasoCierre(1)
    setEfectivoContado('')
    setResultadoArqueo(null)
    setObservacionesCierre('')
    setErrorCierre('')
  }

  const previsualizarCierre = async () => {
    const contado = Number(efectivoContado)

    if (!Number.isFinite(contado) || contado < 0) {
      setErrorCierre('Ingresa el efectivo que contaste físicamente en la gaveta.')
      return
    }

    setPrevisualizandoCierre(true)
    setErrorCierre('')

    try {
      const response = await api.post('/caja/arqueo', {
        efectivo_contado: contado,
      })

      setResultadoArqueo(response.data)
      setPasoCierre(3)
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().find(Boolean)
        : null

      setErrorCierre(primerError || err.response?.data?.message || 'No se pudo realizar el arqueo.')
    } finally {
      setPrevisualizandoCierre(false)
    }
  }

  const confirmarCierre = async () => {
    if (!resultadoArqueo) {
      setErrorCierre('Primero debes realizar el conteo y comparar el arqueo.')
      return
    }

    const resultadoAutomatico =
      resultadoArqueo.resultado === 'cuadrada'
        ? 'completo'
        : resultadoArqueo.resultado

    if (!['completo', 'faltante', 'sobrante'].includes(resultadoAutomatico)) {
      setErrorCierre('No se pudo determinar automáticamente el resultado del arqueo.')
      return
    }

    if (
      resultadoAutomatico !== 'completo' &&
      !observacionesCierre.trim()
    ) {
      setErrorCierre(
        'Debes agregar una observación cuando exista un faltante o sobrante.'
      )
      return
    }

    setCerrandoCaja(true)
    setErrorCierre('')

    try {
      const response = await api.post('/caja/cerrar', {
        efectivo_contado: Number(efectivoContado),
        efectivo_esperado_previsualizado:
          Number(resultadoArqueo.efectivo_esperado),
        observaciones:
          observacionesCierre.trim() || null,
      })

      const cierreRealizado = {
        sesion: response.data.sesion,
        resumen: response.data.resumen || {},
        movimientos: [],
      }

      setCierreRecienRealizado(cierreRealizado)
      setMostrarComprobanteCierre(true)

      setMostrarCierre(false)
      setPasoCierre(1)
      setEfectivoContado('')
      setResultadoArqueo(null)
      setObservacionesCierre('')
      setErrorCierre('')

      await cargarEstadoCaja()

      /*
       * Actualiza el historial si estaba abierto para que el
       * cierre recién hecho aparezca inmediatamente.
       */
      if (mostrarHistorial) {
        await cargarHistorial()
      }

      setMensajeApertura({
        tipo: 'exito',
        texto: 'Caja cerrada correctamente.',
      })

      setTimeout(
        () => setMensajeApertura(null),
        5000
      )
    } catch (err) {
      const primerError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)
            .flat()
            .find(Boolean)
        : null

      const mensajeError =
        primerError ||
        err.response?.data?.message ||
        'No se pudo cerrar la caja.'

      setErrorCierre(mensajeError)

      if (err.response?.status === 409) {
        setResultadoArqueo(null)
        setPasoCierre(2)
      }
    } finally {
      setCerrandoCaja(false)
    }
  }

  const resultadoAutomatico =
    resultadoArqueo?.resultado === 'cuadrada'
      ? 'completo'
      : resultadoArqueo?.resultado || null

  const diferenciaArqueo =
    Number(resultadoArqueo?.diferencia) || 0

  const diferenciaAbsoluta =
    Math.abs(diferenciaArqueo)

  const configuracionResultado =
    resultadoAutomatico === 'faltante'
      ? {
          titulo: 'Faltante',
          descripcion: `Faltan ₡${formatearPrecio(diferenciaAbsoluta)} en caja.`,
          icono: XCircle,
          contenedor:
            'border-rose-400/20 bg-rose-400/10',
          texto: 'text-rose-300',
        }
      : resultadoAutomatico === 'sobrante'
        ? {
            titulo: 'Sobrante',
            descripcion: `Sobran ₡${formatearPrecio(diferenciaAbsoluta)} en caja.`,
            icono: AlertCircle,
            contenedor:
              'border-amber-400/20 bg-amber-400/10',
            texto: 'text-amber-300',
          }
        : {
            titulo: 'Completo',
            descripcion: 'La caja está cuadrada. No existe diferencia.',
            icono: CheckCircle2,
            contenedor:
              'border-emerald-400/20 bg-emerald-400/10',
            texto: 'text-emerald-300',
          }


  // Si está en modo compacto (dashboard principal)
  if (compacto) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A300]/10 text-[#F5A300]">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Control de caja</h3>
              <p className="text-xs text-white/30">
                {cargando ? 'Cargando...' : estadoCaja?.abierta ? 'Caja abierta' : 'Caja cerrada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onVerDetalle || (() => { })}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/40 transition hover:border-white/20 hover:text-white/70"
          >
            Ver detalle
          </button>
        </div>

        {estadoCaja?.abierta && estadoCaja?.sesion && (
          <div className="mt-3 rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-white/30">Turno</p>
                <p className="font-bold text-white">#{estadoCaja.sesion.id}</p>
              </div>
              <div>
                <p className="text-white/30">Asignado a</p>
                <p className="font-bold text-white/80">{estadoCaja.sesion.usuario_asignado?.name || estadoCaja.sesion.usuarioAsignado?.name || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/30">Fondo inicial</p>
                <p className="font-mono font-bold text-[#F5A300]">₡{formatearPrecio(estadoCaja.resumen?.monto_inicial)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Vista completa
  return (
    <div className="space-y-6">
      {/* Mensajes */}
      {mensajeApertura && (
        <div
          className={`fade-in mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${mensajeApertura.tipo === 'exito'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${mensajeApertura.tipo === 'exito' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
          />
          {mensajeApertura.texto}
        </div>
      )}

      {/* Estado actual de la caja */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${estadoCaja?.abierta ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'
              }`}>
              {estadoCaja?.abierta ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {estadoCaja?.abierta ? 'Caja abierta' : 'Caja cerrada'}
              </h3>
              <p className="text-sm text-white/30">
                {estadoCaja?.abierta
                  ? `Turno #${estadoCaja.sesion?.id} · Inicio: ${formatearFechaHora(estadoCaja.sesion?.fecha_apertura)}`
                  : 'No hay una caja abierta actualmente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cargarEstadoCaja}
            disabled={cargando}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {estadoCaja?.abierta && estadoCaja?.sesion && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Abierta por</p>
              <p className="mt-1 font-bold text-white/80">{estadoCaja.sesion.usuario_apertura?.name || estadoCaja.sesion.usuarioApertura?.name || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Asignada a</p>
              <p className="mt-1 font-bold text-[#F5A300]">{estadoCaja.sesion.usuario_asignado?.name || estadoCaja.sesion.usuarioAsignado?.name || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Fondo inicial</p>
              <p className="mt-1 font-mono font-bold text-white">₡{formatearPrecio(estadoCaja.resumen?.monto_inicial)}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total ventas</p>
              <p className="mt-1 font-mono font-bold text-emerald-300">₡{formatearPrecio(estadoCaja.resumen?.total_ventas)}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {estadoCaja?.abierta ? (
            <>
              <button
                type="button"
                onClick={() => setMostrarFormApertura(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/40 transition hover:border-white/20 hover:text-white/70"
                disabled
              >
                Caja ya abierta
              </button>
              <button
                type="button"
                onClick={() =>
                  imprimirComprobanteApertura(
                    estadoCaja
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[#F5A300]/20 bg-[#F5A300]/10 px-4 py-2 text-sm font-black text-[#F5A300] transition hover:bg-[#F5A300]/20"
              >
                <Printer size={15} />
                Imprimir apertura
              </button>

              <button
                type="button"
                onClick={iniciarCierre}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-400"
              >
                🔒 Cerrar caja
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMostrarFormApertura(!mostrarFormApertura)
                cargarUsuariosDisponibles()
              }}
              className="rounded-xl bg-[#F5A300] px-4 py-2 text-sm font-black text-black transition hover:bg-[#ffb72b]"
            >
              <Plus size={16} className="inline mr-1" />
              Abrir caja
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMostrarHistorial(!mostrarHistorial)
              if (!mostrarHistorial) cargarHistorial()
            }}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/40 transition hover:border-white/20 hover:text-white/70"
          >
            {mostrarHistorial ? <ChevronUp size={16} className="inline mr-1" /> : <ChevronDown size={16} className="inline mr-1" />}
            Historial
          </button>
        </div>
      </div>

      {/* Formulario de apertura de caja */}
      {mostrarFormApertura && !estadoCaja?.abierta && (
        <div className="glass-card rounded-2xl p-6 border border-[#F5A300]/20">
          <h3 className="text-lg font-black text-white mb-4">Apertura de caja</h3>
          <form onSubmit={abrirCaja} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Fondo inicial
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-black text-[#F5A300]">
                    ₡
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="input-modern w-full rounded-xl px-4 pl-10 py-3.5 font-mono text-2xl font-black text-white placeholder:text-white/5"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Asignar caja a
                </label>
                <select
                  value={usuarioAsignadoId}
                  onChange={(e) => setUsuarioAsignadoId(e.target.value)}
                  className="input-modern mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white bg-[#141210]"
                  required
                >
                  <option value="" className="bg-[#141210] text-white">
                    Selecciona un usuario
                  </option>

                  {usuariosDisponibles.map((user) => (
                    <option
                      key={user.id}
                      value={String(user.id)}
                      className="bg-[#141210] text-white"
                    >
                      {user.name} ({user.rol === 'admin' ? 'Administrador' : 'Caja'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Observación
                </label>
                <span className="text-[9px] text-white/10">Opcional</span>
              </div>
              <textarea
                rows="2"
                value={observacionesApertura}
                onChange={(e) => setObservacionesApertura(e.target.value)}
                className="input-modern mt-1.5 w-full resize-none rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/10"
                placeholder="Ej. Fondo entregado por administración..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={abriendoCaja}
                className="flex-1 rounded-xl bg-[#F5A300] py-3 text-sm font-black text-black transition hover:bg-[#ffb72b] disabled:opacity-40"
              >
                {abriendoCaja ? 'Abriendo...' : '✅ Abrir caja'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormApertura(false)}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/30 transition hover:bg-white/5 hover:text-white/60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: COMPROBANTE TÉRMICO DE CIERRE */}
      {mostrarComprobanteCierre &&
        cierreRecienRealizado?.sesion && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#11100f] shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
              <div className="border-b border-white/[0.07] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300/60">
                      Cierre completado
                    </p>

                    <h3 className="mt-1 text-xl font-black text-white">
                      Caja cerrada correctamente
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-white/30">
                      Puedes imprimir ahora el reporte de cierre en formato térmico de 80 mm.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 font-mono text-xs">
                  <div className="text-center">
                    <p className="text-base font-black tracking-wider text-white">
                      ROOSTER CR
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-white/35">
                      REPORTE DE CIERRE
                    </p>
                  </div>

                  <div className="my-4 border-t border-dashed border-white/15" />

                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Turno
                      </span>

                      <span className="font-bold text-white">
                        #{cierreRecienRealizado.sesion.id}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Total ventas
                      </span>

                      <span className="font-bold text-emerald-300">
                        ₡{formatearPrecio(
                          cierreRecienRealizado.resumen
                            ?.total_ventas ??
                          cierreRecienRealizado.sesion
                            .total_ventas
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Efectivo
                      </span>

                      <span className="font-bold text-white/70">
                        ₡{formatearPrecio(
                          cierreRecienRealizado.resumen
                            ?.efectivo ??
                          cierreRecienRealizado.sesion
                            .ventas_efectivo
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        SINPE
                      </span>

                      <span className="font-bold text-white/70">
                        ₡{formatearPrecio(
                          cierreRecienRealizado.resumen
                            ?.sinpe ??
                          cierreRecienRealizado.sesion
                            .ventas_sinpe
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Datáfono
                      </span>

                      <span className="font-bold text-white/70">
                        ₡{formatearPrecio(
                          cierreRecienRealizado.resumen
                            ?.tarjeta ??
                          cierreRecienRealizado.sesion
                            .ventas_tarjeta
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="my-4 border-t border-dashed border-white/15" />

                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Esperado
                      </span>

                      <span className="font-bold text-white">
                        ₡{formatearPrecio(
                          cierreRecienRealizado.resumen
                            ?.efectivo_esperado ??
                          cierreRecienRealizado.sesion
                            .efectivo_esperado
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Contado
                      </span>

                      <span className="font-bold text-white">
                        ₡{formatearPrecio(
                          cierreRecienRealizado.resumen
                            ?.efectivo_contado ??
                          cierreRecienRealizado.sesion
                            .efectivo_contado
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Resultado
                      </span>

                      <span className={`font-black uppercase ${
                        (
                          cierreRecienRealizado.resumen
                            ?.resultado_arqueo ||
                          cierreRecienRealizado.sesion
                            .resultado_arqueo
                        ) === 'completo'
                          ? 'text-emerald-300'
                          : (
                              cierreRecienRealizado.resumen
                                ?.resultado_arqueo ||
                              cierreRecienRealizado.sesion
                                .resultado_arqueo
                            ) === 'faltante'
                            ? 'text-rose-300'
                            : 'text-amber-300'
                      }`}>
                        {(
                          cierreRecienRealizado.resumen
                            ?.resultado_arqueo ||
                          cierreRecienRealizado.sesion
                            .resultado_arqueo ||
                          '—'
                        ).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[#F5A300]/15 bg-[#F5A300]/[0.06] px-4 py-3">
                  <div className="flex gap-3">
                    <Printer
                      size={17}
                      className="mt-0.5 shrink-0 text-[#F5A300]"
                    />

                    <div>
                      <p className="text-xs font-bold text-white/70">
                        Reporte térmico de cierre
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-white/25">
                        Incluye ventas por método de pago, arqueo, responsables y observaciones. Está optimizado para rollo de 80 mm.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-[#151311] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarComprobanteCierre(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-white/35 transition hover:bg-white/5 hover:text-white/65"
                >
                  Continuar sin imprimir
                </button>

                <button
                  type="button"
                  onClick={() =>
                    imprimirReporteCaja(
                      cierreRecienRealizado
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A300] px-6 py-2.5 text-xs font-black text-black transition hover:bg-[#ffb72b]"
                >
                  <Printer size={15} />
                  Imprimir cierre
                </button>
              </div>
            </div>
          </div>
        )}

      {/* MODAL: COMPROBANTE TÉRMICO DE APERTURA */}
      {mostrarComprobanteApertura &&
        aperturaRecienCreada?.sesion && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#11100f] shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
              <div className="border-b border-white/[0.07] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300/60">
                      Apertura completada
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      Caja abierta correctamente
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-white/30">
                      Puedes imprimir ahora el comprobante de apertura en formato térmico de 80 mm.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 font-mono text-xs">
                  <div className="text-center">
                    <p className="text-base font-black tracking-wider text-white">
                      ROOSTER CR
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-white/35">
                      COMPROBANTE DE APERTURA
                    </p>
                  </div>

                  <div className="my-4 border-t border-dashed border-white/15" />

                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">Turno</span>
                      <span className="font-bold text-white">
                        #{aperturaRecienCreada.sesion.id}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Apertura
                      </span>
                      <span className="text-right font-bold text-white/70">
                        {formatearFechaHora(
                          aperturaRecienCreada.sesion
                            .fecha_apertura
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Abierta por
                      </span>
                      <span className="text-right font-bold text-white/70">
                        {aperturaRecienCreada.sesion
                          .usuario_apertura?.name ||
                          aperturaRecienCreada.sesion
                            .usuarioApertura?.name ||
                          '—'}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-white/30">
                        Asignada a
                      </span>
                      <span className="text-right font-bold text-[#F5A300]">
                        {aperturaRecienCreada.sesion
                          .usuario_asignado?.name ||
                          aperturaRecienCreada.sesion
                            .usuarioAsignado?.name ||
                          '—'}
                      </span>
                    </div>
                  </div>

                  <div className="my-4 border-t border-dashed border-white/15" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-black text-white/55">
                      FONDO INICIAL
                    </span>
                    <span className="text-lg font-black text-white">
                      ₡{formatearPrecio(
                        aperturaRecienCreada.resumen
                          ?.monto_inicial ??
                        aperturaRecienCreada.sesion
                          .monto_inicial
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[#F5A300]/15 bg-[#F5A300]/[0.06] px-4 py-3">
                  <div className="flex gap-3">
                    <Printer
                      size={17}
                      className="mt-0.5 shrink-0 text-[#F5A300]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white/70">
                        Impresión térmica
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/25">
                        El diseño está optimizado para rollo de 80 mm. En el diálogo de impresión selecciona tu impresora térmica y usa escala 100%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-[#151311] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarComprobanteApertura(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-white/35 transition hover:bg-white/5 hover:text-white/65"
                >
                  Continuar sin imprimir
                </button>

                <button
                  type="button"
                  onClick={() =>
                    imprimirComprobanteApertura(
                      aperturaRecienCreada
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A300] px-6 py-2.5 text-xs font-black text-black transition hover:bg-[#ffb72b]"
                >
                  <Printer size={15} />
                  Imprimir apertura
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Historial de cajas */}
      {mostrarHistorial && (
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5A300]/55">
                Auditoría de turnos
              </p>
              <h3 className="mt-1 text-lg font-black text-white">
                Historial de cajas
              </h3>
              <p className="mt-1 text-xs text-white/25">
                Revisa ventas, responsables y resultado del arqueo de cada turno.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarHistorial}
              disabled={cargandoHistorial}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  cargandoHistorial
                    ? 'animate-spin'
                    : ''
                }
              />
              Actualizar historial
            </button>
          </div>

          {cargandoHistorial ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/5 border-t-[#F5A300]" />
            </div>
          ) : historial.length === 0 ? (
            <p className="text-center text-sm text-white/30">
              No hay registros de caja.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Turno
                    </th>
                    <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Apertura / cierre
                    </th>
                    <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Asignada a
                    </th>
                    <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Fondo
                    </th>
                    <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Ventas
                    </th>
                    <th className="px-3 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Pedidos
                    </th>
                    <th className="px-3 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Arqueo
                    </th>
                    <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-wider text-white/25">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {historial.map((item) => {
                    const sesion = item.sesion
                    const resumen = item.resumen || {}

                    const asignadaA =
                      sesion.usuario_asignado?.name ||
                      sesion.usuarioAsignado?.name ||
                      '—'

                    return (
                      <tr
                        key={sesion.id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-3 py-3">
                          <p className="font-mono text-xs font-black text-white/70">
                            #{sesion.id}
                          </p>
                          <p className="mt-0.5 text-[9px] text-white/20">
                            {sesion.estado === 'abierta'
                              ? 'Turno activo'
                              : formatearDuracion(
                                  sesion.fecha_apertura,
                                  sesion.fecha_cierre
                                )}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-[11px] font-semibold text-white/55">
                            {formatearFechaHora(
                              sesion.fecha_apertura
                            )}
                          </p>
                          <p className="mt-0.5 text-[9px] text-white/22">
                            Cierre:{' '}
                            {sesion.fecha_cierre
                              ? formatearFechaHora(
                                  sesion.fecha_cierre
                                )
                              : 'En curso'}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="max-w-[140px] truncate text-[11px] font-semibold text-white/55">
                            {asignadaA}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-right font-mono text-[11px] font-bold text-white/45">
                          ₡{formatearPrecio(
                            resumen.monto_inicial
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <p className="font-mono text-xs font-black text-emerald-300">
                            ₡{formatearPrecio(
                              resumen.total_ventas
                            )}
                          </p>
                          <p className="mt-0.5 text-[9px] text-white/20">
                            Efectivo ₡{formatearPrecio(
                              resumen.efectivo
                            )}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-white/5 px-2 py-1 font-mono text-[10px] font-bold text-white/45">
                            {resumen.cantidad_pedidos || 0}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${clasesResultadoHistorial(
                              item
                            )}`}
                          >
                            {etiquetaResultadoHistorial(
                              item
                            )}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setDetalleHistorial(item)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/45 transition hover:border-white/20 hover:bg-white/5 hover:text-white/75"
                            >
                              <FileText size={12} />
                              Ver detalle
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                imprimirReporteCaja(item)
                              }
                              disabled={
                                sesion.estado !== 'cerrada'
                              }
                              title={
                                sesion.estado !== 'cerrada'
                                  ? 'El reporte final estará disponible cuando se cierre la caja.'
                                  : 'Imprimir reporte térmico'
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F5A300]/15 bg-[#F5A300]/5 px-2.5 py-1.5 text-[10px] font-black text-[#F5A300] transition hover:border-[#F5A300]/30 hover:bg-[#F5A300]/10 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Printer size={12} />
                              Imprimir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detalle de un cierre del historial */}
      {detalleHistorial && (
        <div className="fixed inset-0 z-[10020] overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0f0d0b] shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#F5A300]/55">
                    Historial de caja
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-white">
                      Cierre de caja #{detalleHistorial.sesion.id}
                    </h2>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${clasesResultadoHistorial(
                        detalleHistorial
                      )}`}
                    >
                      {etiquetaResultadoHistorial(
                        detalleHistorial
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDetalleHistorial(null)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] text-white/30 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[74vh] overflow-y-auto p-6 custom-pos-scrollbar">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 lg:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                      Información del turno
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        [
                          'Abierta por',
                          detalleHistorial.sesion
                            .usuario_apertura?.name ||
                            detalleHistorial.sesion
                              .usuarioApertura?.name ||
                            '—',
                        ],
                        [
                          'Asignada a',
                          detalleHistorial.sesion
                            .usuario_asignado?.name ||
                            detalleHistorial.sesion
                              .usuarioAsignado?.name ||
                            '—',
                        ],
                        [
                          'Cerrada por',
                          detalleHistorial.sesion
                            .usuario_cierre?.name ||
                            detalleHistorial.sesion
                              .usuarioCierre?.name ||
                            '—',
                        ],
                        [
                          'Apertura',
                          formatearFechaHora(
                            detalleHistorial.sesion
                              .fecha_apertura
                          ),
                        ],
                        [
                          'Cierre',
                          formatearFechaHora(
                            detalleHistorial.sesion
                              .fecha_cierre
                          ),
                        ],
                        [
                          'Duración',
                          formatearDuracion(
                            detalleHistorial.sesion
                              .fecha_apertura,
                            detalleHistorial.sesion
                              .fecha_cierre
                          ),
                        ],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                            {label}
                          </p>
                          <p className="mt-1 text-xs font-bold text-white/65">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#F5A300]/10 bg-[#F5A300]/[0.035] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F5A300]/50">
                      Total del turno
                    </p>

                    <p className="mt-2 font-mono text-3xl font-black text-white">
                      ₡{formatearPrecio(
                        detalleHistorial.resumen
                          ?.total_ventas
                      )}
                    </p>

                    <p className="mt-2 text-[10px] text-white/25">
                      {detalleHistorial.resumen
                        ?.cantidad_pedidos || 0}{' '}
                      pedidos cobrados
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                      Ventas por método de pago
                    </p>

                    <div className="mt-4 space-y-3">
                      {[
                        [
                          'Efectivo',
                          detalleHistorial.resumen
                            ?.efectivo,
                        ],
                        [
                          'SINPE Móvil',
                          detalleHistorial.resumen
                            ?.sinpe,
                        ],
                        [
                          'Datáfono',
                          detalleHistorial.resumen
                            ?.tarjeta,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"
                        >
                          <span className="text-xs font-semibold text-white/35">
                            {label}
                          </span>
                          <span className="font-mono text-sm font-black text-white/70">
                            ₡{formatearPrecio(value)}
                          </span>
                        </div>
                      ))}

                      <div className="flex items-center justify-between border-t border-white/[0.06] px-1 pt-3">
                        <span className="text-xs font-black text-white/45">
                          Total ventas
                        </span>
                        <span className="font-mono text-base font-black text-emerald-300">
                          ₡{formatearPrecio(
                            detalleHistorial.resumen
                              ?.total_ventas
                          )}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                      Control de efectivo
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        [
                          'Fondo inicial',
                          detalleHistorial.resumen
                            ?.monto_inicial,
                        ],
                        [
                          'Entradas',
                          detalleHistorial.resumen
                            ?.entradas_efectivo,
                        ],
                        [
                          'Salidas',
                          detalleHistorial.resumen
                            ?.salidas_efectivo,
                        ],
                        [
                          'Esperado',
                          detalleHistorial.resumen
                            ?.efectivo_esperado,
                        ],
                        [
                          'Contado',
                          detalleHistorial.resumen
                            ?.efectivo_contado,
                        ],
                        [
                          'Diferencia',
                          detalleHistorial.resumen
                            ?.diferencia,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl bg-black/20 p-3"
                        >
                          <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                            {label}
                          </p>

                          <p
                            className={`mt-1 font-mono text-sm font-black ${
                              label === 'Diferencia' &&
                              Number(value) < 0
                                ? 'text-rose-300'
                                : label ===
                                      'Diferencia' &&
                                    Number(value) > 0
                                  ? 'text-amber-300'
                                  : 'text-white/65'
                            }`}
                          >
                            {value === null ||
                            value === undefined
                              ? '—'
                              : `${
                                  label ===
                                    'Diferencia' &&
                                  Number(value) > 0
                                    ? '+'
                                    : ''
                                }₡${formatearPrecio(
                                  value
                                )}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                        Resultado del arqueo
                      </p>
                      <p className="mt-1 text-sm font-black text-white/70">
                        {etiquetaResultadoHistorial(
                          detalleHistorial
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${clasesResultadoHistorial(
                        detalleHistorial
                      )}`}
                    >
                      {Number(
                        detalleHistorial.resumen
                          ?.diferencia
                      ) > 0
                        ? '+'
                        : ''}
                      ₡{formatearPrecio(
                        detalleHistorial.resumen
                          ?.diferencia
                      )}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-black/20 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                      Observaciones
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-white/45">
                      {detalleHistorial.sesion
                        .observaciones ||
                        detalleHistorial.sesion
                          .detalle_diferencia ||
                        'Sin observaciones.'}
                    </p>
                  </div>
                </section>

                <section className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                        Movimientos manuales
                      </p>
                      <p className="mt-1 text-[10px] text-white/20">
                        Entradas y salidas registradas durante este turno.
                      </p>
                    </div>

                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold text-white/30">
                      {Array.isArray(
                        detalleHistorial.movimientos
                      )
                        ? detalleHistorial.movimientos
                            .length
                        : 0}{' '}
                      movimientos
                    </span>
                  </div>

                  {Array.isArray(
                    detalleHistorial.movimientos
                  ) &&
                  detalleHistorial.movimientos.length >
                    0 ? (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[650px] text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-white/20">
                              Fecha
                            </th>
                            <th className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-white/20">
                              Tipo
                            </th>
                            <th className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-white/20">
                              Motivo
                            </th>
                            <th className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-white/20">
                              Usuario
                            </th>
                            <th className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-wide text-white/20">
                              Monto
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.04]">
                          {detalleHistorial.movimientos.map(
                            (movimiento) => (
                              <tr key={movimiento.id}>
                                <td className="px-2 py-2.5 text-white/35">
                                  {formatearFechaHora(
                                    movimiento.created_at
                                  )}
                                </td>
                                <td className="px-2 py-2.5">
                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                                      movimiento.tipo ===
                                      'entrada'
                                        ? 'bg-emerald-400/10 text-emerald-300'
                                        : 'bg-rose-400/10 text-rose-300'
                                    }`}
                                  >
                                    {movimiento.tipo}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-white/45">
                                  {movimiento.motivo ||
                                    '—'}
                                </td>
                                <td className="px-2 py-2.5 text-white/35">
                                  {movimiento.usuario
                                    ?.name || '—'}
                                </td>
                                <td
                                  className={`px-2 py-2.5 text-right font-mono font-black ${
                                    movimiento.tipo ===
                                    'entrada'
                                      ? 'text-emerald-300'
                                      : 'text-rose-300'
                                  }`}
                                >
                                  {movimiento.tipo ===
                                  'entrada'
                                    ? '+'
                                    : '-'}
                                  ₡{formatearPrecio(
                                    movimiento.monto
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-white/[0.07] px-4 py-6 text-center text-xs text-white/25">
                      No se registraron movimientos manuales en este turno.
                    </div>
                  )}
                </section>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setDetalleHistorial(null)
                  }
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-white/35 transition hover:bg-white/5 hover:text-white/60"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    imprimirReporteCaja(
                      detalleHistorial
                    )
                  }
                  disabled={
                    detalleHistorial.sesion.estado !==
                    'cerrada'
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A300] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#ffb72b] disabled:opacity-40"
                >
                  <Printer size={14} />
                  Imprimir reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cierre de caja */}
      {mostrarCierre && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/5 bg-[#0f0d0b] shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300/50">Cierre de turno</p>
                  <h2 className="text-xl font-black text-white">Arqueo de caja</h2>
                </div>
                <button
                  onClick={cerrarModalCierre}
                  disabled={cerrandoCaja || previsualizandoCierre}
                  className="text-white/20 transition hover:text-white disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-white/5 px-6 py-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition ${pasoCierre >= step ? 'bg-[#F5A300] text-black' : 'bg-white/5 text-white/20'
                          }`}
                      >
                        {pasoCierre > step ? <CheckCircle2 size={14} /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`h-0.5 w-8 transition ${pasoCierre > step ? 'bg-[#F5A300]' : 'bg-white/5'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {errorCierre && (
                <div className="mx-6 mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
                  {errorCierre}
                </div>
              )}

              {/* Paso 1: Resumen */}
              {pasoCierre === 1 && (
                <div className="p-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">
                      Ventas del turno
                    </p>
                    <h3 className="mt-1 text-lg font-black text-white">
                      Totales por método de pago
                    </h3>
                    <p className="mt-1 text-xs text-white/30">
                      Estos montos corresponden únicamente a pagos confirmados durante el turno.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                        <DollarSign size={17} />
                      </div>
                      <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-white/25">
                        Efectivo
                      </p>
                      <p className="mt-1 font-mono text-xl font-black text-white">
                        ₡{formatearPrecio(estadoCaja.resumen?.efectivo)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-sky-400/10 bg-sky-400/5 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                        <Smartphone size={17} />
                      </div>
                      <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-white/25">
                        SINPE Móvil
                      </p>
                      <p className="mt-1 font-mono text-xl font-black text-white">
                        ₡{formatearPrecio(estadoCaja.resumen?.sinpe)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/10 bg-violet-400/5 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                        <CreditCard size={17} />
                      </div>
                      <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-white/25">
                        Datáfono
                      </p>
                      <p className="mt-1 font-mono text-xl font-black text-white">
                        ₡{formatearPrecio(estadoCaja.resumen?.tarjeta)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#F5A300]/15 bg-[#F5A300]/5 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5A300]/10 text-[#F5A300]">
                        <Store size={17} />
                      </div>
                      <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-white/25">
                        Total ventas
                      </p>
                      <p className="mt-1 font-mono text-xl font-black text-[#F5A300]">
                        ₡{formatearPrecio(estadoCaja.resumen?.total_ventas)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-white">
                          Conteo ciego de efectivo
                        </p>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-white/30">
                          Primero contarás físicamente la gaveta. El sistema no mostrará el efectivo esperado hasta después del conteo y determinará automáticamente si la caja quedó completa, con faltante o con sobrante.
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                          Fondo inicial
                        </p>
                        <p className="mt-1 font-mono text-base font-black text-white/70">
                          ₡{formatearPrecio(estadoCaja.resumen?.monto_inicial)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 justify-end">
                    <button
                      onClick={cerrarModalCierre}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/30 transition hover:bg-white/5 hover:text-white/60"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setErrorCierre('')
                        setPasoCierre(2)
                      }}
                      className="rounded-xl bg-[#F5A300] px-6 py-3 text-sm font-black text-black transition hover:bg-[#ffb72b]"
                    >
                      Continuar al conteo
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Conteo */}
              {pasoCierre === 2 && (
                <div className="p-6">
                  <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5A300]/10 text-[#F5A300]">
                      <DollarSign size={20} />
                    </div>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-white/25">Conteo físico</p>
                    <h3 className="mt-1 text-2xl font-black text-white">¿Cuánto efectivo hay en la gaveta?</h3>
                    <p className="mt-2 text-sm text-white/30">Cuenta únicamente billetes y monedas.</p>

                    <div className="mx-auto mt-6 max-w-md">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-black text-[#F5A300]">
                          ₡
                        </span>
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          step="1"
                          value={efectivoContado}
                          onChange={(e) => setEfectivoContado(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-xl border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-center font-mono text-3xl font-black text-white outline-none transition focus:border-[#F5A300]/40"
                        />
                      </div>
                      <p className="mt-3 text-[10px] leading-relaxed text-white/20">No incluyas SINPE ni pagos con tarjeta.</p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button onClick={() => { setErrorCierre(''); setPasoCierre(1); }} disabled={previsualizandoCierre} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/30 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-50">
                      Volver
                    </button>
                    <button onClick={previsualizarCierre} disabled={previsualizandoCierre} className="rounded-xl bg-[#F5A300] px-6 py-3 text-sm font-black text-black transition hover:bg-[#ffb72b] disabled:opacity-50">
                      {previsualizandoCierre ? 'Comparando...' : 'Comparar conteo'}
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Resultado */}
              {pasoCierre === 3 && resultadoArqueo && (
                <div className="p-6">
                  <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/5 bg-white/5">
                        <div className="border-b border-white/5 px-5 py-4">
                          <p className="text-sm font-black text-white">
                            Ventas por método de pago
                          </p>
                          <p className="mt-1 text-[10px] text-white/25">
                            Resumen definitivo del turno antes del cierre.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2">
                          <div className="bg-[#11100e] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                              Efectivo
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-emerald-300">
                              ₡{formatearPrecio(resultadoArqueo.resumen?.efectivo)}
                            </p>
                          </div>

                          <div className="bg-[#11100e] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                              SINPE Móvil
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-sky-300">
                              ₡{formatearPrecio(resultadoArqueo.resumen?.sinpe)}
                            </p>
                          </div>

                          <div className="bg-[#11100e] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                              Datáfono
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-violet-300">
                              ₡{formatearPrecio(resultadoArqueo.resumen?.tarjeta)}
                            </p>
                          </div>

                          <div className="bg-[#11100e] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                              Total ventas
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-[#F5A300]">
                              ₡{formatearPrecio(resultadoArqueo.resumen?.total_ventas)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-white/5">
                        <div className="border-b border-white/5 px-5 py-4">
                          <p className="text-sm font-black text-white">
                            Arqueo de efectivo
                          </p>
                        </div>

                        <div className="divide-y divide-white/5">
                          {[
                            ['Fondo inicial', resultadoArqueo.resumen?.monto_inicial],
                            ['Ventas en efectivo', resultadoArqueo.resumen?.efectivo],
                            ['Entradas', resultadoArqueo.resumen?.entradas_efectivo],
                            ['Salidas', resultadoArqueo.resumen?.salidas_efectivo],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between px-5 py-3"
                            >
                              <span className="text-xs text-white/30">
                                {label}
                              </span>
                              <span className="font-mono text-sm font-black text-white/60">
                                ₡{formatearPrecio(value)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 border-t border-white/5">
                          <div className="border-r border-white/5 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                              Esperado
                            </p>
                            <p className="mt-1 font-mono text-base font-black text-white">
                              ₡{formatearPrecio(resultadoArqueo.efectivo_esperado)}
                            </p>
                          </div>

                          <div className="border-r border-white/5 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                              Contado
                            </p>
                            <p className="mt-1 font-mono text-base font-black text-white">
                              ₡{formatearPrecio(resultadoArqueo.efectivo_contado)}
                            </p>
                          </div>

                          <div className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                              Diferencia
                            </p>
                            <p className={`mt-1 font-mono text-base font-black ${
                              diferenciaArqueo === 0
                                ? 'text-emerald-300'
                                : diferenciaArqueo < 0
                                  ? 'text-rose-300'
                                  : 'text-amber-300'
                            }`}>
                              {diferenciaArqueo > 0 ? '+' : ''}
                              ₡{formatearPrecio(diferenciaArqueo)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                        Resultado automático
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        Resultado del arqueo
                      </h3>

                      <div className={`mt-4 rounded-2xl border p-5 text-center ${configuracionResultado.contenedor}`}>
                        {(() => {
                          const IconoResultado = configuracionResultado.icono
                          return (
                            <IconoResultado
                              size={28}
                              className={`mx-auto ${configuracionResultado.texto}`}
                            />
                          )
                        })()}

                        <p className={`mt-2 text-lg font-black ${configuracionResultado.texto}`}>
                          {configuracionResultado.titulo}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/45">
                          {configuracionResultado.descripcion}
                        </p>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                          Regla aplicada por el sistema
                        </p>
                        <p className="mt-1 text-xs leading-5 text-white/35">
                          {resultadoAutomatico === 'completo'
                            ? 'El efectivo contado es exactamente igual al efectivo esperado.'
                            : resultadoAutomatico === 'faltante'
                              ? 'El efectivo contado es menor que el efectivo esperado.'
                              : 'El efectivo contado es mayor que el efectivo esperado.'}
                        </p>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                            Observaciones
                          </label>
                          <span className="text-[9px] text-white/15">
                            {resultadoAutomatico === 'completo'
                              ? 'Opcional'
                              : 'Obligatorio'}
                          </span>
                        </div>

                        <textarea
                          rows="4"
                          value={observacionesCierre}
                          onChange={(e) => {
                            setObservacionesCierre(e.target.value)
                            setErrorCierre('')
                          }}
                          placeholder={
                            resultadoAutomatico === 'completo'
                              ? 'Observación opcional del cierre...'
                              : 'Explica qué pudo ocasionar la diferencia...'
                          }
                          className="input-modern mt-1.5 w-full resize-none rounded-xl px-3 py-2.5 text-sm text-white"
                          required={resultadoAutomatico !== 'completo'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button
                      onClick={() => {
                        setResultadoArqueo(null)
                        setObservacionesCierre('')
                        setErrorCierre('')
                        setPasoCierre(2)
                      }}
                      disabled={cerrandoCaja}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/30 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-50"
                    >
                      Repetir conteo
                    </button>

                    <button
                      onClick={confirmarCierre}
                      disabled={
                        cerrandoCaja ||
                        (
                          resultadoAutomatico !== 'completo' &&
                          !observacionesCierre.trim()
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition hover:bg-rose-400 disabled:opacity-50"
                    >
                      {cerrandoCaja ? 'Cerrando...' : 'Confirmar cierre'}
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCajaPanel