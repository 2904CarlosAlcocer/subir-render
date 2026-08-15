import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
} from 'lucide-react'

import api from '../api/axios'
import useAuthStore from '../store/authStore'
import fondoPrincipal from '../assets/fondoPrincipal1.png'
import logoRooster from '../assets/logodef.jpeg'

function Register() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((state) => state.login)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefono: '',
    password: '',
    password_confirmation: '',
  })

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [registroExitoso, setRegistroExitoso] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((datosActuales) => ({
      ...datosActuales,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (formData.password !== formData.password_confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setCargando(true)

    try {
      const datosRegistro = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      }

      const response = await api.post('/register', datosRegistro)

      const { user, token } = response.data

      if (!user || !token) {
        throw new Error(
          'El servidor no devolvió los datos necesarios para iniciar sesión.'
        )
      }

      loginStore(user, token)
      setRegistroExitoso(true)

      setTimeout(() => {
        navigate('/carrito', {
          replace: true,
        })
      }, 2000)
    } catch (err) {
      const erroresValidacion = err.response?.data?.errors

      if (erroresValidacion) {
        const primerError = Object.values(erroresValidacion)
          .flat()
          .find(Boolean)

        setError(
          primerError || 'Revisa los datos ingresados.'
        )
      } else if (err.response?.status === 422) {
        setError(
          err.response?.data?.message ||
            'Ya existe una cuenta con este correo electrónico.'
        )
      } else {
        setError(
          err.response?.data?.message ||
            'No se pudo conectar con el servidor. Intenta nuevamente.'
        )
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="
        fixed inset-0
        min-h-[100dvh] w-full
        overflow-y-auto
        bg-[#120C08]
        bg-cover bg-center bg-no-repeat
      "
      style={{
        backgroundImage: `url(${fondoPrincipal})`,
      }}
    >
      {/* Capa oscura sobre la imagen */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/90" />

      {/* Contenido del registro */}
      <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="h-2 bg-gradient-to-r from-[#E80000] via-[#FF6B00] to-[#E80000]" />

            <div className="px-6 py-8 sm:px-8 sm:pb-10">
              <div className="mb-6 flex flex-col items-center">
                <img
                  src={logoRooster}
                  alt="Logo de Rooster CR"
                  className="mb-2 h-20 w-20 object-contain drop-shadow-lg"
                />

                <h1 className="text-center text-2xl font-black tracking-tight text-white drop-shadow-md">
                  CREAR CUENTA
                </h1>

                <p className="mt-1 text-center text-sm text-white/70">
                  Regístrate para hacer tus pedidos
                </p>
              </div>

              {registroExitoso ? (
                <div className="py-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                  </div>

                  <h2 className="mb-2 text-2xl font-bold text-white">
                    ¡Registro exitoso! 🎉
                  </h2>

                  <p className="text-white/60">
                    Serás redirigido al carrito...
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Nombre */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Nombre completo
                    </label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        autoComplete="name"
                        placeholder="Tu nombre"
                        className="
                          w-full rounded-lg
                          border border-white/30
                          bg-white/95
                          py-3 pl-10 pr-4
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          transition
                          focus:border-[#FF6B00]
                          focus:ring-2
                          focus:ring-[#FF6B00]/30
                        "
                      />
                    </div>
                  </div>

                  {/* Correo */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Correo electrónico
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder="correo@ejemplo.com"
                        className="
                          w-full rounded-lg
                          border border-white/30
                          bg-white/95
                          py-3 pl-10 pr-4
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          transition
                          focus:border-[#FF6B00]
                          focus:ring-2
                          focus:ring-[#FF6B00]/30
                        "
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label
                      htmlFor="telefono"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Teléfono
                    </label>

                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="telefono"
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="8888-8888"
                        className="
                          w-full rounded-lg
                          border border-white/30
                          bg-white/95
                          py-3 pl-10 pr-4
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          transition
                          focus:border-[#FF6B00]
                          focus:ring-2
                          focus:ring-[#FF6B00]/30
                        "
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Contraseña
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="password"
                        type={mostrarPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        className="
                          w-full rounded-lg
                          border border-white/30
                          bg-white/95
                          py-3 pl-10 pr-12
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          transition
                          focus:border-[#FF6B00]
                          focus:ring-2
                          focus:ring-[#FF6B00]/30
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarPassword((estado) => !estado)
                        }
                        aria-label={
                          mostrarPassword
                            ? 'Ocultar contraseñas'
                            : 'Mostrar contraseñas'
                        }
                        className="
                          absolute right-3 top-1/2
                          -translate-y-1/2
                          rounded-md p-1
                          text-gray-500
                          transition-colors
                          hover:bg-gray-200
                          hover:text-[#E80000]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#FF6B00]/40
                        "
                      >
                        {mostrarPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label
                      htmlFor="password_confirmation"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/90"
                    >
                      Confirmar contraseña
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="password_confirmation"
                        type={mostrarPassword ? 'text' : 'password'}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Repite tu contraseña"
                        className="
                          w-full rounded-lg
                          border border-white/30
                          bg-white/95
                          py-3 pl-10 pr-4
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          transition
                          focus:border-[#FF6B00]
                          focus:ring-2
                          focus:ring-[#FF6B00]/30
                        "
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-500/40 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-200"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={cargando}
                    className="
                      w-full rounded-lg
                      bg-gradient-to-r from-[#E80000] to-[#FF6B00]
                      py-3.5
                      text-sm font-bold uppercase tracking-wide
                      text-white
                      transition-all duration-200
                      hover:shadow-lg
                      hover:shadow-[#E80000]/40
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {cargando ? 'Registrando...' : 'Registrarse'}
                  </button>

                  <p className="text-center text-sm text-white/60">
                    ¿Ya tienes cuenta?{' '}

                    <Link
                      to="/login"
                      className="font-bold text-[#FF6B00] hover:underline"
                    >
                      Iniciar sesión
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            Al registrarte aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register