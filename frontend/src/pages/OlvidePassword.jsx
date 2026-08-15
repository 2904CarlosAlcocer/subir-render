import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Send,
} from 'lucide-react'

import api from '../api/axios'
import fondoPrincipal from '../assets/fondoPrincipal1.png'
import logoRooster from '../assets/logodef.jpeg'

export default function OlvidePassword() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviarSolicitud = async (event) => {
    event.preventDefault()

    setMensaje('')
    setError('')

    const correoLimpio = email.trim().toLowerCase()

    if (!correoLimpio) {
      setError('Debes ingresar tu correo electrónico.')
      return
    }

    setEnviando(true)

    try {
      const response = await api.post('/forgot-password', {
        email: correoLimpio,
      })

      setMensaje(
        response.data.message ||
          'Si el correo está registrado, recibirás un enlace de recuperación.'
      )
    } catch (err) {
      const mensajeServidor =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message

      setError(
        mensajeServidor ||
          'No se pudo enviar el enlace. Intenta nuevamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  const reiniciarFormulario = () => {
    setMensaje('')
    setError('')
    setEmail('')
  }

  return (
    <main className="fixed inset-0 z-[9999] overflow-y-auto bg-[#120C08]">
      {/* Imagen de fondo */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${fondoPrincipal})`,
        }}
      />

      {/* Capa oscura que cubre toda la pantalla */}
      <div className="fixed inset-0 bg-black/80" />

      {/* Efectos de luz */}
      <div className="fixed left-1/4 top-10 h-56 w-56 rounded-full bg-[#E80000]/10 blur-3xl" />

      <div className="fixed bottom-10 right-1/4 h-56 w-56 rounded-full bg-[#FF6B00]/10 blur-3xl" />

      {/* Contenedor */}
      <div className="relative z-10 flex min-h-full w-full justify-center px-4 py-8">
        <section className="my-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#120C08]/90 shadow-2xl shadow-black/70 backdrop-blur-xl">
            {/* Línea superior */}
            <div className="h-2 bg-gradient-to-r from-[#E80000] via-[#FF6B00] to-[#E80000]" />

            <div className="px-6 py-7 sm:px-8">
              {/* Encabezado */}
              <div className="mb-6 flex flex-col items-center text-center">
                <img
                  src={logoRooster}
                  alt="Logo de Rooster CR"
                  className="mb-3 h-20 w-20 rounded-full border border-white/15 object-cover drop-shadow-lg"
                />

                <span className="mb-3 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FFB15C]">
                  Seguridad de cuenta
                </span>

                <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Recuperar contraseña
                </h1>

                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
                  Ingresa el correo asociado a tu cuenta y te enviaremos un
                  enlace seguro para establecer una nueva contraseña.
                </p>
              </div>

              {mensaje ? (
                <div className="space-y-5">
                  {/* Mensaje exitoso */}
                  <div className="rounded-2xl border border-green-500/35 bg-green-500/10 px-5 py-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-400 text-green-400">
                      <CheckCircle2 size={27} />
                    </div>

                    <h2 className="text-lg font-bold text-white">
                      Revisa tu correo
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-green-100/80">
                      {mensaje}
                    </p>

                    <p className="mt-3 text-xs text-white/45">
                      Revisa también las carpetas de spam y promociones.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={reiniciarFormulario}
                    className="
                      w-full rounded-xl
                      border border-white/15
                      bg-white/5
                      px-4 py-3
                      text-sm font-bold text-white
                      transition
                      hover:border-[#FF6B00]/50
                      hover:bg-white/10
                    "
                  >
                    Enviar a otro correo
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={enviarSolicitud}
                  className="space-y-5"
                >
                  {/* Correo */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Correo electrónico
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        required
                        autoComplete="email"
                        disabled={enviando}
                        placeholder="correo@ejemplo.com"
                        className="
                          w-full rounded-xl
                          border border-white/20
                          bg-white/95
                          py-3.5 pl-12 pr-4
                          text-gray-900
                          placeholder:text-gray-400
                          outline-none
                          transition
                          focus:border-[#FF6B00]
                          focus:ring-2
                          focus:ring-[#FF6B00]/30
                          disabled:cursor-not-allowed
                          disabled:opacity-70
                        "
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200"
                    >
                      {error}
                    </div>
                  )}

                  {/* Botón */}
                  <button
                    type="submit"
                    disabled={enviando}
                    className="
                      flex w-full items-center justify-center gap-2
                      rounded-xl
                      bg-gradient-to-r
                      from-[#E80000]
                      to-[#FF6B00]
                      px-4 py-3.5
                      text-sm font-black uppercase
                      tracking-wide text-white
                      transition-all
                      hover:shadow-lg
                      hover:shadow-[#E80000]/30
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {enviando ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar enlace
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Regresar */}
              <div className="mt-6 border-t border-white/10 pt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-[#FF6B00]"
                >
                  <ArrowLeft size={17} />
                  Volver a iniciar sesión
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-white/40">
            El enlace de recuperación es temporal y solo puede utilizarse una
            vez.
          </p>
        </section>
      </div>
    </main>
  )
}