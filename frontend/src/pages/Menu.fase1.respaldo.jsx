import { Link } from 'react-router-dom'
import {
  Pizza,
  ShoppingCart,
  Search,
  Grid,
  List,
  Plus,
  Check,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import api from '../api/axios'
import fondoPrincipal from '../assets/imgMenu.jpeg'
import fondoPrincipal768 from '../assets/imgMenu-768.webp'
import fondoPrincipal1440 from '../assets/imgMenu-1440.webp'
import useCarritoStore from '../store/carritoStore'
import PersonalizadorPizza from '../components/PersonalizadorPizza'
import PersonalizadorPasta from '../components/PersonalizadorPasta'
import PersonalizadorAcompanamientos from '../components/PersonalizadorAcompanamientos'


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

function ImagenProducto({
  producto,
  variante = 'grid',
}) {
  const [
    estadoImagen,
    setEstadoImagen,
  ] = useState('optimizada')

  const imagenOriginal =
    producto?.imagen_url || null

  const imagen320 =
    obtenerUrlOptimizada(
      imagenOriginal,
      320
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
        text-2xl text-white/20
        sm:text-3xl
      `
    : `
        flex h-full w-full
        items-center justify-center
        text-4xl text-white/20
        sm:text-6xl
      `

  if (
    !imagenOriginal ||
    estadoImagen === 'sin-imagen'
  ) {
    return (
      <div className={clasesRespaldo}>
        🍕
      </div>
    )
  }

  const usarOptimizadas =
    estadoImagen === 'optimizada' &&
    imagen320 &&
    imagen640

  return (
    <img
      src={
        usarOptimizadas
          ? imagen640
          : imagenOriginal
      }
      srcSet={
        usarOptimizadas
          ? `${imagen320} 320w, ${imagen640} 640w`
          : undefined
      }
      sizes={
        esLista
          ? '(max-width: 639px) 56px, 80px'
          : '(max-width: 639px) 50vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw'
      }
      alt={producto.nombre}
      width={640}
      height={480}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
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

  const {
    items,
    agregarProducto,
    obtenerCantidadItems,
  } = useCarritoStore()

  /*
  |--------------------------------------------------------------------------
  | CHISPAS DECORATIVAS
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
  | FILTRAR PRODUCTOS
  |--------------------------------------------------------------------------
  */

  const productosFiltrados =
    productos.filter(
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

        const termino =
          busqueda
            .trim()
            .toLowerCase()

        const nombreProducto =
          String(
            producto.nombre || ''
          ).toLowerCase()

        const descripcionProducto =
          String(
            producto.descripcion || ''
          ).toLowerCase()

        const coincideBusqueda =
          termino === '' ||
          nombreProducto.includes(
            termino
          ) ||
          descripcionProducto.includes(
            termino
          )

        return (
          coincideCategoria &&
          coincideBusqueda
        )
      }
    )

  /*
  |--------------------------------------------------------------------------
  | AGRUPAR PRODUCTOS POR CATEGORÍA
  |--------------------------------------------------------------------------
  */

  const productosAgrupados =
    productosFiltrados.reduce(
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

  /*
  |--------------------------------------------------------------------------
  | AGREGAR PRODUCTO
  |--------------------------------------------------------------------------
  */

  const agregarAlCarrito = (
    producto
  ) => {
    /*
     * Cada producto abre únicamente el personalizador
     * que le corresponde.
     */
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
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR PERSONALIZACIÓN
  |--------------------------------------------------------------------------
  */

  const handleConfirmarPersonalizacion =
    (itemPersonalizado) => {
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

  const estaEnCarrito = (
    productoId
  ) => {
    if (!Array.isArray(items)) {
      return false
    }

    return items.some(
      (item) =>
        Number(item.id) ===
        Number(productoId)
    )
  }

  const totalItems =
    typeof obtenerCantidadItems ===
    'function'
      ? obtenerCantidadItems()
      : 0

  const formatearPrecio = (
    monto
  ) => {
    return Number(
      monto || 0
    ).toLocaleString(
      'es-CR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    )
  }

  const tienePrecioPersonal = (
    producto
  ) => {
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
  }

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
            type="image/webp"
            srcSet={`
              ${fondoPrincipal768} 768w,
              ${fondoPrincipal1440} 1440w
            `}
            sizes="100vw"
          />

          <img
            src={fondoPrincipal}
            alt=""
            width={1600}
            height={895}
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
            artesanales hasta las
            pastas caseras y carnes
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

      {/* FILTROS */}
      <section className="
        sticky top-[72px] z-30
        border-b
        border-white/10
        bg-[#120C08]/90
        bg-gradient-to-b
        from-[#120C08]
        to-[#0a0604]
        px-4 py-8
        backdrop-blur-md
        sm:px-6
      ">
        <div className="
          mx-auto max-w-6xl
        ">
          <div className="
            flex flex-col
            items-center gap-4
            sm:flex-row
          ">
            <div className="
              relative w-full
              flex-1
              sm:max-w-sm
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
                  rounded-xl
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

            <div className="
              scrollbar-hide
              flex w-full
              items-center gap-2
              overflow-x-auto
              pb-2
              sm:w-auto
              sm:pb-0
            ">
              <button
                type="button"
                onClick={() =>
                  setCategoriaSeleccionada(
                    'todas'
                  )
                }
                className={`
                  whitespace-nowrap
                  rounded-xl
                  px-4 py-2
                  text-sm font-bold
                  transition-all
                  ${
                    categoriaSeleccionada ===
                    'todas'
                      ? `
                        bg-gradient-to-r
                        from-[#E4002B]
                        to-[#F5A300]
                        text-white
                        shadow-lg
                      `
                      : `
                        border
                        border-white/10
                        bg-white/5
                        text-white/60
                        hover:text-white
                      `
                  }
                `}
              >
                Todas
              </button>

              {categorias.map(
                (categoria) => (
                  <button
                    key={
                      categoria.id
                    }
                    type="button"
                    onClick={() =>
                      setCategoriaSeleccionada(
                        String(
                          categoria.id
                        )
                      )
                    }
                    className={`
                      whitespace-nowrap
                      rounded-xl
                      px-4 py-2
                      text-sm font-bold
                      transition-all
                      ${
                        categoriaSeleccionada ===
                        String(
                          categoria.id
                        )
                          ? `
                            bg-gradient-to-r
                            from-[#E4002B]
                            to-[#F5A300]
                            text-white
                            shadow-lg
                          `
                          : `
                            border
                            border-white/10
                            bg-white/5
                            text-white/60
                            hover:text-white
                          `
                      }
                    `}
                  >
                    {
                      categoria.nombre
                    }
                  </button>
                )
              )}
            </div>

            <div className="
              flex shrink-0
              rounded-xl
              border
              border-white/10
              bg-white/5
              p-1
            ">
              <button
                type="button"
                onClick={() =>
                  setVista('grid')
                }
                aria-label="Vista en cuadrícula"
                className={`
                  rounded-lg p-2
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
                className={`
                  rounded-lg p-2
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
        bg-gradient-to-b
        from-[#0a0604]
        to-[#120C08]
        px-4 py-12
        sm:px-6 sm:py-16
      ">
        <div className="
          mx-auto max-w-6xl
        ">
          {cargando ? (
            <div className="
              flex items-center
              justify-center
              py-20
            ">
              <div className="
                h-12 w-12
                animate-spin
                rounded-full
                border-b-2
                border-t-2
                border-[#F5A300]
              " />
            </div>
          ) : errorCarga ? (
            <div className="
              rounded-2xl
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
          ) : vista === 'grid' ? (
            <div className="
              space-y-12
            ">
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
                      mb-4
                      flex items-center
                      gap-2
                      text-xs font-black
                      uppercase
                      tracking-wide
                      text-[#F5A300]
                    ">
                      <span className="
                        h-0.5 w-8
                        bg-gradient-to-r
                        from-[#F5A300]
                        to-transparent
                      " />

                      {categoria}

                      <span className="
                        h-0.5 flex-1
                        bg-gradient-to-r
                        from-[#F5A300]/30
                        to-transparent
                      " />
                    </h3>

                    <div className="
                      grid
                      grid-cols-2
                      gap-3
                      sm:grid-cols-2
                      sm:gap-4
                      lg:grid-cols-3
                      lg:gap-6
                      xl:grid-cols-4
                    ">
                      {productosCategoria.map(
                        (producto) => {
                          const enCarrito =
                            estaEnCarrito(
                              producto.id
                            )

                          const agregandoEste =
                            agregando ===
                            producto.id

                          const esPizza =
                            Boolean(
                              producto
                                .es_pizza
                            )

                          const esPasta =
                            Boolean(
                              producto
                                .es_pasta_personalizable
                            )

                          const usaAcompanamientos =
                            Boolean(
                              producto
                                .usa_acompanamientos
                            )

                          const esPersonalizable =
                            esPizza ||
                            esPasta ||
                            usaAcompanamientos

                          return (
                            <div
                              key={
                                producto.id
                              }
                              className="
                                group
                                overflow-hidden
                                rounded-2xl
                                border
                                border-white/10
                                bg-white/5
                                backdrop-blur-sm
                                transition-all
                                duration-500
                                hover:-translate-y-2
                                hover:border-[#F5A300]/40
                                hover:shadow-2xl
                                hover:shadow-[#F5A300]/10
                              "
                            >
                              <div className="
                                relative
                                aspect-[4/3]
                                overflow-hidden
                                bg-black/30
                              ">
                                <ImagenProducto
                                  producto={
                                    producto
                                  }
                                />

                                <div className="
                                  absolute inset-0
                                  bg-gradient-to-t
                                  from-[#120C08]
                                  via-[#120C08]/60
                                  to-transparent
                                " />

                                {esPersonalizable && (
                                  <div className="
                                    absolute
                                    left-2 top-2
                                    rounded-full
                                    bg-[#F5A300]
                                    px-1.5 py-0.5
                                    text-[8px]
                                    font-bold
                                    text-black
                                    sm:px-2
                                    sm:py-1
                                    sm:text-[10px]
                                  ">
                                    {esPizza
                                      ? '🍕 Personalizable'
                                      : esPasta
                                        ? '🍝 Personalizable'
                                        : '🥗 Elegir acompañamientos'}
                                  </div>
                                )}

                                {enCarrito && (
                                  <div className="
                                    absolute
                                    right-2 top-2
                                    flex items-center
                                    gap-0.5
                                    rounded-full
                                    bg-[#F5A300]
                                    px-1.5 py-0.5
                                    text-[8px]
                                    font-bold
                                    text-black
                                    sm:right-3
                                    sm:top-3
                                    sm:gap-1
                                    sm:px-2
                                    sm:py-1
                                    sm:text-[10px]
                                  ">
                                    <Check
                                      size={8}
                                      className="
                                        sm:h-[10px]
                                        sm:w-[10px]
                                      "
                                    />

                                    Agregado
                                  </div>
                                )}
                              </div>

                              <div className="
                                p-2.5
                                sm:p-3
                                lg:p-5
                              ">
                                <h4 className="
                                  min-h-[2.5rem]
                                  line-clamp-2
                                  text-xs
                                  font-bold
                                  text-white
                                  transition-colors
                                  group-hover:text-[#F5A300]
                                  sm:min-h-[3rem]
                                  sm:text-sm
                                  lg:text-base
                                ">
                                  {
                                    producto.nombre
                                  }
                                </h4>

                                {Array.isArray(
                                  producto
                                    .ingredientes_base
                                ) &&
                                  producto
                                    .ingredientes_base
                                    .length >
                                    0 && (
                                    <div className="
                                      mt-1
                                      flex flex-wrap
                                      gap-1
                                    ">
                                      {producto
                                        .ingredientes_base
                                        .slice(
                                          0,
                                          3
                                        )
                                        .map(
                                          (
                                            ingrediente
                                          ) => (
                                            <span
                                              key={
                                                ingrediente.id
                                              }
                                              className="
                                                rounded
                                                bg-white/5
                                                px-1.5
                                                py-0.5
                                                text-[8px]
                                                text-white/40
                                              "
                                            >
                                              {
                                                ingrediente.nombre
                                              }
                                            </span>
                                          )
                                        )}

                                      {producto
                                        .ingredientes_base
                                        .length >
                                        3 && (
                                        <span className="
                                          text-[8px]
                                          text-white/40
                                        ">
                                          +
                                          {producto
                                            .ingredientes_base
                                            .length -
                                            3}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                {producto
                                  .descripcion && (
                                  <p className="
                                    mt-0.5
                                    hidden
                                    line-clamp-2
                                    text-[10px]
                                    text-white/40
                                    sm:mt-1
                                    sm:block
                                    sm:text-xs
                                    lg:text-sm
                                  ">
                                    {
                                      producto
                                        .descripcion
                                    }
                                  </p>
                                )}

                                <div className="
                                  mt-2
                                  flex items-center
                                  justify-between
                                  border-t
                                  border-white/5
                                  pt-1.5
                                  sm:mt-3
                                  sm:pt-2
                                  lg:pt-3
                                ">
                                  {tienePrecioPersonal(
                                    producto
                                  ) ? (
                                    <div className="
                                      flex flex-col
                                      font-mono
                                      leading-tight
                                    ">
                                      <span className="
                                        whitespace-nowrap
                                        text-[10px]
                                        font-bold
                                        text-[#F5A300]
                                        sm:text-xs
                                        lg:text-sm
                                      ">
                                        Grande ₡
                                        {formatearPrecio(
                                          producto
                                            .precio
                                        )}
                                      </span>

                                      <span className="
                                        mt-0.5
                                        whitespace-nowrap
                                        text-[9px]
                                        font-bold
                                        text-white/60
                                        sm:text-[11px]
                                        lg:text-xs
                                      ">
                                        Personal ₡
                                        {formatearPrecio(
                                          producto
                                            .precio_personal
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="
                                      whitespace-nowrap
                                      font-mono
                                      text-xs
                                      font-bold
                                      text-[#F5A300]
                                      sm:text-sm
                                      lg:text-lg
                                    ">
                                      ₡
                                      {formatearPrecio(
                                        producto
                                          .precio
                                      )}
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      agregarAlCarrito(
                                        producto
                                      )
                                    }
                                    disabled={
                                      agregandoEste
                                    }
                                    className={`
                                      flex items-center
                                      gap-1
                                      rounded-lg
                                      px-2 py-1
                                      text-[9px]
                                      font-bold
                                      text-white
                                      transition-all
                                      hover:scale-105
                                      disabled:cursor-not-allowed
                                      disabled:opacity-60
                                      sm:gap-1.5
                                      sm:px-3
                                      sm:py-1.5
                                      sm:text-[10px]
                                      lg:px-4
                                      lg:py-2
                                      lg:text-xs
                                      ${
                                        enCarrito
                                          ? `
                                            bg-[#F5A300]
                                            text-black
                                            hover:bg-[#E4002B]
                                            hover:text-white
                                          `
                                          : esPersonalizable
                                            ? `
                                              bg-gradient-to-r
                                              from-[#F5A300]
                                              to-[#E4002B]
                                              hover:shadow-lg
                                              hover:shadow-[#F5A300]/30
                                            `
                                            : `
                                              bg-gradient-to-r
                                              from-[#E4002B]
                                              to-[#F5A300]
                                              hover:shadow-lg
                                              hover:shadow-[#E4002B]/30
                                            `
                                      }
                                    `}
                                  >
                                    {agregandoEste ? (
                                      <>
                                        <div className="
                                          h-2 w-2
                                          animate-spin
                                          rounded-full
                                          border-2
                                          border-white/30
                                          border-t-white
                                          sm:h-2.5
                                          sm:w-2.5
                                        " />

                                        <span className="
                                          hidden xs:inline
                                        ">
                                          Agregando
                                        </span>
                                      </>
                                    ) : enCarrito ? (
                                      <>
                                        <Check
                                          size={10}
                                          className="
                                            sm:h-3
                                            sm:w-3
                                          "
                                        />

                                        <span className="
                                          hidden xs:inline
                                        ">
                                          Agregado
                                        </span>
                                      </>
                                    ) : esPersonalizable ? (
                                      <>
                                        <Plus
                                          size={10}
                                          className="
                                            sm:h-3
                                            sm:w-3
                                          "
                                        />

                                        <span className="
                                          hidden xs:inline
                                        ">
                                          Personalizar
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus
                                          size={10}
                                          className="
                                            sm:h-3
                                            sm:w-3
                                          "
                                        />

                                        <span className="
                                          hidden xs:inline
                                        ">
                                          Agregar
                                        </span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="
              space-y-8
            ">
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
                      mb-4
                      flex items-center
                      gap-2
                      text-xs font-black
                      uppercase
                      tracking-wide
                      text-[#F5A300]
                    ">
                      <span className="
                        h-0.5 w-8
                        bg-gradient-to-r
                        from-[#F5A300]
                        to-transparent
                      " />

                      {categoria}

                      <span className="
                        h-0.5 flex-1
                        bg-gradient-to-r
                        from-[#F5A300]/30
                        to-transparent
                      " />
                    </h3>

                    <div className="
                      space-y-2
                      sm:space-y-3
                    ">
                      {productosCategoria.map(
                        (producto) => {
                          const enCarrito =
                            estaEnCarrito(
                              producto.id
                            )

                          const agregandoEste =
                            agregando ===
                            producto.id

                          const esPizza =
                            Boolean(
                              producto
                                .es_pizza
                            )

                          const esPasta =
                            Boolean(
                              producto
                                .es_pasta_personalizable
                            )

                          const usaAcompanamientos =
                            Boolean(
                              producto
                                .usa_acompanamientos
                            )

                          const esPersonalizable =
                            esPizza ||
                            esPasta ||
                            usaAcompanamientos

                          return (
                            <div
                              key={
                                producto.id
                              }
                              className="
                                group
                                flex items-center
                                gap-3
                                rounded-2xl
                                border
                                border-white/10
                                bg-white/5
                                p-3
                                backdrop-blur-sm
                                transition-all
                                duration-300
                                hover:border-[#F5A300]/40
                                hover:bg-white/10
                                sm:gap-4
                                sm:p-4
                              "
                            >
                              <div className="
                                h-14 w-14
                                shrink-0
                                overflow-hidden
                                rounded-xl
                                bg-black/30
                                sm:h-20
                                sm:w-20
                              ">
                                <ImagenProducto
                                  producto={
                                    producto
                                  }
                                  variante="lista"
                                />
                              </div>

                              <div className="
                                min-w-0 flex-1
                              ">
                                <h4 className="
                                  truncate
                                  text-sm
                                  font-bold
                                  text-white
                                  transition-colors
                                  group-hover:text-[#F5A300]
                                  sm:text-base
                                ">
                                  {
                                    producto.nombre
                                  }
                                </h4>

                                {producto
                                  .descripcion && (
                                  <p className="
                                    line-clamp-1
                                    text-xs
                                    text-white/40
                                    sm:text-sm
                                  ">
                                    {
                                      producto
                                        .descripcion
                                    }
                                  </p>
                                )}

                                {Array.isArray(
                                  producto
                                    .ingredientes_base
                                ) &&
                                  producto
                                    .ingredientes_base
                                    .length >
                                    0 && (
                                    <div className="
                                      mt-0.5
                                      flex flex-wrap
                                      gap-1
                                    ">
                                      {producto
                                        .ingredientes_base
                                        .slice(
                                          0,
                                          3
                                        )
                                        .map(
                                          (
                                            ingrediente
                                          ) => (
                                            <span
                                              key={
                                                ingrediente.id
                                              }
                                              className="
                                                rounded
                                                bg-white/5
                                                px-1.5
                                                py-0.5
                                                text-[8px]
                                                text-white/40
                                              "
                                            >
                                              {
                                                ingrediente.nombre
                                              }
                                            </span>
                                          )
                                        )}

                                      {producto
                                        .ingredientes_base
                                        .length >
                                        3 && (
                                        <span className="
                                          text-[8px]
                                          text-white/40
                                        ">
                                          +
                                          {producto
                                            .ingredientes_base
                                            .length -
                                            3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>

                              <div className="
                                flex shrink-0
                                items-center
                                gap-2
                                sm:gap-4
                              ">
                                {tienePrecioPersonal(
                                  producto
                                ) ? (
                                  <div className="
                                    flex flex-col
                                    items-end
                                    font-mono
                                    leading-tight
                                  ">
                                    <span className="
                                      whitespace-nowrap
                                      text-[10px]
                                      font-bold
                                      text-[#F5A300]
                                      sm:text-xs
                                      lg:text-sm
                                    ">
                                      Grande ₡
                                      {formatearPrecio(
                                        producto
                                          .precio
                                      )}
                                    </span>

                                    <span className="
                                      mt-0.5
                                      whitespace-nowrap
                                      text-[9px]
                                      font-bold
                                      text-white/60
                                      sm:text-[11px]
                                      lg:text-xs
                                    ">
                                      Personal ₡
                                      {formatearPrecio(
                                        producto
                                          .precio_personal
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="
                                    whitespace-nowrap
                                    font-mono
                                    text-xs
                                    font-bold
                                    text-[#F5A300]
                                    sm:text-sm
                                    lg:text-lg
                                  ">
                                    ₡
                                    {formatearPrecio(
                                      producto
                                        .precio
                                    )}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    agregarAlCarrito(
                                      producto
                                    )
                                  }
                                  disabled={
                                    agregandoEste
                                  }
                                  className={`
                                    flex items-center
                                    gap-1
                                    rounded-lg
                                    px-2 py-1
                                    text-[9px]
                                    font-bold
                                    text-white
                                    transition-all
                                    hover:scale-105
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                    sm:gap-1.5
                                    sm:px-3
                                    sm:py-1.5
                                    sm:text-[10px]
                                    lg:px-4
                                    lg:py-2
                                    lg:text-xs
                                    ${
                                      enCarrito
                                        ? `
                                          bg-[#F5A300]
                                          text-black
                                          hover:bg-[#E4002B]
                                          hover:text-white
                                        `
                                        : esPersonalizable
                                          ? `
                                            bg-gradient-to-r
                                            from-[#F5A300]
                                            to-[#E4002B]
                                            hover:shadow-lg
                                            hover:shadow-[#F5A300]/30
                                          `
                                          : `
                                            bg-gradient-to-r
                                            from-[#E4002B]
                                            to-[#F5A300]
                                            hover:shadow-lg
                                            hover:shadow-[#E4002B]/30
                                          `
                                    }
                                  `}
                                >
                                  {agregandoEste ? (
                                    <>
                                      <div className="
                                        h-2 w-2
                                        animate-spin
                                        rounded-full
                                        border-2
                                        border-white/30
                                        border-t-white
                                        sm:h-2.5
                                        sm:w-2.5
                                      " />

                                      <span className="
                                        hidden xs:inline
                                      ">
                                        Agregando
                                      </span>
                                    </>
                                  ) : enCarrito ? (
                                    <>
                                      <Check
                                        size={10}
                                        className="
                                          sm:h-3
                                          sm:w-3
                                        "
                                      />

                                      <span className="
                                        hidden xs:inline
                                      ">
                                        Agregado
                                      </span>
                                    </>
                                  ) : esPersonalizable ? (
                                    <>
                                      <Plus
                                        size={10}
                                        className="
                                          sm:h-3
                                          sm:w-3
                                        "
                                      />

                                      <span className="
                                        hidden xs:inline
                                      ">
                                        Personalizar
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus
                                        size={10}
                                        className="
                                          sm:h-3
                                          sm:w-3
                                        "
                                      />

                                      <span className="
                                        hidden xs:inline
                                      ">
                                        Agregar
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
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
      `}</style>
    </div>
  )
}
