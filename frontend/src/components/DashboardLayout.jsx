import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  ArrowLeft,
  BellRing,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import useAuthStore from '../store/authStore'
import api from '../api/axios'
import logoRooster from '../assets/logodef.jpeg'

const INTERVALO_MENSAJES = 5000
const DURACION_ALERTA = 12000

/*
|--------------------------------------------------------------------------
| AUDIO GLOBAL
|--------------------------------------------------------------------------
|
| Estas variables quedan fuera del componente para conservar el audio
| cuando el administrador cambia entre páginas del Dashboard.
|
*/

let audioContextGlobal = null
/*
 * El botón aparece activo desde que se abre cualquier panel.
 * El AudioContext se habilita con la primera interacción permitida
 * por el navegador.
 */
let alertasSonidoActivasGlobal = true

const NOMBRES_ROL = {
  admin: 'Administrador',
  administrador: 'Administrador',
  cocina: 'Cocina',
  caja: 'Caja',
}


function obtenerRolUsuario(user) {
  const rol =
    user?.rol?.nombre ??
    user?.rol?.name ??
    user?.rol ??
    user?.role ??
    ''

  return String(rol)
    .trim()
    .toLowerCase()
}

function obtenerAudioContext() {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  if (
    !audioContextGlobal ||
    audioContextGlobal.state ===
      'closed'
  ) {
    audioContextGlobal =
      new AudioContextClass()
  }

  return audioContextGlobal
}

function DashboardLayout({
  children,
  titulo,
  acciones,
  dark = false,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const user = useAuthStore(
    (state) => state.user
  )

  const logoutStore = useAuthStore(
    (state) => state.logout
  )

  const [
    mensajesNuevos,
    setMensajesNuevos,
  ] = useState(0)

  const [
    alertaMensaje,
    setAlertaMensaje,
  ] = useState(null)

  const [
    sonidoActivo,
    setSonidoActivo,
  ] = useState(
    alertasSonidoActivasGlobal
  )

  const [
    errorAlertas,
    setErrorAlertas,
  ] = useState('')

  const ultimoMensajeIdRef =
    useRef(null)

  const solicitudResumenRef =
    useRef(false)

  const alertaTimeoutRef =
    useRef(null)

  const tituloTimeoutRef =
    useRef(null)

  const tituloOriginalRef =
    useRef('')

  const rolNormalizado =
    obtenerRolUsuario(user)

  const esAdministrador =
    rolNormalizado === 'admin' ||
    rolNormalizado ===
      'administrador'

  /*
   * Las páginas administrativas que tienen una ruta propia
   * (/admin/productos, /admin/horario y /admin/mensajes)
   * muestran automáticamente un botón para volver al Dashboard.
   *
   * Las vistas internas de AdminDashboard continúan usando
   * su propio botón porque permanecen en la ruta /admin.
   */
  const mostrarVolverAdmin =
    esAdministrador &&
    location.pathname.startsWith(
      '/admin/'
    )

  /*
  |--------------------------------------------------------------------------
  | CERRAR SESIÓN
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch (err) {
      console.error(
        'Error al cerrar sesión en el servidor:',
        err
      )
    } finally {
      logoutStore()

      navigate('/login', {
        replace: true,
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INICIALES DEL USUARIO
  |--------------------------------------------------------------------------
  */

  const iniciales = (
    user?.name || '?'
  )
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  /*
  |--------------------------------------------------------------------------
  | REPRODUCIR ALERTA
  |--------------------------------------------------------------------------
  */

  const reproducirAlerta =
    useCallback(() => {
      if (
        !alertasSonidoActivasGlobal
      ) {
        return
      }

      const contexto =
        obtenerAudioContext()

      if (
        !contexto ||
        contexto.state !== 'running'
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
            indice * 0.18

          const final =
            comienzo + 0.15

          oscilador.type = 'sine'

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
              0.25,
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
    }, [])

  /*
  |--------------------------------------------------------------------------
  | PREPARAR AUDIO AL ENTRAR AL PANEL
  |--------------------------------------------------------------------------
  |
  | Los navegadores requieren una interacción antes de permitir audio.
  | El indicador inicia encendido y el contexto se prepara con el primer
  | clic o tecla dentro del sistema.
  |
  */

  useEffect(() => {
    if (
      !alertasSonidoActivasGlobal ||
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
        !alertasSonidoActivasGlobal
      ) {
        return
      }

      preparando = true

      try {
        const contexto =
          obtenerAudioContext()

        if (
          contexto &&
          contexto.state ===
            'suspended'
        ) {
          await contexto.resume()
        }

        if (
          contexto &&
          contexto.state ===
            'running'
        ) {
          setSonidoActivo(true)
          setErrorAlertas('')
          quitarEventos()
        }
      } catch (err) {
        console.warn(
          'El navegador todavía no permitió preparar el audio:',
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
  }, [])

  /*
  |--------------------------------------------------------------------------
  | ACTIVAR O DESACTIVAR SONIDO
  |--------------------------------------------------------------------------
  */

  const cambiarEstadoSonido =
    async () => {
      if (
        alertasSonidoActivasGlobal
      ) {
        alertasSonidoActivasGlobal =
          false

        setSonidoActivo(false)

        return
      }

      const contexto =
        obtenerAudioContext()

      if (!contexto) {
        setErrorAlertas(
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

        alertasSonidoActivasGlobal =
          true

        setSonidoActivo(true)
        setErrorAlertas('')

        /*
         * Sonido corto para confirmar
         * que las alertas quedaron activas.
         */
        reproducirAlerta()

        /*
         * Solicitar permiso para mostrar
         * notificaciones del navegador.
         */
        if (
          'Notification' in window &&
          window.Notification
            .permission ===
            'default'
        ) {
          await window.Notification
            .requestPermission()
        }
      } catch (err) {
        console.error(
          'No se pudieron activar las alertas:',
          err
        )

        alertasSonidoActivasGlobal =
          false

        setSonidoActivo(false)

        setErrorAlertas(
          'No se pudieron activar las alertas. Revisa los permisos del navegador.'
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | MOSTRAR ALERTA GENERAL
  |--------------------------------------------------------------------------
  */

  const mostrarAlertaMensaje =
    useCallback(
      (datosResumen) => {
        const ultimo =
          datosResumen
            ?.ultimo_nuevo

        const alerta = {
          id:
            ultimo?.id ??
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
            'Se recibió un nuevo mensaje de contacto.',
        }

        setAlertaMensaje(alerta)

        reproducirAlerta()

        /*
         * Notificación propia del navegador.
         */
        if (
          'Notification' in window &&
          window.Notification
            .permission ===
            'granted'
        ) {
          const notificacion =
            new window.Notification(
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

              navigate(
                '/admin/mensajes'
              )

              notificacion.close()
            }
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
            setAlertaMensaje(null)

            alertaTimeoutRef.current =
              null
          }, DURACION_ALERTA)

        tituloTimeoutRef.current =
          setTimeout(() => {
            document.title =
              tituloOriginalRef.current

            tituloTimeoutRef.current =
              null
          }, DURACION_ALERTA)
      },
      [
        navigate,
        reproducirAlerta,
      ]
    )

  /*
  |--------------------------------------------------------------------------
  | OCULTAR ALERTA
  |--------------------------------------------------------------------------
  */

  const ocultarAlerta = () => {
    setAlertaMensaje(null)

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

    document.title =
      tituloOriginalRef.current
  }

  /*
  |--------------------------------------------------------------------------
  | CONSULTAR RESUMEN DE MENSAJES
  |--------------------------------------------------------------------------
  */

  const cargarResumenMensajes =
    useCallback(
      async (
        detectarNuevos = false
      ) => {
        if (
          !esAdministrador ||
          solicitudResumenRef.current
        ) {
          return
        }

        solicitudResumenRef.current =
          true

        try {
          const response =
            await api.get(
              '/admin/mensajes-contacto/resumen'
            )

          const datos =
            response.data || {}

          const cantidadNuevos =
            Number(
              datos.nuevos
            ) || 0

          const ultimoId =
            Number(
              datos
                .ultimo_mensaje_id
            ) || 0

          setMensajesNuevos(
            cantidadNuevos
          )

          /*
           * La primera carga solamente registra
           * el último mensaje existente.
           *
           * No debe sonar por mensajes viejos.
           */
          if (
            ultimoMensajeIdRef.current ===
            null
          ) {
            ultimoMensajeIdRef.current =
              ultimoId

            return
          }

          const idAnterior =
            Number(
              ultimoMensajeIdRef
                .current
            ) || 0

          if (
            detectarNuevos &&
            ultimoId > idAnterior
          ) {
            /*
             * AdminMensajes ya tiene su propia
             * alerta detallada.
             *
             * Evitamos duplicarla cuando el
             * administrador ya está en esa página.
             */
            if (
              location.pathname !==
              '/admin/mensajes'
            ) {
              mostrarAlertaMensaje(
                datos
              )
            }
          }

          if (
            ultimoId > idAnterior
          ) {
            ultimoMensajeIdRef.current =
              ultimoId
          }
        } catch (err) {
          console.error(
            'Error al consultar mensajes nuevos:',
            err
          )
        } finally {
          solicitudResumenRef.current =
            false
        }
      },
      [
        esAdministrador,
        location.pathname,
        mostrarAlertaMensaje,
      ]
    )

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    tituloOriginalRef.current =
      document.title

    if (esAdministrador) {
      cargarResumenMensajes(false)
    }
  }, [
    esAdministrador,
    cargarResumenMensajes,
  ])

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZACIÓN AUTOMÁTICA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!esAdministrador) {
      return undefined
    }

    const actualizar =
      () => {
        if (
          document.visibilityState !==
          'visible'
        ) {
          return
        }

        cargarResumenMensajes(true)
      }

    const intervalo =
      setInterval(
        actualizar,
        INTERVALO_MENSAJES
      )

    return () => {
      clearInterval(intervalo)
    }
  }, [
    esAdministrador,
    cargarResumenMensajes,
  ])

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR AL VOLVER A LA PESTAÑA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!esAdministrador) {
      return undefined
    }

    const actualizarAlVolver =
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          cargarResumenMensajes(true)
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
    esAdministrador,
    cargarResumenMensajes,
  ])

  /*
  |--------------------------------------------------------------------------
  | LIMPIAR TEMPORIZADORES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
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
        tituloOriginalRef.current
      ) {
        document.title =
          tituloOriginalRef.current
      }
    }
  }, [])

  return (
    <div
      className={`min-h-screen font-sans ${
        dark
          ? 'bg-[#120C08]'
          : 'bg-[#F7F5F2]'
      }`}
    >
      {/* ALERTA FLOTANTE GLOBAL */}
      {alertaMensaje && (
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
                ¡Nuevo mensaje de contacto!
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-[#F5A300]">
                {alertaMensaje.nombre}
              </p>

              <p className="mt-1 line-clamp-1 text-xs font-medium text-white/70">
                {alertaMensaje.asunto}
              </p>

              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">
                {alertaMensaje.mensaje}
              </p>

              <button
                type="button"
                onClick={() => {
                  ocultarAlerta()

                  navigate(
                    '/admin/mensajes'
                  )
                }}
                className="mt-3 rounded-lg bg-[#E4002B] px-3 py-2 text-xs font-black text-white transition hover:bg-[#F5A300] hover:text-black"
              >
                Ver mensaje
              </button>
            </div>

            <button
              type="button"
              onClick={ocultarAlerta}
              className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar alerta"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-30 border-b shadow-sm ${
          dark
            ? 'border-white/10 bg-black/70 backdrop-blur-xl'
            : 'border-[#E5E2DC] bg-white'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* LOGO */}
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoRooster}
              alt="Rooster CR"
              className="h-9 w-9 shrink-0 rounded-md object-cover"
            />

            <span
              className={`whitespace-nowrap font-mono text-sm font-bold tracking-tight ${
                dark
                  ? 'text-white'
                  : 'text-[#1A1A1A]'
              }`}
            >
              ROOSTER{' '}

              <span className="text-[#E4002B]">
                CR
              </span>
            </span>
          </div>

          {/* USUARIO Y ACCIONES */}
          <div className="flex items-center gap-2 sm:gap-3">
            {esAdministrador && (
              <button
                type="button"
                onClick={
                  cambiarEstadoSonido
                }
                title={
                  sonidoActivo
                    ? 'Desactivar alertas de sonido'
                    : 'Activar alertas de sonido'
                }
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  sonidoActivo
                    ? 'border-[#F5A300]/60 bg-[#F5A300]/15 text-[#F5A300]'
                    : dark
                      ? 'border-white/15 bg-white/5 text-white/50 hover:border-[#F5A300]/40 hover:text-[#F5A300]'
                      : 'border-[#E5E2DC] bg-[#F7F5F2] text-[#6B6862] hover:text-[#E4002B]'
                }`}
              >
                {sonidoActivo ? (
                  <Volume2 size={17} />
                ) : (
                  <VolumeX size={17} />
                )}
              </button>
            )}

            {esAdministrador && (
              <Link
                to="/admin/mensajes"
                title="Centro de mensajes"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  dark
                    ? 'border-white/15 bg-white/5 text-white/60 hover:border-[#F5A300]/40 hover:text-[#F5A300]'
                    : 'border-[#E5E2DC] bg-[#F7F5F2] text-[#6B6862] hover:text-[#E4002B]'
                }`}
              >
                <BellRing size={17} />

                {mensajesNuevos > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#120C08] bg-[#E4002B] px-1 text-[9px] font-black leading-none text-white shadow-lg">
                    {mensajesNuevos >
                    99
                      ? '99+'
                      : mensajesNuevos}
                  </span>
                )}
              </Link>
            )}

            <div className="hidden text-right sm:block">
              <p
                className={`text-sm font-semibold leading-none ${
                  dark
                    ? 'text-white'
                    : 'text-[#1A1A1A]'
                }`}
              >
                {user?.name}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase leading-none tracking-wide text-[#F5A300]">
                {NOMBRES_ROL[
                  rolNormalizado
                ] || rolNormalizado}
              </p>
            </div>

            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                dark
                  ? 'border border-white/20 bg-white/10'
                  : 'bg-[#1A1A1A]'
              }`}
            >
              <span className="font-mono text-xs font-bold text-white">
                {iniciales}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={`whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold transition-colors sm:px-3 ${
                dark
                  ? 'text-white/70 hover:bg-white/10 hover:text-[#F5A300]'
                  : 'text-[#6B6862] hover:bg-[#F7F5F2] hover:text-[#E4002B]'
              }`}
            >
              Salir
            </button>
          </div>
        </div>

        {/* ERROR DE ALERTAS */}
        {errorAlertas && (
          <div className="border-t border-red-500/20 bg-red-500/10">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-2">
              <p className="text-xs font-semibold text-red-300">
                {errorAlertas}
              </p>

              <button
                type="button"
                onClick={() =>
                  setErrorAlertas('')
                }
                className="text-red-300/60 hover:text-red-200"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        <div className="h-[3px] bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />
      </header>

      <main
        className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 ${
          dark
            ? 'min-h-[calc(100vh-67px)] bg-[radial-gradient(circle_at_top,#5c2f1f_0%,#120C08_45%,#050505_100%)]'
            : ''
        }`}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className={`text-2xl font-semibold tracking-tight ${
              dark
                ? 'text-white'
                : 'text-[#1A1A1A]'
            }`}
          >
            {titulo}
          </h2>

          {(mostrarVolverAdmin ||
            acciones) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {mostrarVolverAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    navigate('/admin')
                  }
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    dark
                      ? 'border-white/10 bg-white/5 text-white/55 hover:border-[#F5A300]/35 hover:bg-[#F5A300]/10 hover:text-[#F5A300]'
                      : 'border-[#E5E2DC] bg-white text-[#6B6862] hover:border-[#E4002B]/30 hover:bg-[#E4002B]/5 hover:text-[#E4002B]'
                  }`}
                >
                  <ArrowLeft size={16} />

                  <span className="hidden sm:inline">
                    Volver
                  </span>
                </button>
              )}

              {acciones}
            </div>
          )}
        </div>

        {children}
      </main>

      {/*
        El estilo se monta únicamente mientras DashboardLayout está activo.
        De esta manera los módulos privados tienen scroll suave y una barra
        discreta con la identidad visual de Rooster sin modificar las páginas
        públicas.
      */}
      <style>{`
        html {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color:
            rgba(245, 163, 0, 0.72)
            #090705;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        html::-webkit-scrollbar-track,
        body::-webkit-scrollbar-track {
          background: #090705;
        }

        html::-webkit-scrollbar-thumb,
        body::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(245, 163, 0, 0.82),
            rgba(228, 0, 43, 0.72)
          );
          border: 2px solid #090705;
          border-radius: 999px;
        }

        html::-webkit-scrollbar-thumb:hover,
        body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(245, 163, 0, 1),
            rgba(228, 0, 43, 0.92)
          );
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout