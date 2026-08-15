import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChefHat,
  Flame,
  Sparkles,
  Star,
  Timer,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

/*
|--------------------------------------------------------------------------
| IMÁGENES OPTIMIZADAS DEL HOME
|--------------------------------------------------------------------------
|
| Se sirven desde public/images/home para poder precargar el hero desde
| index.html y entregar a cada dispositivo una imagen del tamaño adecuado.
|
*/

const HERO_HOME_MOBILE_480 =
  '/images/home/hero-home-mobile-480.webp'

const HERO_HOME_MOBILE_640 =
  '/images/home/hero-home-mobile-640.webp'

const HERO_HOME_DESKTOP_960 =
  '/images/home/hero-home-desktop-960.webp'

const HERO_HOME_DESKTOP_1440 =
  '/images/home/hero-home-desktop-1440.webp'

const ESPECIALIDADES_HOME = [
  {
    titulo: 'PIZZAS',
    descripcion:
      'Masa de larga fermentación con ingredientes premium',
    imagen320:
      '/images/home/pizza-320.webp',
    imagen640:
      '/images/home/pizza-640.webp',
    emoji: '',
    color:
      'from-red-600/40 to-orange-500/40',
  },
  {
    titulo: 'PASTAS',
    descripcion:
      'Recetas italianas auténticas elaboradas con esmero',
    imagen320:
      '/images/home/pasta-320.webp',
    imagen640:
      '/images/home/pasta-640.webp',
    emoji: '',
    color:
      'from-yellow-600/40 to-amber-500/40',
  },
  {
    titulo: 'CARNES',
    descripcion:
      'Cortes premium preparados a la parrilla artesanal',
    imagen320:
      '/images/home/carne-320.webp',
    imagen640:
      '/images/home/carne-640.webp',
    emoji: '',
    color:
      'from-red-700/40 to-orange-600/40',
  },
]

const MENU_ITEMS_HOME = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/',
    icon: '',
    desc:
      'Bienvenido a la mejor experiencia gastronómica',
    imagen360:
      '/images/home/inicio-card-360.webp',
    imagen720:
      '/images/home/inicio-card-720.webp',
    number: '01',
    color:
      'from-amber-500/30 to-orange-500/30',
  },
  {
    id: 'nosotros',
    label: 'Nosotros',
    path: '/nosotros',
    icon: '',
    desc:
      'Conoce nuestra pasión por la cocina artesanal',
    imagen360:
      '/images/home/nosotros-360.webp',
    imagen720:
      '/images/home/nosotros-720.webp',
    number: '02',
    color:
      'from-red-500/30 to-orange-500/30',
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    path: '/ubicacion',
    icon: '',
    desc:
      'En el corazón de La Fortuna, Mercadito Arenal',
    imagen360:
      '/images/home/mapa-360.webp',
    imagen720:
      '/images/home/mapa-720.webp',
    number: '04',
    color:
      'from-green-500/30 to-emerald-500/30',
  },
]

const formatearPrecio = (monto) => {
  return Number(monto || 0).toLocaleString('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}


/*
|--------------------------------------------------------------------------
| PARTÍCULAS DECORATIVAS ESTABLES
|--------------------------------------------------------------------------
|
| Se generan una sola vez al cargar el módulo. Así sus posiciones no cambian
| cuando React actualiza el producto destacado y se evita trabajo visual
| innecesario durante el renderizado.
|
*/

const valorDeterminista = (indice, semilla) => {
  const valor =
    Math.sin(
      (indice + 1) * 12.9898 +
      semilla * 78.233
    ) * 43758.5453

  return valor - Math.floor(valor)
}

const crearChispas = (
  cantidad,
  semilla,
  configuracion = {}
) => {
  const {
    leftMin = 0,
    leftRange = 100,
    topMin = 0,
    topRange = 100,
    sizeMin = 1.5,
    sizeRange = 2.5,
    durationMin = 2,
    durationRange = 3,
    delayStep = null,
  } = configuracion

  return Array.from(
    { length: cantidad },
    (_, indice) => ({
      id: indice,
      left:
        leftMin +
        valorDeterminista(
          indice,
          semilla
        ) * leftRange,
      top:
        topMin +
        valorDeterminista(
          indice,
          semilla + 1
        ) * topRange,
      delay:
        delayStep === null
          ? valorDeterminista(
              indice,
              semilla + 2
            ) * 3
          : indice * delayStep,
      duration:
        durationMin +
        valorDeterminista(
          indice,
          semilla + 3
        ) * durationRange,
      size:
        sizeMin +
        valorDeterminista(
          indice,
          semilla + 4
        ) * sizeRange,
    })
  )
}

const CHISPAS_GLOBALES =
  crearChispas(18, 1)

const CHISPAS_HERO =
  crearChispas(16, 2)

const CHISPAS_ESPECIALIDADES =
  crearChispas(12, 3)

const BRASAS_HERO =
  crearChispas(3, 4, {
    leftMin: 20,
    leftRange: 60,
    topMin: 20,
    topRange: 60,
    sizeMin: 5,
    sizeRange: 6,
    durationMin: 5,
    durationRange: 3,
    delayStep: 1.2,
  })

const CHISPAS_MENU =
  crearChispas(4, 5, {
    leftMin: 10,
    leftRange: 80,
    topMin: 15,
    topRange: 70,
    sizeMin: 1.5,
    sizeRange: 2,
    durationMin: 4,
    durationRange: 4,
    delayStep: 0.8,
  })

const CHISPAS_CTA =
  crearChispas(3, 6, {
    leftMin: 10,
    leftRange: 80,
    topMin: 15,
    topRange: 70,
    sizeMin: 1.5,
    sizeRange: 2,
    durationMin: 4,
    durationRange: 4,
    delayStep: 0.8,
  })

const CHISPAS_FOOTER =
  crearChispas(2, 7, {
    leftMin: 20,
    leftRange: 60,
    topMin: 25,
    topRange: 50,
    sizeMin: 1,
    sizeRange: 1.5,
    durationMin: 5,
    durationRange: 3,
    delayStep: 1,
  })

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


function AnimatedHighlights() {
  const cardStyles =
    'group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-[#F5A300]/40 hover:bg-white/[0.07] hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)]'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 sm:pt-7 border-t border-white/10">
      {/* Más de 10 pizzas, todas hechas a la leña */}
      <div className={cardStyles}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5A300] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#F5A300]/10 blur-2xl transition-all duration-500 group-hover:bg-[#F5A300]/20" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F5A300]/25 bg-[#F5A300]/10">
            <Flame className="h-5 w-5 text-[#F5A300]" />
          </div>

          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-black leading-none text-[#F5A300] tabular-nums">
              10
              <span className="text-lg sm:text-xl">+</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm font-bold leading-tight text-white">
              Pizzas a la leña
            </p>
          </div>
        </div>

        <p className="relative mt-3 text-[11px] sm:text-xs leading-relaxed text-white/55">
          Todas se preparan artesanalmente en horno de leña.
        </p>
      </div>

      {/* Carnes premium hechas a la parrilla */}
      <div className={cardStyles}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#E4002B]/10 blur-2xl transition-all duration-500 group-hover:bg-[#E4002B]/20" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4002B]/25 bg-[#E4002B]/10">
            <ChefHat className="h-5 w-5 text-[#F5A300]" />
          </div>

          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-black leading-none text-[#F5A300] tabular-nums">
              100
              <span className="text-lg sm:text-xl">%</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm font-bold leading-tight text-white">
              Cortes premium
            </p>
          </div>
        </div>

        <p className="relative mt-3 text-[11px] sm:text-xs leading-relaxed text-white/55">
          Carnes seleccionadas y preparadas directamente a la parrilla.
        </p>
      </div>

      {/* Costilla horneada lentamente durante 4 horas */}
      <div className={cardStyles}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5A300] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#F5A300]/10 blur-2xl transition-all duration-500 group-hover:bg-[#F5A300]/20" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F5A300]/25 bg-[#F5A300]/10">
            <Timer className="h-5 w-5 text-[#F5A300]" />
          </div>

          <div className="min-w-0">
            <div
              className="flex items-center gap-0.5"
              aria-label="Cinco estrellas"
            >
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className="h-4 w-4 sm:h-[18px] sm:w-[18px] fill-[#F5A300] text-[#F5A300] opacity-100 drop-shadow-[0_0_7px_rgba(245,163,0,0.85)]"
                />
              ))}
            </div>

            <p className="mt-1 text-xs sm:text-sm font-bold leading-tight text-white">
              Costilla al horno
            </p>
          </div>
        </div>

        <p className="relative mt-3 text-[11px] sm:text-xs leading-relaxed text-white/55">
          Horneada lentamente por 4 horas para quedar suave y jugosa.
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const [productoDestacado, setProductoDestacado] = useState(null)
  const [cargandoProductoDestacado, setCargandoProductoDestacado] = useState(true)
  const [errorProductoDestacado, setErrorProductoDestacado] = useState(false)

  useEffect(() => {
    let componenteActivo = true

    const cargarProductoDestacado = async () => {
      setCargandoProductoDestacado(true)
      setErrorProductoDestacado(false)

      try {
        const respuesta = await axios.get(
          `${API_BASE_URL}/productos/destacado-home`
        )

        if (!componenteActivo) return

        setProductoDestacado(respuesta.data)
      } catch (error) {
        console.error(
          'Error cargando la pizza destacada del Home:',
          error
        )

        if (!componenteActivo) return

        setProductoDestacado(null)
        setErrorProductoDestacado(true)
      } finally {
        if (componenteActivo) {
          setCargandoProductoDestacado(false)
        }
      }
    }

    cargarProductoDestacado()

    return () => {
      componenteActivo = false
    }
  }, [])


  const imagenDestacada240 =
    obtenerUrlOptimizada(
      productoDestacado?.imagen_url,
      240
    )

  const imagenDestacada480 =
    obtenerUrlOptimizada(
      productoDestacado?.imagen_url,
      480
    )

  const imagenDestacada640 =
    obtenerUrlOptimizada(
      productoDestacado?.imagen_url,
      640
    )

  const usarImagenDestacadaOptimizada =
    Boolean(
      imagenDestacada240 &&
      imagenDestacada480 &&
      imagenDestacada640
    )

  return (
    <div className="bg-[#120C08] text-white overflow-hidden relative">
      {/* ==================== CHISPAS DE FUEGO - FONDO GLOBAL (REDUCIDAS) ==================== */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {CHISPAS_GLOBALES.map((spark) => (
          <div
            key={`spark-${spark.id}`}
            className="absolute rounded-full bg-gradient-to-t from-orange-400 to-yellow-300 animate-spark"
            style={{
              left: `${spark.left}%`,
              top: `${spark.top}%`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              animationDelay: `${spark.delay}s`,
              animationDuration: `${spark.duration}s`,
              boxShadow: '0 0 8px 2px rgba(251, 146, 60, 0.4)',
            }}
          />
        ))}
      </div>

      {/* ==================== HERO CON FONDO ==================== */}
      <section className="relative isolate min-h-[calc(100svh-72px)] md:min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20 overflow-hidden bg-[#120C08]">
        {/* Imagen separada del contenido para controlar mejor el responsive */}
        <picture
          aria-hidden="true"
          className="absolute inset-0 z-0 block h-full w-full"
        >
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet={`${HERO_HOME_MOBILE_480} 480w, ${HERO_HOME_MOBILE_640} 640w`}
            sizes="100vw"
          />

          <source
            type="image/webp"
            srcSet={`${HERO_HOME_DESKTOP_960} 960w, ${HERO_HOME_DESKTOP_1440} 1440w`}
            sizes="100vw"
          />

          <img
            src={HERO_HOME_DESKTOP_1440}
            alt=""
            width="1440"
            height="960"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable="false"
            className="h-full w-full object-cover object-center"
          />
        </picture>

        {/* Capa oscura real: queda encima de la foto y debajo del contenido */}
        <div className="absolute inset-0 z-[1] bg-black/50 sm:bg-black/35" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/50 via-black/35 to-black/20 sm:from-black/45 sm:via-black/30 sm:to-black/15" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-black/10 to-[#120C08]/85" />

        {/* Elementos decorativos */}
        <div className="absolute top-20 right-10 z-[2] w-72 h-72 sm:w-96 sm:h-96 bg-[#E4002B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 z-[2] w-56 h-56 sm:w-72 sm:h-72 bg-[#F5A300]/5 rounded-full blur-3xl" />

        {/* ===== CHISPAS HERO (REDUCIDAS) ===== */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
          {CHISPAS_HERO.map((spark) => (
            <div
              key={`hero-spark-${spark.id}`}
              className="absolute rounded-full bg-gradient-to-t from-orange-500 to-yellow-200 animate-spark"
              style={{
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay + 0.5}s`,
                animationDuration: `${spark.duration + 0.5}s`,
                boxShadow: '0 0 10px 3px rgba(251, 146, 60, 0.5)',
              }}
            />
          ))}
        </div>

        {/* ===== BRASAS GRANDES (SOLO 3) ===== */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
          {BRASAS_HERO.map((braza) => (
            <div
              key={`braza-${braza.id}`}
              className="absolute rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 animate-float-spark"
              style={{
                left: `${braza.left}%`,
                top: `${braza.top}%`,
                width: `${braza.size}px`,
                height: `${braza.size}px`,
                animationDelay: `${braza.delay}s`,
                animationDuration: `${braza.duration}s`,
                boxShadow: '0 0 15px 5px rgba(234, 88, 12, 0.5)',
              }}
            />
          ))}
        </div>

        {/* ===== CONTENIDO DEL HERO ===== */}
        <div className="max-w-6xl mx-auto w-full relative z-10 pt-6 sm:pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 md:gap-12 items-center">
            <div className="space-y-5 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#E4002B]/20 border border-[#E4002B]/40 rounded-full w-fit">
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-[#F5A300]" />
                <span className="text-xs sm:text-sm font-semibold text-[#F5A300]">
                  Sabor Auténtico
                </span>
              </div>

              <div className="space-y-2 sm:space-y-4">
                <h1 className="text-[clamp(2.5rem,12vw,3.35rem)] sm:text-6xl md:text-7xl font-black leading-[1.05] sm:leading-tight">
                  <span className="block text-white">Sabor que</span>
                  <span className="block text-white">se vive en</span>
                  <span className="block bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-[#F5A300] bg-clip-text text-transparent">
                    LA FORTUNA
                  </span>
                </h1>
              </div>

              <p className="text-[15px] sm:text-base md:text-lg text-white/90 max-w-lg leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                Pizzas artesanales hechas a la leña, cortes de carne premium preparados a la parrilla y nuestra costilla horneada lentamente durante 4 horas, en el corazón del Mercadito Arenal.
              </p>

              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Link
                  to="/menu"
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#E4002B] to-[#F5A300] hover:shadow-2xl hover:shadow-[#E4002B]/50 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  ORDENAR AHORA
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/menu"
                  className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#F5A300] text-[#F5A300] hover:bg-[#F5A300]/10 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 text-center"
                >
                  VER MENÚ
                </Link>
              </div>

              <AnimatedHighlights />
            </div>

            {/* ===== PIZZA DESTACADA DESDE EL BACKEND ===== */}
            <div className="flex min-h-[600px] items-start justify-center md:justify-end">
              {cargandoProductoDestacado ? (
                <div className="relative flex h-[600px] w-full max-w-[360px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-2xl backdrop-blur-xl">
                  <div className="h-52 shrink-0 animate-pulse bg-white/10 lg:h-56" />

                  <div className="flex flex-1 flex-col space-y-4 p-5 sm:p-6">
                    <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                    <div className="h-7 w-48 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
                    <div className="h-16 w-full animate-pulse rounded-xl bg-white/10" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                      <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                    </div>
                    <div className="mt-auto h-12 w-full animate-pulse rounded-xl bg-white/10" />
                  </div>
                </div>
              ) : productoDestacado ? (
                <div className="group relative flex h-[600px] w-full max-w-[360px] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#17110e]/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-[#F5A300]/45 hover:shadow-[0_35px_90px_rgba(245,163,0,0.16)]">
                  <div className="pointer-events-none absolute -right-16 -top-16 z-10 h-40 w-40 rounded-full bg-[#F5A300]/20 blur-3xl transition-all duration-500 group-hover:bg-[#F5A300]/30" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 z-10 h-44 w-44 rounded-full bg-[#E4002B]/15 blur-3xl" />

                  <div className="relative h-52 shrink-0 overflow-hidden bg-black/30 lg:h-56">
                    {productoDestacado.imagen_url ? (
                      <img
                        src={
                          usarImagenDestacadaOptimizada
                            ? imagenDestacada480
                            : productoDestacado.imagen_url
                        }
                        srcSet={
                          usarImagenDestacadaOptimizada
                            ? `${imagenDestacada240} 240w, ${imagenDestacada480} 480w, ${imagenDestacada640} 640w`
                            : undefined
                        }
                        sizes="(max-width: 767px) calc(100vw - 32px), 360px"
                        alt={productoDestacado.nombre}
                        width="640"
                        height="480"
                        loading="lazy"
                        fetchPriority="low"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(event) => {
                          const imagen =
                            event.currentTarget

                          if (
                            imagen.dataset
                              .fallbackAplicado ===
                            'true'
                          ) {
                            return
                          }

                          imagen.dataset
                            .fallbackAplicado =
                            'true'

                          imagen.removeAttribute(
                            'srcset'
                          )

                          imagen.src =
                            productoDestacado
                              .imagen_url
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-7xl text-white/20">
                        🍕
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#17110e] via-black/15 to-transparent" />

                    

                
                  </div>

                  <div className="relative z-20 flex flex-1 flex-col p-5 sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5A300]">
                      La favorita de muchos
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-white transition-colors duration-300 group-hover:text-[#F5A300]">
                      {productoDestacado.nombre}
                    </h3>

                    <p className="mt-3 min-h-[3.75rem] line-clamp-3 text-sm leading-relaxed text-white/60">
                      {productoDestacado.descripcion}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-1" aria-label="Cinco estrellas">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className="h-4 w-4 fill-[#F5A300] text-[#F5A300] drop-shadow-[0_0_6px_rgba(245,163,0,0.55)]"
                          />
                        ))}
                      </div>

                      <span className="text-xs font-semibold text-white/45">
                        Favorita local
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                          Grande
                        </p>
                        <p className="mt-1 whitespace-nowrap font-mono text-lg font-black text-[#F5A300]">
                          ₡{formatearPrecio(productoDestacado.precio)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                          Personal
                        </p>
                        <p className="mt-1 whitespace-nowrap font-mono text-lg font-black text-white">
                          {productoDestacado.precio_personal
                            ? `₡${formatearPrecio(productoDestacado.precio_personal)}`
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>

                    {productoDestacado.estado === 'disponible' ? (
                      <Link
                        to="/menu"
                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-black/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#E4002B]/30"
                      >
                        VER EN EL MENÚ
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    ) : (
                      <div className="mt-auto rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-center text-sm font-bold text-red-200">
                        Temporalmente agotada
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-[600px] w-full max-w-[360px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-black/35 p-6 text-center shadow-2xl backdrop-blur-xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5A300]/10 text-3xl">
                    🍕
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-white">
                    Pizza destacada
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {errorProductoDestacado
                      ? 'No pudimos cargarla en este momento.'
                      : 'La información no está disponible.'}
                  </p>

                  <Link
                    to="/menu"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#F5A300] hover:underline"
                  >
                    Ver menú
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== TRANSICIÓN ===== */}
        <div className="absolute bottom-0 left-0 w-full h-48 sm:h-64 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#120C08]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-32 sm:h-40 bg-red-600/20 blur-[80px] sm:blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[500px] h-20 sm:h-24 bg-orange-400/20 blur-[60px] sm:blur-[80px]" />
          <div className="absolute bottom-0 left-[10%] w-40 sm:w-52 h-40 sm:h-52 bg-white/10 rounded-full blur-[60px] sm:blur-[80px] animate-pulse" />
          <div className="absolute bottom-0 left-[45%] w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-[70px] sm:blur-[90px] animate-pulse delay-500" />
          <div className="absolute bottom-0 left-[75%] w-44 sm:w-56 h-44 sm:h-56 bg-white/10 rounded-full blur-[65px] sm:blur-[85px] animate-pulse delay-1000" />
          {/* Algunas chispas pequeñas en la transición */}
          <div className="absolute bottom-8 sm:bottom-10 left-[15%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-orange-400 rounded-full shadow-[0_0_15px_#f59e0b] animate-ping" />
          <div className="absolute bottom-12 sm:bottom-16 left-[35%] w-1 sm:w-1.5 h-1 sm:h-1.5 bg-red-500 rounded-full shadow-[0_0_15px_#ef4444] animate-pulse" />
          <div className="absolute bottom-6 sm:bottom-8 left-[55%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-orange-300 rounded-full shadow-[0_0_15px_#fdba74] animate-ping" />
          <div className="absolute bottom-10 sm:bottom-14 left-[75%] w-1 sm:w-1.5 h-1 sm:h-1.5 bg-orange-500 rounded-full shadow-[0_0_15px_#f97316] animate-pulse" />
          <div className="absolute bottom-4 sm:bottom-6 left-[90%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15] animate-ping" />
          <div className="absolute bottom-20 left-[25%] w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_18px_#fb923c] animate-bounce" />
          <div className="absolute bottom-24 left-[65%] w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_12px_#fde047] animate-ping delay-300" />
          <div className="absolute bottom-16 left-[45%] w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_20px_#ea580c] animate-pulse delay-700" />
        </div>

        <svg
          className="absolute bottom-0 left-0 w-full -mb-1"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ zIndex: 5 }}
        >
          <path
            d="M0,40 Q300,0 600,40 T1200,40 L1200,120 L0,120 Z"
            fill="#120C08"
          />
          <path
            d="M0,50 Q300,20 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="#120C08"
            opacity="0.8"
          />
        </svg>
      </section>

      {/* ==================== ESPECIALIDADES ==================== */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#120C08] via-[#120C08] to-[#0a0604] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-red-600/30 rounded-full blur-[100px] sm:blur-[150px] animate-pulse" />
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-orange-500/35 rounded-full blur-[80px] sm:blur-[120px] animate-pulse delay-700" />
          <div className="absolute -top-10 -right-20 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-yellow-500/25 rounded-full blur-[70px] sm:blur-[110px] animate-pulse delay-1000" />
          <div className="absolute top-1/4 left-1/5 w-60 sm:w-80 h-60 sm:h-80 bg-gradient-to-t from-orange-600 to-red-500 rounded-full blur-[60px] sm:blur-[80px] opacity-60 animate-pulse" />
          <div className="absolute top-1/3 right-1/5 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-t from-red-600 to-orange-500 rounded-full blur-[70px] sm:blur-[90px] opacity-55 animate-pulse delay-500" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full blur-[50px] sm:blur-[70px] opacity-50 animate-pulse delay-300" />
          <div className="absolute -top-20 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-white/15 rounded-full blur-[70px] sm:blur-[100px] animate-pulse delay-300" />
          <div className="absolute top-1/3 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-white/12 rounded-full blur-[65px] sm:blur-[95px] animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-1/2 w-56 sm:w-72 h-56 sm:h-72 bg-white/10 rounded-full blur-[60px] sm:blur-[85px] animate-pulse delay-500" />
        </div>

        {/* Chispas en especialidades (reducidas) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {CHISPAS_ESPECIALIDADES.map((spark) => (
            <div
              key={`esp-spark-${spark.id}`}
              className="absolute rounded-full bg-gradient-to-t from-orange-400 to-yellow-200 animate-spark"
              style={{
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay + 1}s`,
                animationDuration: `${spark.duration + 1}s`,
                boxShadow: '0 0 8px 2px rgba(251, 146, 60, 0.3)',
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 sm:mb-20 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-1.5 sm:py-2 bg-[#E4002B]/10 border border-[#E4002B]/30 rounded-full backdrop-blur-sm">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#F5A300] rounded-full animate-pulse" />
              <span className="text-[#F5A300] font-light text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                Nuestras colecciones
              </span>
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#F5A300] rounded-full animate-pulse delay-500" />
            </div>
            <h2 className="text-4xl xs:text-5xl sm:text-6xl font-light text-white tracking-tight">
              Experiencias de <span className="text-[#F5A300]">sabor</span>
            </h2>
            <div className="flex justify-center gap-2 sm:gap-3">
              <span className="w-8 sm:w-12 h-1 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
              <span className="w-8 sm:w-12 h-1 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
            </div>
            <p className="text-white/50 text-xs sm:text-sm max-w-md mx-auto">
              Descubre nuestras especialidades elaboradas con pasión y los mejores ingredientes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {ESPECIALIDADES_HOME.map((item, idx) => (
              <div key={idx} className="group relative">
                <div className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_12px_#fb923c] animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_10px_#fde047] animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200" />
                <div className="absolute top-1/3 -right-3 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_12px_#ea580c] animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-400" />

                <div className={`absolute -inset-1 bg-gradient-to-r ${item.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-[#F5A300]/30 transition-all duration-500 h-full flex flex-col">
                  <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                    <img
                      src={item.imagen640}
                      srcSet={`${item.imagen320} 320w, ${item.imagen640} 640w`}
                      sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 40px), 352px"
                      alt={item.titulo}
                      width="640"
                      height="480"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120C08] via-[#120C08]/60 to-transparent" />

                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110 group-hover:rotate-12">
                      {item.emoji}
                    </div>

                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-5xl sm:text-7xl font-black text-white/5 tracking-tighter">
                      0{idx + 1}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex-1 flex flex-col space-y-3 sm:space-y-4">
                    <h3 className="text-xl sm:text-2xl font-light text-white tracking-wide group-hover:text-[#F5A300] transition-colors duration-300">
                      {item.titulo}
                    </h3>
                    <p className="text-white/70 font-light text-sm sm:text-base leading-relaxed flex-1">
                      {item.descripcion}
                    </p>

                    <Link
                      to="/menu"
                      className="inline-flex items-center gap-3 text-[#F5A300] font-light text-xs sm:text-sm tracking-widest uppercase hover:gap-5 transition-all duration-300 group/link pt-2 border-t border-white/5"
                    >
                      <span>Explorar</span>
                      <span className="w-5 sm:w-6 h-[1px] bg-[#F5A300] group-hover/link:w-7 sm:group-hover/link:w-8 transition-all" />
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover/link:opacity-100 transition-all duration-300 -ml-2 group-hover/link:ml-0" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 sm:mt-32 flex justify-center items-center gap-4 sm:gap-6">
            <span className="w-16 sm:w-24 h-[1px] bg-gradient-to-r from-transparent to-[#F5A300]/30" />
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#F5A300]/50 rounded-full animate-pulse" />
            <span className="w-16 sm:w-24 h-[1px] bg-gradient-to-l from-transparent to-[#F5A300]/30" />
          </div>
        </div>
      </section>

      {/* ==================== MENÚ MODERNO CON IMÁGENES - MÁS GRANDE Y CENTRADO ==================== */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Fondo premium */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0604] via-[#120C08] to-[#0a0604] -z-10" />

        {/* Efectos de luz */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#F5A300]/5 rounded-full blur-[150px] -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-[#E4002B]/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#F5A300]/3 rounded-full blur-[100px] -z-10" />

        {/* Chispas en sección menú (reducidas) */}
        <div className="absolute inset-0 pointer-events-none">
          {CHISPAS_MENU.map((spark) => (
            <div
              key={`menu-spark-${spark.id}`}
              className="absolute rounded-full bg-orange-400 animate-float-spark"
              style={{
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay}s`,
                animationDuration: `${spark.duration}s`,
                boxShadow: '0 0 8px 2px rgba(251, 146, 60, 0.3)',
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Encabezado */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 border border-[#F5A300]/20 rounded-full backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-[#F5A300]" />
              <span className="text-[#F5A300] font-light text-xs tracking-[0.3em] uppercase">
                Navegación
              </span>
              <Sparkles className="w-4 h-4 text-[#F5A300]" />
            </div>

            <h2 className="text-4xl xs:text-5xl sm:text-6xl font-light text-white tracking-tight">
              <span className="text-white">Explora</span>{' '}
              <span className="bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-[#F5A300] bg-clip-text text-transparent">
                Rooster
              </span>
            </h2>

            <div className="flex justify-center gap-3 mt-6">
              <span className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
              <span className="w-2 h-2 bg-[#F5A300] rounded-full animate-pulse" />
              <span className="w-16 h-0.5 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
            </div>

            <p className="text-white/40 text-sm max-w-md mx-auto mt-6 font-light tracking-wide">
              Conoce todo lo que Rooster Pizza tiene para ti
            </p>
          </div>

          {/* Grid de menú moderno - más grande y centrado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {MENU_ITEMS_HOME.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`group relative p-8 bg-gradient-to-br ${item.color} backdrop-blur-sm border border-white/10 rounded-2xl hover:border-[#F5A300]/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F5A300]/20 overflow-hidden`}
              >
                {/* Número decorativo más grande */}
                <div className="absolute -top-8 -right-4 text-8xl font-black text-white/5 tracking-tighter select-none">
                  {item.number}
                </div>

                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F5A300]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                {/* Chispas hover (muy sutiles) */}
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_10px_#fb923c] animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_8px_#fde047] animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200" />

                {/* Imagen más grande */}
                <div className="relative mb-6 overflow-hidden rounded-xl aspect-[3/2]">
                  <img
                    src={item.imagen720}
                    srcSet={`${item.imagen360} 360w, ${item.imagen720} 720w`}
                    sizes="(max-width: 767px) calc(100vw - 96px), (max-width: 1023px) calc(50vw - 96px), 270px"
                    alt={item.label}
                    width="720"
                    height="480"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 right-3 text-4xl opacity-80">
                    {item.icon}
                  </div>
                </div>

                {/* Contenido con textos más grandes */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#F5A300] transition-colors duration-300 tracking-wide">
                    {item.label}
                  </h3>
                  <p className="text-white/60 text-base leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 group-hover:border-[#F5A300]/20 transition-all duration-300">
                  <div className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                    <span className="text-[11px] tracking-[0.3em] uppercase text-white/30 group-hover:text-[#F5A300]/60 transition-colors duration-300">
                      Explorar
                    </span>
                    <span className="flex-1 h-[1px] bg-gradient-to-r from-[#F5A300]/20 to-transparent group-hover:from-[#F5A300]/60 transition-all duration-300" />
                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-[#F5A300] group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ===== EL BOTÓN DE CARRITO HA SIDO ELIMINADO ===== */}

          <div className="mt-24 sm:mt-32 flex justify-center items-center gap-4 sm:gap-6">
            <span className="w-16 sm:w-24 h-[1px] bg-gradient-to-r from-transparent to-[#F5A300]/30" />
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#F5A300]/50 rounded-full" />
              <span className="w-1.5 h-1.5 bg-[#E4002B]/50 rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-[#F5A300]/50 rounded-full" />
            </div>
            <span className="w-16 sm:w-24 h-[1px] bg-gradient-to-l from-transparent to-[#F5A300]/30" />
          </div>
        </div>
      </section>


      {/* ==================== CTA FINAL ==================== */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 border-t border-white/10 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {CHISPAS_CTA.map((spark) => (
            <div
              key={`cta-spark-${spark.id}`}
              className="absolute rounded-full bg-orange-400 animate-float-spark"
              style={{
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay}s`,
                animationDuration: `${spark.duration}s`,
                boxShadow: '0 0 8px 2px rgba(251, 146, 60, 0.3)',
              }}
            />
          ))}
        </div>

        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 relative z-10">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black">
            <span className="text-white">¿Tienes </span>
            <span className="bg-gradient-to-r from-[#F5A300] to-[#E4002B] bg-clip-text text-transparent">
              hambre?
            </span>
          </h2>

          <p className="text-white/70 text-base sm:text-lg md:text-xl">
            Haz tu pedido ahora y disfruta de las mejores pizzas de La Fortuna, directamente desde nuestro horno artesanal.
          </p>

          <Link
            to="/menu"
            className="inline-block px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#F5A300] to-[#E4002B] hover:shadow-2xl hover:shadow-[#F5A300]/50 text-black font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 text-base sm:text-lg md:text-xl relative"
          >
            ORDENAR AHORA
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_12px_#fde047] animate-ping" />
          </Link>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6 bg-black/30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {CHISPAS_FOOTER.map((spark) => (
            <div
              key={`footer-spark-${spark.id}`}
              className="absolute rounded-full bg-orange-400/50 animate-float-spark"
              style={{
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay}s`,
                animationDuration: `${spark.duration}s`,
                boxShadow: '0 0 6px 1px rgba(251, 146, 60, 0.2)',
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto text-center text-white/60 text-xs sm:text-sm relative z-10">
          <p>Rooster Pizza & Grill © 2026 | Mercadito Arenal, La Fortuna, Alajuela</p>
        </div>
      </footer>

      {/* ==================== ESTILOS PARA LAS CHISPAS ==================== */}
      <style>{`
        @keyframes spark {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1.5) rotate(45deg) translateY(-10px);
          }
          70% {
            opacity: 0.8;
            transform: scale(1) rotate(90deg) translateY(-20px);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(180deg) translateY(-40px);
          }
        }

        @keyframes float-spark {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0);
          }
          20% {
            opacity: 1;
            transform: translate(10px, -15px) scale(1.2);
          }
          50% {
            opacity: 0.9;
            transform: translate(-8px, -35px) scale(1);
          }
          80% {
            opacity: 0.6;
            transform: translate(15px, -50px) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(-5px, -70px) scale(0);
          }
        }

        .animate-spark {
          animation: spark linear infinite;
        }

        .animate-float-spark {
          animation: float-spark ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-spark,
          .animate-float-spark {
            animation: none !important;
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  )
}