import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from 'lucide-react'

import api from '../api/axios'
import fondoPrincipal from '../assets/fondoPrincipal1.png'
import logoRooster from '../assets/logodef.jpeg'

export default function RestablecerPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')?.trim() || ''
  const email =
    searchParams.get('email')?.trim().toLowerCase() || ''

  const [formulario, setFormulario] = useState({
    password: '',
    password_confirmation: '',
  })

  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const enlaceValido = Boolean(token && email)

  const manejarCambio = (event) => {
    const { name, value } = event.target

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: value,
    }))

    setError('')
  }

  const obtenerPrimerError = (errores) => {
    if (!errores || typeof errores !== 'object') {
      return null
    }

    const primerGrupo = Object.values(errores)[0]

    if (Array.isArray(primerGrupo)) {
      return primerGrupo[0]
    }

    if (typeof primerGrupo === 'string') {
      return primerGrupo
    }

    return null
  }

  const validarFormulario = () => {
    const password = formulario.password
    const confirmacion = formulario.password_confirmation

    if (!enlaceValido) {
      return 'El enlace de recuperación no es válido.'
    }

    if (!password) {
      return 'Debes ingresar una nueva contraseña.'
    }

    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }

    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)) {
      return 'La contraseña debe contener al menos una letra.'
    }

    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe contener al menos un número.'
    }

    if (!confirmacion) {
      return 'Debes confirmar la nueva contraseña.'
    }

    if (password !== confirmacion) {
      return 'Las contraseñas no coinciden.'
    }

    return null
  }

  const restablecerPassword = async (event) => {
    event.preventDefault()

    setError('')
    setMensajeExito('')

    const errorValidacion = validarFormulario()

    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setCargando(true)

    try {
      const response = await api.post('/reset-password', {
        token,
        email,
        password: formulario.password,
        password_confirmation:
          formulario.password_confirmation,
      })

      setMensajeExito(
        response.data.message ||
          'Tu contraseña fue actualizada correctamente.'
      )

      setFormulario({
        password: '',
        password_confirmation: '',
      })
    } catch (err) {
      const respuestaServidor = err.response?.data

      const primerError = obtenerPrimerError(
        respuestaServidor?.errors
      )

      setError(
        primerError ||
          respuestaServidor?.message ||
          'No fue posible restablecer la contraseña.'
      )
    } finally {
      setCargando(false)
    }
  }

  if (mensajeExito) {
    return (
      <main className="fixed inset-0 z-[9999] overflow-y-auto bg-[#120C08]">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${fondoPrincipal})`,
          }}
        />

        <div className="fixed inset-0 bg-black/80" />

        <div className="fixed left-1/4 top-10 h-56 w-56 rounded-full bg-[#E80000]/10 blur-3xl" />

        <div className="fixed bottom-10 right-1/4 h-56 w-56 rounded-full bg-[#FF6B00]/10 blur-3xl" />

        <div className="relative z-10 flex min-h-full w-full justify-center px-4 py-8">
          <section className="my-auto w-full max-w-md">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#120C08]/90 shadow-2xl shadow-black/70 backdrop-blur-xl">
              <div className="h-2 bg-gradient-to-r from-[#E80000] via-[#FF6B00] to-[#E80000]" />

              <div className="px-6 py-8 text-center sm:px-8">
                <img
                  src={logoRooster}
                  alt="Logo de Rooster CR"
                  className="mx-auto mb-4 h-20 w-20 rounded-full border border-white/15 object-cover drop-shadow-lg"
                />

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-400 bg-green-500/10 text-green-400">
                  <CheckCircle2 size={35} />
                </div>

                <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Contraseña actualizada
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-green-100/80">
                  {mensajeExito}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Los accesos anteriores fueron cerrados. Inicia sesión
                  nuevamente con tu nueva contraseña.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="
                    mt-7 flex w-full items-center justify-center gap-2
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
                  "
                >
                  <KeyRound size={18} />
                  Ir a iniciar sesión
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
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

      {/* Capa oscura */}
      <div className="fixed inset-0 bg-black/80" />

      {/* Efectos */}
      <div className="fixed left-1/4 top-10 h-56 w-56 rounded-full bg-[#E80000]/10 blur-3xl" />

      <div className="fixed bottom-10 right-1/4 h-56 w-56 rounded-full bg-[#FF6B00]/10 blur-3xl" />

      <div className="relative z-10 flex min-h-full w-full justify-center px-4 py-8">
        <section className="my-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#120C08]/90 shadow-2xl shadow-black/70 backdrop-blur-xl">
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
                  Nueva contraseña
                </h1>

                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
                  Crea una nueva contraseña para recuperar el acceso a
                  tu cuenta de Rooster CR.
                </p>
              </div>

              {!enlaceValido ? (
                <div className="space-y-5">
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/40 bg-red-500/15 px-5 py-5 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-400 text-red-400">
                      <AlertCircle size={27} />
                    </div>

                    <h2 className="text-lg font-bold text-white">
                      Enlace no válido
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-red-100/80">
                      El enlace no contiene el token o el correo
                      necesario para cambiar la contraseña.
                    </p>
                  </div>

                  <Link
                    to="/olvide-contrasena"
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
                    "
                  >
                    Solicitar un nuevo enlace
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={restablecerPassword}
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

                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="
                        w-full cursor-not-allowed rounded-xl
                        border border-white/15
                        bg-white/10
                        px-4 py-3.5
                        text-white/60
                        outline-none
                      "
                    />
                  </div>

                  {/* Nueva contraseña */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Nueva contraseña
                    </label>

                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                      <input
                        id="password"
                        name="password"
                        type={
                          mostrarPassword ? 'text' : 'password'
                        }
                        value={formulario.password}
                        onChange={manejarCambio}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        disabled={cargando}
                        placeholder="Mínimo 8 caracteres"
                        className="
                          w-full rounded-xl
                          border border-white/20
                          bg-white/95
                          py-3.5 pl-12 pr-12
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

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarPassword(
                            (valorActual) => !valorActual
                          )
                        }
                        disabled={cargando}
                        aria-label={
                          mostrarPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#E80000]"
                      >
                        {mostrarPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmación */}
                  <div>
                    <label
                      htmlFor="password_confirmation"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Confirmar contraseña
                    </label>

                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                      <input
                        id="password_confirmation"
                        name="password_confirmation"
                        type={
                          mostrarConfirmacion
                            ? 'text'
                            : 'password'
                        }
                        value={
                          formulario.password_confirmation
                        }
                        onChange={manejarCambio}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        disabled={cargando}
                        placeholder="Repite la contraseña"
                        className="
                          w-full rounded-xl
                          border border-white/20
                          bg-white/95
                          py-3.5 pl-12 pr-12
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

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarConfirmacion(
                            (valorActual) => !valorActual
                          )
                        }
                        disabled={cargando}
                        aria-label={
                          mostrarConfirmacion
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#E80000]"
                      >
                        {mostrarConfirmacion ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Requisitos */}
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                      La contraseña debe tener:
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-white/50">
                      Al menos 8 caracteres, una letra y un número.
                    </p>
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
                    disabled={cargando}
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
                    {cargando ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <KeyRound size={18} />
                        Cambiar contraseña
                      </>
                    )}
                  </button>
                </form>
              )}

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
            El enlace es temporal y solamente puede utilizarse una vez.
          </p>
        </section>
      </div>
    </main>
  )
}