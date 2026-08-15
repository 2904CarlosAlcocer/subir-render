import {
  useMemo,
  useState,
} from 'react'

import { Link } from 'react-router-dom'
import api from '../api/axios'

const FORMULARIO_INICIAL = {
  nombre: '',
  telefono: '',
  correo: '',
  asunto: 'Consulta general',
  mensaje: '',
}

const OPCIONES_ASUNTO = [
  'Consulta general',
  'Información sobre el menú',
  'Reservación o actividad',
  'Pedido',
  'Sugerencia',
  'Queja o inconveniente',
  'Otro',
]

export default function Contacto() {
  const [
    formData,
    setFormData,
  ] = useState(
    FORMULARIO_INICIAL
  )

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    isSubmitted,
    setIsSubmitted,
  ] = useState(false)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    generalError,
    setGeneralError,
  ] = useState('')

  const [
    errors,
    setErrors,
  ] = useState({})

  /*
  |--------------------------------------------------------------------------
  | EFECTO VISUAL DE CHISPAS
  |--------------------------------------------------------------------------
  |
  | Se genera una sola vez para evitar que las posiciones cambien
  | cada vez que el usuario escribe en el formulario.
  |
  */

  const sparks = useMemo(() => {
    return Array.from(
      { length: 30 },
      (_, index) => ({
        id: index,
        left:
          Math.random() * 100,
        top:
          Math.random() * 100,
        delay:
          Math.random() * 3,
        duration:
          2 + Math.random() * 3,
        size:
          1.5 +
          Math.random() * 2.5,
      })
    )
  }, [])

  const ctaSparks = useMemo(() => {
    return Array.from(
      { length: 4 },
      (_, index) => ({
        id: index,
        left:
          10 +
          Math.random() * 80,
        top:
          15 +
          Math.random() * 70,
        size:
          1.5 +
          Math.random() * 2,
        delay:
          index * 0.8,
        duration:
          4 +
          Math.random() * 4,
      })
    )
  }, [])

  /*
  |--------------------------------------------------------------------------
  | DATOS DE CONTACTO
  |--------------------------------------------------------------------------
  */

  const contactInfo = {
    direccion:
      'Mercadito Arenal, La Fortuna, Alajuela, Costa Rica',

    horario:
      '12:00 PM - 10:00 PM',

    telefono:
      '+506 8888-8888',

    email:
      'info@roosterpizza.com',

    sitioWeb:
      'www.roosterpizza.com',
  }

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR CAMPOS
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormData(
      (datosActuales) => ({
        ...datosActuales,
        [name]: value,
      })
    )

    if (errors[name]) {
      setErrors(
        (erroresActuales) => ({
          ...erroresActuales,
          [name]: '',
        })
      )
    }

    if (generalError) {
      setGeneralError('')
    }

    if (isSubmitted) {
      setIsSubmitted(false)
      setSuccessMessage('')
    }
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN LOCAL
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const newErrors = {}

    const nombre =
      formData.nombre.trim()

    const telefono =
      formData.telefono.trim()

    const correo =
      formData.correo.trim()

    const asunto =
      formData.asunto.trim()

    const mensaje =
      formData.mensaje.trim()

    if (!nombre) {
      newErrors.nombre =
        'El nombre es obligatorio.'
    } else if (
      nombre.length < 2
    ) {
      newErrors.nombre =
        'El nombre debe tener al menos 2 caracteres.'
    } else if (
      nombre.length > 120
    ) {
      newErrors.nombre =
        'El nombre no puede superar los 120 caracteres.'
    }

    if (!telefono) {
      newErrors.telefono =
        'El teléfono es obligatorio.'
    } else if (
      !/^[0-9+\-\s()]+$/.test(
        telefono
      )
    ) {
      newErrors.telefono =
        'El teléfono contiene caracteres no permitidos.'
    } else {
      const cantidadDigitos =
        telefono.replace(
          /\D/g,
          ''
        ).length

      if (
        cantidadDigitos < 8 ||
        cantidadDigitos > 15
      ) {
        newErrors.telefono =
          'El teléfono debe contener entre 8 y 15 números.'
      }
    }

    if (
      correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correo
      )
    ) {
      newErrors.correo =
        'Ingresa un correo electrónico válido.'
    }

    if (
      correo.length > 150
    ) {
      newErrors.correo =
        'El correo no puede superar los 150 caracteres.'
    }

    if (!asunto) {
      newErrors.asunto =
        'Selecciona un motivo de contacto.'
    } else if (
      asunto.length < 3 ||
      asunto.length > 120
    ) {
      newErrors.asunto =
        'El asunto seleccionado no es válido.'
    }

    if (!mensaje) {
      newErrors.mensaje =
        'El mensaje es obligatorio.'
    } else if (
      mensaje.length < 10
    ) {
      newErrors.mensaje =
        'El mensaje debe tener al menos 10 caracteres.'
    } else if (
      mensaje.length > 3000
    ) {
      newErrors.mensaje =
        'El mensaje no puede superar los 3000 caracteres.'
    }

    return newErrors
  }

  /*
  |--------------------------------------------------------------------------
  | OBTENER ERRORES DE LARAVEL
  |--------------------------------------------------------------------------
  */

  const obtenerErroresLaravel = (
    error
  ) => {
    const erroresServidor =
      error.response?.data?.errors

    if (
      !erroresServidor ||
      typeof erroresServidor !==
        'object'
    ) {
      return {}
    }

    return Object.entries(
      erroresServidor
    ).reduce(
      (
        resultado,
        [campo, mensajes]
      ) => {
        resultado[campo] =
          Array.isArray(mensajes)
            ? mensajes[0]
            : String(mensajes)

        return resultado
      },
      {}
    )
  }

  /*
  |--------------------------------------------------------------------------
  | ENVIAR MENSAJE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const newErrors =
      validateForm()

    if (
      Object.keys(newErrors)
        .length > 0
    ) {
      setErrors(newErrors)
      setGeneralError('')
      setIsSubmitted(false)
      setSuccessMessage('')

      const primerCampo =
        Object.keys(
          newErrors
        )[0]

      document
        .querySelector(
          `[name="${primerCampo}"]`
        )
        ?.focus()

      return
    }

    setIsSubmitting(true)
    setErrors({})
    setGeneralError('')
    setIsSubmitted(false)
    setSuccessMessage('')

    try {
      const response =
        await api.post(
          '/mensajes-contacto',
          {
            nombre:
              formData.nombre.trim(),

            telefono:
              formData.telefono.trim(),

            correo:
              formData.correo.trim() ||
              null,

            asunto:
              formData.asunto.trim(),

            mensaje:
              formData.mensaje.trim(),
          }
        )

      setFormData(
        FORMULARIO_INICIAL
      )

      setSuccessMessage(
        response.data?.message ||
          'Tu mensaje fue enviado correctamente.'
      )

      setIsSubmitted(true)
    } catch (error) {
      console.error(
        'Error al enviar el mensaje de contacto:',
        error
      )

      const estado =
        error.response?.status

      if (estado === 422) {
        const erroresLaravel =
          obtenerErroresLaravel(
            error
          )

        setErrors(
          erroresLaravel
        )

        setGeneralError(
          'Revisa los datos indicados e intenta nuevamente.'
        )

        const primerCampo =
          Object.keys(
            erroresLaravel
          )[0]

        if (primerCampo) {
          setTimeout(() => {
            document
              .querySelector(
                `[name="${primerCampo}"]`
              )
              ?.focus()
          }, 0)
        }
      } else if (
        estado === 429
      ) {
        setGeneralError(
          error.response?.data
            ?.message ||
            'Has realizado varios intentos. Espera un momento antes de enviar nuevamente.'
        )
      } else if (
        !error.response
      ) {
        setGeneralError(
          'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.'
        )
      } else {
        setGeneralError(
          error.response?.data
            ?.message ||
            'No se pudo enviar el mensaje. Intenta nuevamente.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120C08] text-white">
      {/* CHISPAS DE FUEGO DEL FONDO */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {sparks.map(
          (spark) => (
            <div
              key={`spark-${spark.id}`}
              className="absolute animate-spark rounded-full bg-gradient-to-t from-orange-400 to-yellow-300"
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
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/80 to-black/70" />

        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/70 to-[#120C08]" />

        <div className="absolute right-10 top-20 -z-10 h-96 w-96 rounded-full bg-[#E4002B]/10 blur-3xl" />

        <div className="absolute bottom-20 left-10 -z-10 h-72 w-72 rounded-full bg-[#F5A300]/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#E4002B]/50 bg-[#E4002B]/30 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-semibold text-[#F5A300]">
              Contáctanos
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight sm:text-6xl md:text-7xl">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              ¿Tienes alguna
            </span>

            <span className="block bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-[#F5A300] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              pregunta?
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white sm:text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Estamos aquí para
            ayudarte. Envíanos tu
            consulta y nuestro equipo
            podrá gestionarla
            directamente desde Rooster
            CR.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#formulario"
              className="rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-8 py-3 text-sm font-bold shadow-lg shadow-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#E4002B]/50"
            >
              Enviar mensaje
            </a>

            <a
              href={`tel:${contactInfo.telefono}`}
              className="rounded-xl border-2 border-[#F5A300] px-8 py-3 text-sm font-bold text-[#F5A300] shadow-lg shadow-black/30 transition-all duration-300 hover:bg-[#F5A300]/10"
            >
              Llamar ahora
            </a>
          </div>
        </div>

        <svg
          className="absolute bottom-0 left-0 -mb-1 w-full"
          viewBox="0 0 1200 35"
          preserveAspectRatio="none"
          style={{
            zIndex: 5,
          }}
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

      {/* CONTENIDO PRINCIPAL */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* INFORMACIÓN DE CONTACTO */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Información
                </h2>

                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#F5A300]/30">
                    <p className="text-sm font-light text-white/60">
                      Dirección
                    </p>

                    <p className="text-sm font-medium text-white">
                      {
                        contactInfo.direccion
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#F5A300]/30">
                    <p className="text-sm font-light text-white/60">
                      Horario
                    </p>

                    <p className="text-sm font-medium text-white">
                      {
                        contactInfo.horario
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#F5A300]/30">
                    <p className="text-sm font-light text-white/60">
                      Teléfono
                    </p>

                    <a
                      href={`tel:${contactInfo.telefono}`}
                      className="text-sm font-medium text-white transition-colors hover:text-[#F5A300]"
                    >
                      {
                        contactInfo.telefono
                      }
                    </a>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#F5A300]/30">
                    <p className="text-sm font-light text-white/60">
                      Email
                    </p>

                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-sm font-medium text-white transition-colors hover:text-[#F5A300]"
                    >
                      {
                        contactInfo.email
                      }
                    </a>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#F5A300]/30">
                    <p className="text-sm font-light text-white/60">
                      Sitio web
                    </p>

                    <a
                      href={`https://${contactInfo.sitioWeb}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white transition-colors hover:text-[#F5A300]"
                    >
                      {
                        contactInfo.sitioWeb
                      }
                    </a>
                  </div>
                </div>
              </div>

              {/* REDES SOCIALES */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-bold text-white">
                  Síguenos
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://instagram.com/roosterpizza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-all duration-300 hover:scale-105 hover:border-[#F5A300]/30"
                  >
                    <span className="text-xs font-medium text-white/70">
                      Instagram
                    </span>
                  </a>

                  <a
                    href="https://facebook.com/roosterpizza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-all duration-300 hover:scale-105 hover:border-[#F5A300]/30"
                  >
                    <span className="text-xs font-medium text-white/70">
                      Facebook
                    </span>
                  </a>

                  <a
                    href="https://twitter.com/roosterpizza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-all duration-300 hover:scale-105 hover:border-[#F5A300]/30"
                  >
                    <span className="text-xs font-medium text-white/70">
                      Twitter
                    </span>
                  </a>

                  <a
                    href="https://youtube.com/roosterpizza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-all duration-300 hover:scale-105 hover:border-[#F5A300]/30"
                  >
                    <span className="text-xs font-medium text-white/70">
                      YouTube
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* FORMULARIO */}
            <div
              id="formulario"
              className="scroll-mt-28 lg:col-span-2"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-12">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold text-white">
                    Envíanos un mensaje
                  </h2>

                  <p className="mt-2 text-sm text-white/60">
                    Completa el
                    formulario y el
                    mensaje llegará
                    directamente al
                    centro de atención
                    de Rooster CR.
                  </p>
                </div>

                {isSubmitted && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mb-6 rounded-xl border border-green-500/30 bg-green-500/20 p-4"
                  >
                    <p className="font-bold text-green-400">
                      ¡Mensaje enviado!
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {
                        successMessage
                      }
                    </p>
                  </div>
                )}

                {generalError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-6 rounded-xl border border-red-500/30 bg-red-500/15 p-4"
                  >
                    <p className="font-bold text-red-400">
                      No se pudo enviar
                      el mensaje
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {
                        generalError
                      }
                    </p>
                  </div>
                )}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  noValidate
                  className="space-y-6"
                >
                  {/* NOMBRE */}
                  <div>
                    <label
                      htmlFor="contacto-nombre"
                      className="mb-2 block text-sm font-medium text-white/80"
                    >
                      Nombre completo
                    </label>

                    <input
                      id="contacto-nombre"
                      type="text"
                      name="nombre"
                      value={
                        formData.nombre
                      }
                      onChange={
                        handleChange
                      }
                      autoComplete="name"
                      maxLength={120}
                      disabled={
                        isSubmitting
                      }
                      aria-invalid={
                        Boolean(
                          errors.nombre
                        )
                      }
                      aria-describedby={
                        errors.nombre
                          ? 'error-nombre'
                          : undefined
                      }
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        errors.nombre
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-white/10 focus:border-[#F5A300] focus:ring-[#F5A300]/30'
                      }`}
                      placeholder="Tu nombre completo"
                    />

                    {errors.nombre && (
                      <p
                        id="error-nombre"
                        className="mt-1 text-xs text-red-400"
                      >
                        {
                          errors.nombre
                        }
                      </p>
                    )}
                  </div>

                  {/* TELÉFONO Y CORREO */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contacto-telefono"
                        className="mb-2 block text-sm font-medium text-white/80"
                      >
                        Teléfono
                      </label>

                      <input
                        id="contacto-telefono"
                        type="tel"
                        name="telefono"
                        value={
                          formData.telefono
                        }
                        onChange={
                          handleChange
                        }
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={30}
                        disabled={
                          isSubmitting
                        }
                        aria-invalid={
                          Boolean(
                            errors.telefono
                          )
                        }
                        aria-describedby={
                          errors.telefono
                            ? 'error-telefono'
                            : undefined
                        }
                        className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                          errors.telefono
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                            : 'border-white/10 focus:border-[#F5A300] focus:ring-[#F5A300]/30'
                        }`}
                        placeholder="+506 8888-8888"
                      />

                      {errors.telefono && (
                        <p
                          id="error-telefono"
                          className="mt-1 text-xs text-red-400"
                        >
                          {
                            errors.telefono
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contacto-correo"
                        className="mb-2 block text-sm font-medium text-white/80"
                      >
                        Correo electrónico

                        <span className="ml-1 text-xs text-white/40">
                          (opcional)
                        </span>
                      </label>

                      <input
                        id="contacto-correo"
                        type="email"
                        name="correo"
                        value={
                          formData.correo
                        }
                        onChange={
                          handleChange
                        }
                        autoComplete="email"
                        maxLength={150}
                        disabled={
                          isSubmitting
                        }
                        aria-invalid={
                          Boolean(
                            errors.correo
                          )
                        }
                        aria-describedby={
                          errors.correo
                            ? 'error-correo'
                            : undefined
                        }
                        className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                          errors.correo
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                            : 'border-white/10 focus:border-[#F5A300] focus:ring-[#F5A300]/30'
                        }`}
                        placeholder="tu@email.com"
                      />

                      {errors.correo && (
                        <p
                          id="error-correo"
                          className="mt-1 text-xs text-red-400"
                        >
                          {
                            errors.correo
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ASUNTO */}
                  <div>
                    <label
                      htmlFor="contacto-asunto"
                      className="mb-2 block text-sm font-medium text-white/80"
                    >
                      Motivo de contacto
                    </label>

                    <select
                      id="contacto-asunto"
                      name="asunto"
                      value={
                        formData.asunto
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                      aria-invalid={
                        Boolean(
                          errors.asunto
                        )
                      }
                      aria-describedby={
                        errors.asunto
                          ? 'error-asunto'
                          : undefined
                      }
                      className={`w-full rounded-xl border bg-[#1c1510] px-4 py-3 text-white outline-none transition-all duration-300 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        errors.asunto
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-white/10 focus:border-[#F5A300] focus:ring-[#F5A300]/30'
                      }`}
                    >
                      {OPCIONES_ASUNTO.map(
                        (opcion) => (
                          <option
                            key={
                              opcion
                            }
                            value={
                              opcion
                            }
                          >
                            {
                              opcion
                            }
                          </option>
                        )
                      )}
                    </select>

                    {errors.asunto && (
                      <p
                        id="error-asunto"
                        className="mt-1 text-xs text-red-400"
                      >
                        {
                          errors.asunto
                        }
                      </p>
                    )}
                  </div>

                  {/* MENSAJE */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        htmlFor="contacto-mensaje"
                        className="block text-sm font-medium text-white/80"
                      >
                        Mensaje
                      </label>

                      <span
                        className={`text-xs ${
                          formData.mensaje
                            .length >
                          2800
                            ? 'text-[#F5A300]'
                            : 'text-white/35'
                        }`}
                      >
                        {
                          formData.mensaje
                            .length
                        }
                        /3000
                      </span>
                    </div>

                    <textarea
                      id="contacto-mensaje"
                      name="mensaje"
                      value={
                        formData.mensaje
                      }
                      onChange={
                        handleChange
                      }
                      rows={6}
                      maxLength={3000}
                      disabled={
                        isSubmitting
                      }
                      aria-invalid={
                        Boolean(
                          errors.mensaje
                        )
                      }
                      aria-describedby={
                        errors.mensaje
                          ? 'error-mensaje'
                          : undefined
                      }
                      className={`w-full resize-none rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        errors.mensaje
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-white/10 focus:border-[#F5A300] focus:ring-[#F5A300]/30'
                      }`}
                      placeholder="Escribe tu consulta con todos los detalles necesarios..."
                    />

                    {errors.mensaje && (
                      <p
                        id="error-mensaje"
                        className="mt-1 text-xs text-red-400"
                      >
                        {
                          errors.mensaje
                        }
                      </p>
                    )}
                  </div>

                  {/* BOTÓN */}
                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] py-4 font-bold text-white transition-all duration-300 ${
                      isSubmitting
                        ? 'cursor-not-allowed opacity-70'
                        : 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#E4002B]/50'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Enviando mensaje...
                      </>
                    ) : (
                      'Enviar mensaje'
                    )}
                  </button>

                  <p className="text-center text-xs leading-relaxed text-white/35">
                    Tu información será
                    utilizada únicamente
                    para responder esta
                    consulta.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section className="border-t border-white/10 bg-gradient-to-b from-[#120C08] via-[#0a0604] to-[#120C08] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#F5A300]/20 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 px-6 py-2.5 backdrop-blur-sm">
              <span className="text-xs font-light uppercase tracking-[0.3em] text-[#F5A300]">
                Nuestra ubicación
              </span>
            </div>

            <h2 className="text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
              Visítanos en{' '}

              <span className="text-[#F5A300]">
                La Fortuna
              </span>
            </h2>

            <div className="mt-6 flex justify-center gap-3">
              <span className="h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300]" />

              <span className="h-2 w-2 animate-pulse rounded-full bg-[#F5A300]" />

              <span className="h-0.5 w-16 rounded-full bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent" />
            </div>
          </div>

          <div className="relative h-[400px] overflow-hidden rounded-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.9457500000004!2d-84.647!3d10.471!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0b4b3a0b3b3b3%3A0xb3b3b3b3b3b3b3b3!2sMercadito%20Arenal!5e0!3m2!1ses!2scr!4v1234567890"
              width="100%"
              height="100%"
              style={{
                border: 0,
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de Rooster Pizza"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120C08] via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/70 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-[#F5A300]">
                {
                  contactInfo.direccion
                }
              </p>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=10.4710,-84.6450"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#E4002B]/50"
              >
                Cómo llegar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-t border-white/10 px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          {ctaSparks.map(
            (spark) => (
              <div
                key={`cta-spark-${spark.id}`}
                className="absolute animate-float-spark rounded-full bg-orange-400"
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
                    '0 0 8px 2px rgba(251, 146, 60, 0.3)',
                }}
              />
            )
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-3xl space-y-6 sm:space-y-8">
          <h2 className="text-3xl font-black xs:text-4xl sm:text-5xl md:text-6xl">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              ¿Listo para{' '}
            </span>

            <span className="bg-gradient-to-r from-[#F5A300] to-[#E4002B] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              visitarnos?
            </span>
          </h2>

          <p className="text-base text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-lg md:text-xl">
            Te esperamos en el
            Mercadito Arenal para que
            disfrutes de la mejor
            experiencia culinaria en
            La Fortuna.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/menu"
              className="inline-block rounded-2xl bg-gradient-to-r from-[#F5A300] to-[#E4002B] px-10 py-4 text-base font-bold text-black shadow-lg shadow-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#F5A300]/50 sm:px-12 sm:py-5 sm:text-lg md:text-xl"
            >
              VER MENÚ
            </Link>

            <Link
              to="/ubicacion"
              className="inline-block rounded-2xl border-2 border-[#F5A300] px-10 py-4 text-base font-bold text-[#F5A300] transition-all duration-300 hover:scale-105 hover:bg-[#F5A300]/10 sm:px-12 sm:py-5 sm:text-lg md:text-xl"
            >
              CÓMO LLEGAR
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-black/30 px-4 py-8 sm:px-6 sm:py-12">
        <div className="relative z-10 mx-auto max-w-6xl text-center text-xs text-white/60 sm:text-sm">
          <p>
            Rooster Pizza & Grill ©
            2026 | Mercadito Arenal,
            La Fortuna, Alajuela
          </p>
        </div>
      </footer>

      {/* ANIMACIONES */}
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

        @keyframes float-spark {
          0% {
            opacity: 0;
            transform:
              translate(0, 0)
              scale(0);
          }

          20% {
            opacity: 1;
            transform:
              translate(10px, -15px)
              scale(1.2);
          }

          50% {
            opacity: 0.9;
            transform:
              translate(-8px, -35px)
              scale(1);
          }

          80% {
            opacity: 0.6;
            transform:
              translate(15px, -50px)
              scale(0.8);
          }

          100% {
            opacity: 0;
            transform:
              translate(-5px, -70px)
              scale(0);
          }
        }

        .animate-spark {
          animation:
            spark linear infinite;
        }

        .animate-float-spark {
          animation:
            float-spark
            ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}