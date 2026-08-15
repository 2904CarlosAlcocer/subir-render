import { Link } from 'react-router-dom'
import {
  Pizza,
  ShoppingCart,
  Search,
  Grid,
  List,
  Plus,
  Check,
  Flame,
  Clock3,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
} from 'react'
import api from '../api/axios'
import useCarritoStore from '../store/carritoStore'
import PersonalizadorPizza from '../components/PersonalizadorPizza'
import PersonalizadorPasta from '../components/PersonalizadorPasta'
import PersonalizadorAcompanamientos from '../components/PersonalizadorAcompanamientos'
import HorarioPedidosBanner from '../components/HorarioPedidosBanner'
import useHorarioPedidos from '../hooks/useHorarioPedidos'

const HERO_MENU_MOBILE =
  '/images/menu/imgMenu-768.webp'

const HERO_MENU_DESKTOP =
  '/images/menu/imgMenu-1440.webp'

const RETRASO_BUSQUEDA_MS = 250

const obtenerUrlOptimizada = (
  imagenUrl,
  ancho
) => {
  if (!imagenUrl) {
    return null
  }

  try {
    const url = new URL(
      imagenUrl,
      window.location.origin
    )

    const partesRuta =
      url.pathname.split('/')

    const nombreArchivo =
      partesRuta.pop()

    if (!nombreArchivo) {
      return null
    }

    const nombreBase =
      nombreArchivo.replace(
        /\.[^/.]+$/,
        ''
      )

    partesRuta.push(
      'optimizadas',
      `${nombreBase}-${ancho}.webp`
    )

    url.pathname =
      partesRuta.join('/')

    return url.toString()
  } catch (error) {
    console.error(
      'No se pudo construir la URL optimizada:',
      error
    )

    return null
  }
}

const ImagenProducto = memo(function ImagenProducto({
  producto,
  variante = 'grid',
  emojiRespaldo = '🍕',
}) {
  const [
    estadoImagen,
    setEstadoImagen,
  ] = useState('optimizada')

  const imagenOriginal =
    producto?.imagen_url || null

  const imagen240 =
    obtenerUrlOptimizada(
      imagenOriginal,
      240
    )

  const imagen480 =
    obtenerUrlOptimizada(
      imagenOriginal,
      480
    )

  const imagen640 =
    obtenerUrlOptimizada(
      imagenOriginal,
      640
    )

  const esLista =
    variante === 'lista'

  const clasesImagen = esLista
    ? `
        h-full w-full
        object-cover
        transition-transform
        duration-500
        group-hover:scale-110
      `
    : `
        h-full w-full
        object-cover
        transition-transform
        duration-700
        group-hover:scale-110
      `

  const clasesRespaldo = esLista
    ? `
        flex h-full w-full
        items-center justify-center
        text-2xl text-white/15
      `
    : `
        flex h-full w-full
        items-center justify-center
        text-4xl text-white/15
        sm:text-5xl
      `

  if (
    !imagenOriginal ||
    estadoImagen === 'sin-imagen'
  ) {
    return (
      <div className={clasesRespaldo}>
        {emojiRespaldo}
      </div>
    )
  }

  const usarOptimizadas =
    estadoImagen === 'optimizada' &&
    imagen240 &&
    imagen480 &&
    imagen640

  return (
    <img
      src={
        usarOptimizadas
          ? imagen480
          : imagenOriginal
      }
      srcSet={
        usarOptimizadas
          ? `${imagen240} 240w, ${imagen480} 480w, ${imagen640} 640w`
          : undefined
      }
      sizes={
        esLista
          ? '(max-width: 639px) 64px, 80px'
          : '(max-width: 639px) calc(50vw - 22px), (max-width: 1023px) calc(50vw - 28px), 33vw'
      }
      alt={producto.nombre}
      width={640}
      height={512}
      loading="lazy"
      decoding="async"
      className={clasesImagen}
      onError={() => {
        setEstadoImagen(
          (estadoActual) =>
            estadoActual ===
            'optimizada'
              ? 'original'
              : 'sin-imagen'
        )
      }}
    />
  )
})

/*
|--------------------------------------------------------------------------
| NÚMERO DE PLATILLO (como en una carta impresa: "pedí el 07")
|--------------------------------------------------------------------------
*/

function NumeroPlato({
  numero,
  variante,
}) {
  const numeroFormateado = String(
    numero
  ).padStart(2, '0')

  if (variante === 'lista') {
    return (
      <span
        className="
          w-6
          shrink-0
          text-center
          font-mono
          text-xs
          font-bold
          text-[#F5A300]/60
          sm:w-8 sm:text-sm
        "
      >
        {numeroFormateado}
      </span>
    )
  }

  return (
    <span
      className="
        absolute left-2 top-2
        flex h-8 w-8
        items-center justify-center
        rounded-full
        border
        border-[#F5A300]/70
        bg-[#120C08]/85
        font-display
        text-xs font-bold
        text-[#F5A300]
        backdrop-blur-sm
        sm:h-9 sm:w-9
        sm:text-sm
      "
    >
      {numeroFormateado}
    </span>
  )
}

/*
|--------------------------------------------------------------------------
| ETIQUETA "PERSONALIZABLE"
|--------------------------------------------------------------------------
*/

function EtiquetaPersonalizable({
  texto,
}) {
  return (
    <p
      className="
        mt-1
        flex items-center gap-1
        text-[10px]
        font-semibold
        uppercase
        tracking-wide
        text-[#F5A300]/80
      "
    >
      <Flame size={10} />
      {texto}
    </p>
  )
}

/*
|--------------------------------------------------------------------------
| LÍNEA DE PRECIO CON PUNTOS GUÍA (estilo carta impresa)
|--------------------------------------------------------------------------
*/

function LineaPrecio({
  etiqueta,
  monto,
  formatearPrecio,
  destacado = true,
}) {
  return (
    <div className="flex items-baseline gap-2">
      {etiqueta && (
        <span
          className="
            shrink-0
            text-[10px]
            font-semibold
            uppercase
            tracking-wide
            text-white/40
          "
        >
          {etiqueta}
        </span>
      )}

      <span className="mb-[3px] h-0 flex-1 border-b border-dotted border-white/20" />

      <span
        className={`
          shrink-0
          font-mono
          text-xs font-bold
          tabular-nums
          sm:text-sm
          ${
            destacado
              ? 'text-[#F5A300]'
              : 'text-white/60'
          }
        `}
      >
        ₡
        {formatearPrecio(monto)}
      </span>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| BOTÓN AGREGAR
|--------------------------------------------------------------------------
*/

function BotonAgregar({
  enCarrito,
  agregandoEste,
  etiqueta,
  onClick,
  compacto = false,
  deshabilitado = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={agregandoEste || deshabilitado}
      className={`
        flex items-center
        justify-center gap-1.5
        rounded-lg
        text-[10px] font-bold
        uppercase tracking-wide
        transition-all
        disabled:cursor-not-allowed
        disabled:opacity-60
        sm:text-xs
        ${
          compacto
            ? 'shrink-0 px-3 py-1.5'
            : 'w-full py-2'
        }
        ${
          enCarrito
            ? `
              bg-[#F5A300]
              text-black
              hover:bg-[#E4002B]
              hover:text-white
            `
            : `
              border
              border-white/15
              text-white/70
              hover:border-transparent
              hover:bg-gradient-to-r
              hover:from-[#E4002B]
              hover:to-[#F5A300]
              hover:text-white
            `
        }
      `}
    >
      {deshabilitado ? (
        <Clock3 size={12} />
      ) : agregandoEste ? (
        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      ) : enCarrito ? (
        <Check size={12} />
      ) : (
        <Plus size={12} />
      )}

      <span>{etiqueta}</span>
    </button>
  )
}

/*
|--------------------------------------------------------------------------
| TARJETA DE PRODUCTO (única para grid y lista)
|--------------------------------------------------------------------------
*/

const TarjetaProducto = memo(function TarjetaProducto({
  producto,
  numero,
  variante,
  enCarrito,
  agregandoEste,
  onAgregar,
  formatearPrecio,
  tienePrecioPersonal,
  pedidosHabilitados,
}) {
  const esPizza = Boolean(
    producto.es_pizza
  )

  const esPasta = Boolean(
    producto.es_pasta_personalizable
  )

  const usaAcompanamientos =
    Boolean(
      producto.usa_acompanamientos
    )

  const esPersonalizable =
    esPizza ||
    esPasta ||
    usaAcompanamientos

  const etiquetaPersonalizable =
    esPizza
      ? 'Personalizable'
      : esPasta
        ? 'Personalizable'
        : 'Elegir acompañamientos'

  const esSelectorGaseosas =
    esProductoGaseosas(producto)

  const etiquetaBoton =
    !pedidosHabilitados
      ? 'Pedidos cerrados'
      : agregandoEste
        ? 'Agregando'
        : esSelectorGaseosas
          ? 'Elegir'
          : enCarrito
            ? 'Agregado'
            : esPersonalizable
              ? 'Personalizar'
              : 'Agregar'

  const tienePrecio =
    tienePrecioPersonal(producto)

  const manejarClick = () =>
    onAgregar(producto)

  if (variante === 'lista') {
    return (
      <div
        className="
          group
          flex items-center gap-3
          border-b
          border-white/5
          py-3
          transition-colors
          duration-300
          hover:bg-white/[0.03]
          last:border-b-0
          sm:gap-4
        "
      >
        <NumeroPlato
          numero={numero}
          variante="lista"
        />

        <div
          className="
            h-16 w-16
            shrink-0
            overflow-hidden
            rounded-lg
            bg-black/40
            sm:h-20 sm:w-20
          "
        >
          <ImagenProducto
            producto={producto}
            variante="lista"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h4
              className="
                line-clamp-2
                min-w-0
                font-display
                text-sm font-bold
                leading-snug
                tracking-normal
                text-white
                transition-colors
                group-hover:text-[#F5A300]
                sm:text-base
                sm:tracking-wide
              "
            >
              {producto.nombre}
            </h4>

            {!tienePrecio && (
              <>
                <span className="mb-[3px] hidden h-0 flex-1 border-b border-dotted border-white/20 sm:block" />

                <span className="hidden shrink-0 font-mono text-sm font-bold tabular-nums text-[#F5A300] sm:inline">
                  ₡
                  {formatearPrecio(
                    producto.precio
                  )}
                </span>
              </>
            )}
          </div>

          {esPersonalizable && (
            <EtiquetaPersonalizable
              texto={
                etiquetaPersonalizable
              }
            />
          )}

          {producto.descripcion && (
            <p
              className="
                mt-0.5
                line-clamp-1
                text-xs text-white/40
              "
            >
              {producto.descripcion}
            </p>
          )}

          {tienePrecio && (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span className="font-mono text-xs font-bold tabular-nums text-[#F5A300]">
                Grande ₡
                {formatearPrecio(
                  producto.precio
                )}
              </span>

              <span className="font-mono text-xs font-bold tabular-nums text-white/50">
                Personal ₡
                {formatearPrecio(
                  producto.precio_personal
                )}
              </span>
            </div>
          )}

          {/* precio visible en mobile cuando no hay espacio para la línea guía */}
          {!tienePrecio && (
            <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums text-[#F5A300] sm:hidden">
              ₡
              {formatearPrecio(
                producto.precio
              )}
            </span>
          )}
        </div>

        <BotonAgregar
          enCarrito={enCarrito}
          agregandoEste={
            agregandoEste
          }
          etiqueta={etiquetaBoton}
          onClick={manejarClick}
          deshabilitado={!pedidosHabilitados}
          compacto
        />
      </div>
    )
  }

  return (
    <div
      className="
        group
        relative
        flex h-full min-w-0
        flex-col
        overflow-hidden
        rounded-lg
        bg-[#170F09]
        shadow-sm
        shadow-black/20
        transition-shadow
        duration-300
        hover:shadow-xl
        hover:shadow-black/50
      "
    >
      <div className="relative aspect-[5/4] shrink-0 overflow-hidden bg-black/40">
        <ImagenProducto
          producto={producto}
        />

        <div
          className="
            absolute inset-0
            bg-gradient-to-t
            from-[#120C08]
            via-transparent
            to-transparent
          "
        />

        <NumeroPlato
          numero={numero}
          variante="grid"
        />

        {enCarrito && !esSelectorGaseosas && (
          <span
            className="
              absolute right-2 top-2
              flex items-center
              gap-1
              rounded-full
              bg-[#F5A300]
              px-2 py-1
              text-[8px]
              font-bold
              text-black
              sm:text-[9px]
            "
          >
            <Check size={9} />
            En carrito
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        {tienePrecio ? (
          <h4
            className="
              line-clamp-2
              min-w-0
              break-words
              font-display
              text-sm font-bold
              leading-snug
              tracking-normal
              text-white
              transition-colors
              group-hover:text-[#F5A300]
              sm:text-base
              sm:tracking-wide
            "
          >
            {producto.nombre}
          </h4>
        ) : (
          <div
            className="
              flex min-w-0
              flex-col gap-1
              sm:flex-row
              sm:items-baseline
              sm:gap-2
            "
          >
            <h4
              className="
                line-clamp-2
                min-w-0
                flex-1
                break-words
                font-display
                text-sm font-bold
                leading-snug
                tracking-normal
                text-white
                transition-colors
                group-hover:text-[#F5A300]
                sm:text-base
                sm:tracking-wide
              "
            >
              {producto.nombre}
            </h4>

            <span
              className="
                mb-[3px]
                hidden h-0 flex-1
                border-b border-dotted
                border-white/20
                sm:block
              "
            />

            <span
              className="
                shrink-0
                font-mono
                text-sm font-bold
                tabular-nums
                text-[#F5A300]
              "
            >
              ₡
              {formatearPrecio(
                producto.precio
              )}
            </span>
          </div>
        )}

        {esPersonalizable && (
          <EtiquetaPersonalizable
            texto={
              etiquetaPersonalizable
            }
          />
        )}

        {producto.descripcion && (
          <p
            className="
              mt-1
              line-clamp-2
              min-w-0
              break-words
              text-[10px]
              leading-relaxed
              text-white/40
              sm:text-[11px]
            "
          >
            {producto.descripcion}
          </p>
        )}

        {tienePrecio && (
          <div className="mt-2 space-y-1">
            <LineaPrecio
              etiqueta="Grande"
              monto={
                producto.precio
              }
              formatearPrecio={
                formatearPrecio
              }
            />

            <LineaPrecio
              etiqueta="Personal"
              monto={
                producto.precio_personal
              }
              formatearPrecio={
                formatearPrecio
              }
              destacado={false}
            />
          </div>
        )}

        <div className="mt-auto pt-3">
          <BotonAgregar
            enCarrito={
              esSelectorGaseosas
                ? false
                : enCarrito
            }
            agregandoEste={
              agregandoEste
            }
            etiqueta={etiquetaBoton}
            onClick={manejarClick}
            deshabilitado={!pedidosHabilitados}
          />
        </div>
      </div>
    </div>
  )
})

/*
|--------------------------------------------------------------------------
| GASEOSAS: UN SOLO PRODUCTO + SELECTOR DE OPCIONES
|--------------------------------------------------------------------------
|
| En la base de datos existe un producto llamado "Gaseosas".
| Al tocar ese producto no se agrega inmediatamente:
| se abre este selector y el cliente elige cuál desea.
|
| Para agregar más opciones después, solo añádelas a este arreglo.
|
*/

const OPCIONES_GASEOSAS = [
  'Coca-Cola',
  'Coca-Cola Zero',
  'Fanta Colita',
  'Fanta Naranja',
  'Fanta Uva',
  'Pepsi',
  'Pepsi Zero',
  'Fresca',
  'Ginger',
]

function normalizarTextoMenu(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function esProductoGaseosas(producto) {
  const nombre =
    normalizarTextoMenu(producto?.nombre)

  return (
    nombre === 'gaseosas' ||
    nombre === 'gaseosa'
  )
}

function ModalGaseosas({
  producto,
  opciones,
  onCerrar,
  onSeleccionar,
  opcionAgregada,
  formatearPrecio,
  pedidosHabilitados,
}) {
  return (
    <div
      className="
        fixed inset-0 z-[10000]
        flex items-end justify-center
        bg-black/80
        backdrop-blur-sm
        sm:items-center sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-label="Elegir gaseosa"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCerrar()
        }
      }}
    >
      <div
        className="
          w-full max-w-2xl
          overflow-hidden
          rounded-t-[28px]
          border border-white/10
          bg-[#120C08]
          shadow-[0_30px_120px_rgba(0,0,0,0.7)]
          sm:max-h-[82vh]
          sm:rounded-[28px]
        "
      >
        <div
          className="
            relative overflow-hidden
            border-b border-white/[0.08]
            px-5 py-5
            sm:px-6
          "
        >
          <div
            className="
              pointer-events-none
              absolute -right-16 -top-20
              h-44 w-44 rounded-full
              bg-[#F5A300]/10
              blur-3xl
            "
          />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p
                className="
                  text-[9px] font-black
                  uppercase tracking-[0.18em]
                  text-[#F5A300]/65
                "
              >
                Bebidas frías
              </p>

              <h3
                className="
                  mt-1 font-display
                  text-2xl font-black
                  text-white
                  sm:text-3xl
                "
              >
                Elige tu gaseosa
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="
                    rounded-full
                    border border-white/10
                    bg-white/5
                    px-2.5 py-1
                    text-[10px] font-bold
                    text-white/45
                  "
                >
                  {opciones.length} opciones
                </span>

                <span
                  className="
                    font-mono text-sm
                    font-black
                    text-[#F5A300]
                  "
                >
                  ₡{formatearPrecio(
                    producto?.precio
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-xl
                border border-white/10
                bg-white/5
                text-white/40
                transition
                hover:bg-white/10
                hover:text-white
              "
              aria-label="Cerrar selector de gaseosas"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div
          className="
            max-h-[68vh]
            overflow-y-auto
            p-3
            custom-gaseosas-scrollbar
            sm:p-4
          "
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {opciones.map(
              (opcion, indice) => {
                const agregada =
                  opcionAgregada === opcion

                return (
                  <button
                    key={opcion}
                    type="button"
                    disabled={!pedidosHabilitados}
                    onClick={() =>
                      onSeleccionar(opcion)
                    }
                    className={`
                      group
                      flex min-w-0
                      items-center gap-3
                      rounded-xl border
                      p-3.5 text-left
                      transition-all
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                      ${
                        agregada
                          ? `
                              border-emerald-400/25
                              bg-emerald-400/[0.07]
                            `
                          : `
                              border-white/[0.07]
                              bg-white/[0.025]
                              hover:border-[#F5A300]/30
                              hover:bg-white/[0.05]
                            `
                      }
                    `}
                  >
                    <div
                      className={`
                        flex h-10 w-10
                        shrink-0
                        items-center justify-center
                        rounded-xl border
                        font-mono text-xs
                        font-black
                        ${
                          agregada
                            ? `
                                border-emerald-400/20
                                bg-emerald-400/10
                                text-emerald-300
                              `
                            : `
                                border-white/[0.08]
                                bg-black/25
                                text-[#F5A300]
                              `
                        }
                      `}
                    >
                      {agregada ? (
                        <Check size={16} />
                      ) : (
                        String(
                          indice + 1
                        ).padStart(2, '0')
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`
                          truncate text-sm
                          font-black
                          ${
                            agregada
                              ? 'text-emerald-300'
                              : 'text-white/80 group-hover:text-white'
                          }
                        `}
                      >
                        {opcion}
                      </p>

                      <p className="mt-0.5 text-[10px] text-white/25">
                        Gaseosa individual
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className="
                          font-mono text-xs
                          font-black
                          text-[#F5A300]
                        "
                      >
                        ₡{formatearPrecio(
                          producto?.precio
                        )}
                      </p>

                      <p
                        className={`
                          mt-1 text-[9px]
                          font-black uppercase
                          tracking-wide
                          ${
                            agregada
                              ? 'text-emerald-300'
                              : 'text-white/30'
                          }
                        `}
                      >
                        {agregada
                          ? 'Agregada'
                          : 'Agregar'}
                      </p>
                    </div>
                  </button>
                )
              }
            )}
          </div>

          <div
            className="
              mt-3 rounded-xl
              border border-white/[0.06]
              bg-black/20
              px-4 py-3
            "
          >
            <p className="text-[10px] leading-relaxed text-white/30">
              Puedes agregar más de una gaseosa. Cada opción quedará identificada por separado en tu carrito y en el pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Menu() {
  const [
    categorias,
    setCategorias,
  ] = useState([])

  const [
    productos,
    setProductos,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    errorCarga,
    setErrorCarga,
  ] = useState('')

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState('todas')

  const [
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    busquedaAplicada,
    setBusquedaAplicada,
  ] = useState('')

  const [
    vista,
    setVista,
  ] = useState('grid')

  const [
    agregando,
    setAgregando,
  ] = useState(null)

  const [
    productoPersonalizando,
    setProductoPersonalizando,
  ] = useState(null)

  const [
    productoPastaPersonalizando,
    setProductoPastaPersonalizando,
  ] = useState(null)

  const [
    productoAcompanamientosPersonalizando,
    setProductoAcompanamientosPersonalizando,
  ] = useState(null)

  const [
    selectorGaseosas,
    setSelectorGaseosas,
  ] = useState(null)

  const [
    gaseosaAgregada,
    setGaseosaAgregada,
  ] = useState(null)

  const {
    items,
    agregarProducto,
    obtenerCantidadItems,
  } = useCarritoStore()


  const {
    estado: estadoHorario,
    cargando: cargandoHorario,
  } = useHorarioPedidos()

  /*
  |--------------------------------------------------------------------------
  | MODAL DE GASEOSAS: BLOQUEAR SCROLL Y CERRAR CON ESC
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectorGaseosas) {
      return undefined
    }

    const overflowAnterior =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectorGaseosas(null)
      }
    }

    window.addEventListener(
      'keydown',
      cerrarConEscape
    )

    return () => {
      document.body.style.overflow =
        overflowAnterior

      window.removeEventListener(
        'keydown',
        cerrarConEscape
      )
    }
  }, [selectorGaseosas])

  /*
  |--------------------------------------------------------------------------
  | CHISPAS DECORATIVAS (solo hero)
  |--------------------------------------------------------------------------
  */

  const sparks = useMemo(() => {
    return Array.from(
      {
        length: 12,
      },
      (_, indice) => ({
        id: indice,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration:
          2 + Math.random() * 3,
        size:
          1.5 + Math.random() * 2.5,
      })
    )
  }, [])

  /*
  |--------------------------------------------------------------------------
  | CARGAR CATEGORÍAS Y PRODUCTOS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let componenteActivo = true

    const cargarDatos = async () => {
      setCargando(true)
      setErrorCarga('')

      try {
        const [
          respuestaCategorias,
          respuestaProductos,
        ] = await Promise.all([
          api.get(
            '/categorias'
          ),

          api.get(
            '/productos'
          ),
        ])

        if (!componenteActivo) {
          return
        }

        const categoriasDisponibles =
          Array.isArray(
            respuestaCategorias.data
          )
            ? respuestaCategorias.data.filter(
                (categoria) =>
                  categoria.estado ===
                  'activa'
              )
            : []

        const productosDisponibles =
          Array.isArray(
            respuestaProductos.data
          )
            ? respuestaProductos.data.filter(
                (producto) =>
                  producto.estado ===
                  'disponible'
              )
            : []

        setCategorias(
          categoriasDisponibles
        )

        setProductos(
          productosDisponibles
        )
      } catch (error) {
        console.error(
          'Error cargando el menú:',
          error
        )

        if (!componenteActivo) {
          return
        }

        setCategorias([])
        setProductos([])

        setErrorCarga(
          error.response?.data
            ?.message ||
            'No se pudo cargar el menú. Verifica que el backend esté funcionando.'
        )
      } finally {
        if (componenteActivo) {
          setCargando(false)
        }
      }
    }

    cargarDatos()

    return () => {
      componenteActivo = false
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR CON DEBOUNCE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const idTimeout = setTimeout(() => {
      setBusquedaAplicada(
        busqueda.trim().toLowerCase()
      )
    }, RETRASO_BUSQUEDA_MS)

    return () =>
      clearTimeout(idTimeout)
  }, [busqueda])

  /*
  |--------------------------------------------------------------------------
  | OPCIONES DE CATEGORÍA (memoizado)
  |--------------------------------------------------------------------------
  */

  const opcionesCategoria = useMemo(
    () => [
      {
        valor: 'todas',
        etiqueta: 'Todas',
      },
      ...categorias.map(
        (categoria) => ({
          valor: String(
            categoria.id
          ),
          etiqueta:
            categoria.nombre,
        })
      ),
    ],
    [categorias]
  )

  /*
  |--------------------------------------------------------------------------
  | FILTRAR PRODUCTOS (memoizado)
  |--------------------------------------------------------------------------
  */

  const productosFiltrados =
    useMemo(() => {
      return productos.filter(
        (producto) => {
          const coincideCategoria =
            categoriaSeleccionada ===
              'todas' ||
            Number(
              producto.categoria_id
            ) ===
              Number(
                categoriaSeleccionada
              )

          if (
            !coincideCategoria
          ) {
            return false
          }

          if (
            busquedaAplicada === ''
          ) {
            return true
          }

          const nombreProducto =
            String(
              producto.nombre || ''
            ).toLowerCase()

          const descripcionProducto =
            String(
              producto.descripcion ||
                ''
            ).toLowerCase()

          const opcionesGaseosas =
            esProductoGaseosas(producto)
              ? OPCIONES_GASEOSAS
                  .join(' ')
                  .toLowerCase()
              : ''

          return (
            nombreProducto.includes(
              busquedaAplicada
            ) ||
            descripcionProducto.includes(
              busquedaAplicada
            ) ||
            opcionesGaseosas.includes(
              busquedaAplicada
            )
          )
        }
      )
    }, [
      productos,
      categoriaSeleccionada,
      busquedaAplicada,
    ])

  /*
  |--------------------------------------------------------------------------
  | AGRUPAR PRODUCTOS POR CATEGORÍA (memoizado)
  |--------------------------------------------------------------------------
  */

  const productosAgrupados =
    useMemo(() => {
      return productosFiltrados.reduce(
        (
          acumulador,
          producto
        ) => {
          const nombreCategoria =
            producto.categoria
              ?.nombre || 'Otros'

          if (
            !acumulador[
              nombreCategoria
            ]
          ) {
            acumulador[
              nombreCategoria
            ] = []
          }

          acumulador[
            nombreCategoria
          ].push(producto)

          return acumulador
        },
        {}
      )
    }, [productosFiltrados])

  /*
  |--------------------------------------------------------------------------
  | AGREGAR PRODUCTO
  |--------------------------------------------------------------------------
  */

  const agregarAlCarrito = useCallback(
    (producto) => {
      if (!estadoHorario?.acepta_pedidos) {
        return
      }

      if (producto.es_pizza) {
        setProductoPersonalizando(
          producto
        )

        return
      }

      if (
        producto
          .es_pasta_personalizable
      ) {
        setProductoPastaPersonalizando(
          producto
        )

        return
      }

      if (
        producto.usa_acompanamientos
      ) {
        setProductoAcompanamientosPersonalizando(
          producto
        )

        return
      }

      if (
        typeof agregarProducto !==
        'function'
      ) {
        console.error(
          'agregarProducto no es una función. Verifica carritoStore.'
        )

        return
      }

      setAgregando(producto.id)

      agregarProducto({
        id: producto.id,
        producto_id: producto.id,
        nombre: producto.nombre,
        precio:
          Number(
            producto.precio
          ) || 0,
        imagen_url:
          producto.imagen_url,
        descripcion:
          producto.descripcion,
        cantidad: 1,
        tamano_pizza: null,
        extras: null,
        extras_ids: [],
        pasta: null,
        acompanamientos_ids: [],
        observaciones: null,
        personalizacion: null,
      })

      setTimeout(() => {
        setAgregando(null)
      }, 800)
    },
    [agregarProducto, estadoHorario?.acepta_pedidos]
  )

  /*
  |--------------------------------------------------------------------------
  | AGREGAR GASEOSA SELECCIONADA
  |--------------------------------------------------------------------------
  */

  const agregarGaseosaSeleccionada =
    useCallback(
      (opcion) => {
        if (
          !selectorGaseosas ||
          !estadoHorario?.acepta_pedidos
        ) {
          return
        }

        if (
          typeof agregarProducto !==
          'function'
        ) {
          console.error(
            'agregarProducto no es una función. Verifica carritoStore.'
          )

          return
        }

        agregarProducto({
          id: selectorGaseosas.id,
          producto_id:
            selectorGaseosas.id,
          nombre:
            `${selectorGaseosas.nombre} - ${opcion}`,
          precio:
            Number(
              selectorGaseosas.precio
            ) || 0,
          imagen_url:
            selectorGaseosas.imagen_url,
          descripcion:
            selectorGaseosas.descripcion,
          cantidad: 1,
          tamano_pizza: null,
          extras: null,
          extras_ids: [],
          pasta: null,
          acompanamientos_ids: [],
          observaciones:
            `Gaseosa seleccionada: ${opcion}`,
          personalizacion: {
            tipo: 'gaseosa',
            opcion,
          },
        })

        setGaseosaAgregada(opcion)

        window.setTimeout(() => {
          setGaseosaAgregada(
            (actual) =>
              actual === opcion
                ? null
                : actual
          )
        }, 900)
      },
      [
        selectorGaseosas,
        agregarProducto,
        estadoHorario?.acepta_pedidos,
      ]
    )

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR PERSONALIZACIÓN
  |--------------------------------------------------------------------------
  */

  const handleConfirmarPersonalizacion =
    (itemPersonalizado) => {
      if (!estadoHorario?.acepta_pedidos) {
        setProductoPersonalizando(null)
        setProductoPastaPersonalizando(null)
        setProductoAcompanamientosPersonalizando(null)
        return
      }

      if (
        typeof agregarProducto !==
        'function'
      ) {
        console.error(
          'agregarProducto no es una función.'
        )

        return
      }

      setAgregando(
        itemPersonalizado.producto_id
      )

      agregarProducto({
        id:
          itemPersonalizado
            .producto_id,

        producto_id:
          itemPersonalizado
            .producto_id,

        nombre:
          itemPersonalizado.nombre,

        precio:
          Number(
            itemPersonalizado.precio
          ) || 0,

        imagen_url:
          itemPersonalizado
            .imagen_url,

        descripcion:
          itemPersonalizado
            .descripcion || null,

        cantidad:
          Number(
            itemPersonalizado
              .cantidad
          ) || 1,

        tamano_pizza:
          itemPersonalizado
            .tamano_pizza ===
          'personal'
            ? 'personal'
            : itemPersonalizado
                .tamano_pizza ===
              'grande'
              ? 'grande'
              : null,

        extras:
          itemPersonalizado.extras ||
          null,

        extras_ids:
          Array.isArray(
            itemPersonalizado
              .extras_ids
          )
            ? itemPersonalizado
                .extras_ids
            : [],

        pasta:
          itemPersonalizado.pasta &&
          typeof itemPersonalizado
            .pasta === 'object'
            ? itemPersonalizado
                .pasta
            : null,

        acompanamientos_ids:
          Array.isArray(
            itemPersonalizado
              .acompanamientos_ids
          )
            ? itemPersonalizado
                .acompanamientos_ids
            : [],

        observaciones:
          itemPersonalizado
            .observaciones || null,

        personalizacion:
          itemPersonalizado
            .personalizacion || null,
      })

      setProductoPersonalizando(
        null
      )

      setProductoPastaPersonalizando(
        null
      )

      setProductoAcompanamientosPersonalizando(
        null
      )

      setTimeout(() => {
        setAgregando(null)
      }, 800)
    }

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR SI ESTÁ EN EL CARRITO
  |--------------------------------------------------------------------------
  */

  const idsEnCarrito = useMemo(() => {
    if (!Array.isArray(items)) {
      return new Set()
    }

    return new Set(
      items.map((item) =>
        Number(item.id)
      )
    )
  }, [items])

  const totalItems =
    typeof obtenerCantidadItems ===
    'function'
      ? obtenerCantidadItems()
      : 0

  const formatearPrecio = useCallback(
    (monto) => {
      return Number(
        monto || 0
      ).toLocaleString(
        'es-CR',
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }
      )
    },
    []
  )

  const tienePrecioPersonal =
    useCallback((producto) => {
      const precioPersonal = Number(
        producto?.precio_personal
      )

      return Boolean(
        producto?.es_pizza &&
        Number.isFinite(
          precioPersonal
        ) &&
        precioPersonal > 0
      )
    }, [])

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaSeleccionada(
      'todas'
    )
  }

  return (
    <div className="
      relative min-h-screen
      overflow-hidden
      bg-[#120C08]
      text-white
    ">
      {/* CHISPAS */}
      <div className="
        pointer-events-none
        fixed inset-0 z-0
        overflow-hidden
      ">
        {sparks.map(
          (spark) => (
            <div
              key={`spark-${spark.id}`}
              className="
                animate-spark
                absolute rounded-full
                bg-gradient-to-t
                from-orange-400
                to-yellow-300
              "
              style={{
                left:
                  `${spark.left}%`,

                top:
                  `${spark.top}%`,

                width:
                  `${spark.size}px`,

                height:
                  `${spark.size}px`,

                animationDelay:
                  `${spark.delay}s`,

                animationDuration:
                  `${spark.duration}s`,

                boxShadow:
                  '0 0 8px 2px rgba(251, 146, 60, 0.4)',
              }}
            />
          )
        )}
      </div>

      {/* HERO */}
      <section className="
        relative isolate
        flex min-h-[530px]
        items-center justify-center
        overflow-hidden
        bg-[#120C08]
        px-4 py-12
        sm:min-h-[50vh]
        sm:px-6 sm:py-20
      ">
        <picture
          className="
            absolute inset-0 z-0
            block h-full w-full
          "
          aria-hidden="true"
        >
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet={HERO_MENU_MOBILE}
          />

          <source
            type="image/webp"
            srcSet={HERO_MENU_DESKTOP}
          />

          <img
            src={HERO_MENU_DESKTOP}
            alt=""
            width={1440}
            height={806}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable="false"
            className="
              h-full w-full
              object-cover
              object-[center_42%]
              md:object-center
            "
          />
        </picture>

        <div className="
          absolute inset-0 z-[1]
          bg-black/55
          sm:bg-black/40
        " />

        <div className="
          absolute inset-0 z-[2]
          bg-gradient-to-r
          from-black/50
          via-black/35
          to-black/20
          sm:from-black/45
          sm:via-black/30
          sm:to-black/15
        " />

        <div className="
          absolute inset-0 z-[2]
          bg-gradient-to-b
          from-transparent
          via-black/10
          to-[#120C08]/85
        " />

        <div className="
          absolute right-10 top-20
          z-[2]
          h-64 w-64
          rounded-full
          bg-[#E4002B]/15
          blur-3xl
          sm:h-96 sm:w-96
        " />

        <div className="
          absolute bottom-0 left-0
          z-[2]
          h-52 w-52
          rounded-full
          bg-[#F5A300]/10
          blur-3xl
          sm:h-72 sm:w-72
        " />

        <div className="
          relative z-10
          mx-auto w-full
          max-w-4xl
          text-center
        ">
          <div className="
            mx-auto mb-4
            inline-flex w-fit
            items-center gap-2
            rounded-full
            border
            border-[#E4002B]/50
            bg-[#E4002B]/30
            px-4 py-2
            shadow-lg
            shadow-black/20
            backdrop-blur-md
            sm:mb-6
          ">
            <Pizza className="
              h-4 w-4
              text-[#F5A300]
            " />

            <span className="
              text-sm font-semibold
              text-[#F5A300]
            ">
              Nuestro menú
            </span>
          </div>

          <h1 className="
            mb-4
            text-[clamp(2rem,9.5vw,3rem)]
            font-black
            leading-[1.05]
            sm:mb-6
            sm:text-6xl
            sm:leading-tight
            md:text-7xl
          ">
            <span className="
              text-white
              drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]
            ">
              Descubre
            </span>

            <span className="
              block whitespace-nowrap
              bg-gradient-to-r
              from-[#F5A300]
              via-[#E4002B]
              to-[#F5A300]
              bg-clip-text
              text-transparent
              drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            ">
              Nuestros sabores
            </span>
          </h1>

          <p className="
            mx-auto max-w-2xl
            px-1
            text-base
            leading-relaxed
            text-white/95
            drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]
            sm:text-xl
          ">
            Desde nuestras pizzas
            100% hechas a la leña, hasta las
            pastas caseras y carnes premium
            a la parrilla, cada
            platillo está preparado
            con ingredientes premium
            y mucha pasión.
          </p>

          <div className="
            mt-6
            flex flex-wrap
            justify-center gap-4
            sm:mt-8
          ">
            <Link
              to="/carrito"
              className="
                inline-flex
                w-full
                max-w-[220px]
                transform
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-[#E4002B]
                to-[#F5A300]
                px-8 py-3
                text-sm font-bold
                shadow-lg
                shadow-black/30
                transition-all
                duration-300
                hover:scale-105
                hover:shadow-2xl
                hover:shadow-[#E4002B]/50
                sm:w-auto
                sm:max-w-none
              "
            >
              <ShoppingCart
                size={16}
              />

              Ver carrito

              {totalItems > 0 && (
                <span className="
                  rounded-full
                  bg-white/20
                  px-2 py-0.5
                  text-xs
                ">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        <svg
          className="
            absolute bottom-0 left-0
            z-[5]
            -mb-1 w-full
          "
          viewBox="0 0 1200 35"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0,20
              Q300,5 600,20
              T1200,20
              L1200,60
              L0,60 Z
            "
            fill="#120C08"
          />

          <path
            d="
              M0,25
              Q300,12 600,25
              T1200,25
              L1200,60
              L0,60 Z
            "
            fill="#120C08"
            opacity="0.8"
          />
        </svg>
      </section>

      <div className="relative z-20 mx-auto -mt-2 w-full max-w-6xl px-4 sm:px-6">
        <HorarioPedidosBanner
          estado={estadoHorario}
          cargando={cargandoHorario}
        />
      </div>

      {/* FILTROS */}
      <section className="
        sticky top-[72px] z-30
        border-b
        border-white/10
        bg-[#120C08]/95
        px-4 py-5
        backdrop-blur-md
        sm:px-6
      ">
        <div className="mx-auto max-w-6xl">
          <div className="
            flex flex-col
            items-stretch gap-4
            sm:flex-row
            sm:items-center
          ">
            <div className="
              relative w-full
              flex-1
              sm:max-w-xs
            ">
              <Search className="
                absolute left-3
                top-1/2
                h-4 w-4
                -translate-y-1/2
                text-white/30
              " />

              <input
                type="text"
                placeholder="Buscar en el menú..."
                value={busqueda}
                onChange={(
                  event
                ) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-white/10
                  bg-white/5
                  py-2.5
                  pl-9 pr-4
                  text-sm text-white
                  outline-none
                  transition
                  placeholder:text-white/30
                  focus:border-[#F5A300]
                  focus:ring-2
                  focus:ring-[#F5A300]/20
                "
              />
            </div>

            <nav
              aria-label="Categorías del menú"
              className="
                scrollbar-hide
                flex min-w-0
                flex-1
                items-center gap-2
                overflow-x-auto
                sm:gap-3
              "
            >
              {opcionesCategoria.map(
                (opcion, indice) => (
                  <div
                    key={
                      opcion.valor
                    }
                    className="flex shrink-0 items-center gap-2 sm:gap-3"
                  >
                    {indice > 0 && (
                      <span className="text-white/15">
                        ／
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setCategoriaSeleccionada(
                          opcion.valor
                        )
                      }
                      className={`
                        whitespace-nowrap
                        text-xs
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        transition-colors
                        sm:text-sm
                        ${
                          categoriaSeleccionada ===
                          opcion.valor
                            ? 'text-[#F5A300]'
                            : 'text-white/45 hover:text-white/80'
                        }
                      `}
                    >
                      {
                        opcion.etiqueta
                      }
                    </button>
                  </div>
                )
              )}
            </nav>

            <div className="
              flex shrink-0
              self-end
              rounded-lg
              border
              border-white/10
              bg-white/5
              p-1
              sm:self-auto
            ">
              <button
                type="button"
                onClick={() =>
                  setVista('grid')
                }
                aria-label="Vista en cuadrícula"
                aria-pressed={
                  vista === 'grid'
                }
                className={`
                  rounded p-2
                  transition-all
                  ${
                    vista === 'grid'
                      ? `
                        bg-[#E4002B]
                        text-white
                      `
                      : `
                        text-white/40
                        hover:text-white
                      `
                  }
                `}
              >
                <Grid size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setVista('list')
                }
                aria-label="Vista en lista"
                aria-pressed={
                  vista === 'list'
                }
                className={`
                  rounded p-2
                  transition-all
                  ${
                    vista === 'list'
                      ? `
                        bg-[#E4002B]
                        text-white
                      `
                      : `
                        text-white/40
                        hover:text-white
                      `
                  }
                `}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="
        relative
        bg-[#120C08]
        px-4 py-12
        sm:px-6 sm:py-16
      ">
        {/* textura sutil, solo decorativa */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
          aria-hidden="true"
        >
          <svg width="100%" height="100%">
            <filter id="grano-menu">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="2"
                stitchTiles="stitch"
              />
            </filter>
            <rect
              width="100%"
              height="100%"
              filter="url(#grano-menu)"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl">
          {cargando ? (
            <div className="
              flex items-center
              justify-center
              py-20
            ">
              <div className="
                h-10 w-10
                animate-spin
                rounded-full
                border-b-2
                border-t-2
                border-[#F5A300]
              " />
            </div>
          ) : errorCarga ? (
            <div className="
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-8
              text-center
            ">
              <p className="
                text-sm
                text-red-300
              ">
                {errorCarga}
              </p>
            </div>
          ) : productosFiltrados
              .length === 0 ? (
            <div className="
              py-20 text-center
            ">
              <p className="
                text-lg
                text-white/50
              ">
                No encontramos
                productos que
                coincidan con tu
                búsqueda.
              </p>

              <button
                type="button"
                onClick={
                  limpiarFiltros
                }
                className="
                  mt-4
                  text-[#F5A300]
                  hover:underline
                "
              >
                Ver todo el menú
              </button>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(
                productosAgrupados
              ).map(
                ([
                  categoria,
                  productosCategoria,
                ]) => (
                  <div
                    key={categoria}
                  >
                    <h3 className="
                      mb-5
                      flex items-center
                      gap-3
                      font-display
                      text-sm
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-[#F5A300]
                    ">
                      <Flame
                        size={14}
                        className="shrink-0"
                      />

                      {categoria}

                      <span className="
                        h-px flex-1
                        bg-gradient-to-r
                        from-[#F5A300]/25
                        to-transparent
                      " />
                    </h3>

                    {vista === 'grid' ? (
                      <div className="
                        grid
                        grid-cols-1
                        gap-3
                        min-[390px]:grid-cols-2
                        sm:gap-4
                        lg:grid-cols-3
                        lg:gap-6
                      ">
                        {productosCategoria.map(
                          (
                            producto,
                            indice
                          ) => (
                            <TarjetaProducto
                              key={
                                producto.id
                              }
                              producto={
                                producto
                              }
                              numero={
                                indice +
                                1
                              }
                              variante="grid"
                              enCarrito={idsEnCarrito.has(
                                Number(
                                  producto.id
                                )
                              )}
                              agregandoEste={
                                agregando ===
                                producto.id
                              }
                              onAgregar={
                                esProductoGaseosas(
                                  producto
                                )
                                  ? () => {
                                      setGaseosaAgregada(
                                        null
                                      )
                                      setSelectorGaseosas(
                                        producto
                                      )
                                    }
                                  : agregarAlCarrito
                              }
                              formatearPrecio={
                                formatearPrecio
                              }
                              tienePrecioPersonal={
                                tienePrecioPersonal
                              }
                              pedidosHabilitados={Boolean(
                                estadoHorario?.acepta_pedidos
                              )}
                            />
                          )
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border-t border-white/10">
                        {productosCategoria.map(
                          (
                            producto,
                            indice
                          ) => (
                            <TarjetaProducto
                              key={
                                producto.id
                              }
                              producto={
                                producto
                              }
                              numero={
                                indice +
                                1
                              }
                              variante="lista"
                              enCarrito={idsEnCarrito.has(
                                Number(
                                  producto.id
                                )
                              )}
                              agregandoEste={
                                agregando ===
                                producto.id
                              }
                              onAgregar={
                                esProductoGaseosas(
                                  producto
                                )
                                  ? () => {
                                      setGaseosaAgregada(
                                        null
                                      )
                                      setSelectorGaseosas(
                                        producto
                                      )
                                    }
                                  : agregarAlCarrito
                              }
                              formatearPrecio={
                                formatearPrecio
                              }
                              tienePrecioPersonal={
                                tienePrecioPersonal
                              }
                              pedidosHabilitados={Boolean(
                                estadoHorario?.acepta_pedidos
                              )}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="
        relative
        overflow-hidden
        border-t
        border-white/10
        px-4 py-16
        text-center
        sm:px-6
        sm:py-24
      ">
        <div className="
          relative z-10
          mx-auto max-w-3xl
          space-y-6
          sm:space-y-8
        ">
          <h2 className="
            text-3xl font-black
            xs:text-4xl
            sm:text-5xl
            md:text-6xl
          ">
            <span className="
              text-white
              drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]
            ">
              ¿Listo para{' '}
            </span>

            <span className="
              bg-gradient-to-r
              from-[#F5A300]
              to-[#E4002B]
              bg-clip-text
              text-transparent
              drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            ">
              ordenar?
            </span>
          </h2>

          <p className="
            text-base
            text-white/80
            drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]
            sm:text-lg
            md:text-xl
          ">
            Haz tu pedido ahora y
            disfruta de las mejores
            pizzas de La Fortuna,
            directamente desde
            nuestro horno artesanal.
          </p>

          <Link
            to="/carrito"
            className="
              inline-block
              transform
              rounded-2xl
              bg-gradient-to-r
              from-[#F5A300]
              to-[#E4002B]
              px-10 py-4
              text-base
              font-bold
              text-black
              shadow-lg
              shadow-black/30
              transition-all
              duration-300
              hover:scale-105
              hover:shadow-2xl
              hover:shadow-[#F5A300]/50
              sm:px-12
              sm:py-5
              sm:text-lg
              md:text-xl
            "
          >
            VER CARRITO

            {totalItems > 0 && (
              <span className="
                ml-2
                rounded-full
                bg-black/20
                px-2 py-0.5
                text-sm
              ">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="
        relative
        overflow-hidden
        border-t
        border-white/10
        bg-black/30
        px-4 py-8
        sm:px-6
        sm:py-12
      ">
        <div className="
          relative z-10
          mx-auto max-w-6xl
          text-center
          text-xs
          text-white/60
          sm:text-sm
        ">
          <p>
            Rooster Pizza & Grill
            {' '}© 2026 | Mercadito
            Arenal, La Fortuna,
            Alajuela
          </p>
        </div>
      </footer>

      {/* SELECTOR COMPACTO DE GASEOSAS */}
      {selectorGaseosas && (
        <ModalGaseosas
          producto={selectorGaseosas}
          opciones={OPCIONES_GASEOSAS}
          onCerrar={() => {
            setSelectorGaseosas(null)
            setGaseosaAgregada(null)
          }}
          onSeleccionar={
            agregarGaseosaSeleccionada
          }
          opcionAgregada={
            gaseosaAgregada
          }
          formatearPrecio={
            formatearPrecio
          }
          pedidosHabilitados={Boolean(
            estadoHorario?.acepta_pedidos
          )}
        />
      )}

      {/* PERSONALIZADOR DE PIZZA */}
      {productoPersonalizando && (
        <PersonalizadorPizza
          producto={
            productoPersonalizando
          }
          extrasDisponibles={
            Array.isArray(
              productoPersonalizando
                .extras_disponibles
            )
              ? productoPersonalizando
                  .extras_disponibles
              : []
          }
          onConfirmar={
            handleConfirmarPersonalizacion
          }
          onCancelar={() =>
            setProductoPersonalizando(
              null
            )
          }
        />
      )}

      {/* PERSONALIZADOR DE PASTA */}
      {productoPastaPersonalizando && (
        <PersonalizadorPasta
          producto={
            productoPastaPersonalizando
          }
          opcionesPasta={
            productoPastaPersonalizando
              .opciones_pasta || null
          }
          onConfirmar={
            handleConfirmarPersonalizacion
          }
          onCancelar={() =>
            setProductoPastaPersonalizando(
              null
            )
          }
        />
      )}

      {/* PERSONALIZADOR DE ACOMPAÑAMIENTOS */}
      {productoAcompanamientosPersonalizando && (
        <PersonalizadorAcompanamientos
          producto={
            productoAcompanamientosPersonalizando
          }
          acompanamientosDisponibles={
            Array.isArray(
              productoAcompanamientosPersonalizando
                .acompanamientos_disponibles
            )
              ? productoAcompanamientosPersonalizando
                  .acompanamientos_disponibles
              : []
          }
          onConfirmar={
            handleConfirmarPersonalizacion
          }
          onCancelar={() =>
            setProductoAcompanamientosPersonalizando(
              null
            )
          }
        />
      )}

      <style>{`
        @keyframes spark {
          0% {
            opacity: 0;
            transform:
              scale(0)
              rotate(0deg)
              translateY(0);
          }

          30% {
            opacity: 1;
            transform:
              scale(1.5)
              rotate(45deg)
              translateY(-10px);
          }

          70% {
            opacity: 0.8;
            transform:
              scale(1)
              rotate(90deg)
              translateY(-20px);
          }

          100% {
            opacity: 0;
            transform:
              scale(0)
              rotate(180deg)
              translateY(-40px);
          }
        }

        .animate-spark {
          animation:
            spark linear infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }


        .custom-gaseosas-scrollbar {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(245, 163, 0, 0.35)
            transparent;
        }

        .custom-gaseosas-scrollbar::-webkit-scrollbar {
          width: 5px;
        }

        .custom-gaseosas-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-gaseosas-scrollbar::-webkit-scrollbar-thumb {
          background:
            rgba(245, 163, 0, 0.35);
          border-radius: 999px;
        }

        .custom-gaseosas-scrollbar::-webkit-scrollbar-thumb:hover {
          background:
            rgba(245, 163, 0, 0.6);
        }
      `}</style>
    </div>
  )
}