import { useMemo, useState } from 'react'
import {
  Check,
  Plus,
  UtensilsCrossed,
  X,
} from 'lucide-react'

const obtenerOpcionesDisponibles = (
  opciones
) => {
  if (!Array.isArray(opciones)) {
    return []
  }

  return opciones.filter(
    (opcion) =>
      opcion &&
      Number(opcion.id) > 0 &&
      opcion.estado !== 'agotado'
  )
}

const precioOpcion = (opcion) => {
  return Number(
    opcion?.precio_extra || 0
  )
}

export default function PersonalizadorPasta({
  producto,
  onConfirmar,
  onCancelar,
  opcionesPasta = null,
}) {
  /*
  |--------------------------------------------------------------------------
  | OPCIONES RECIBIDAS DESDE LARAVEL
  |--------------------------------------------------------------------------
  */

  const opciones = useMemo(() => {
    const origen =
      opcionesPasta &&
      typeof opcionesPasta === 'object'
        ? opcionesPasta
        : producto?.opciones_pasta || {}

    return {
      tiposPasta:
        obtenerOpcionesDisponibles(
          origen.tipos_pasta
        ),

      proteinas:
        obtenerOpcionesDisponibles(
          origen.proteinas
        ),

      salsas:
        obtenerOpcionesDisponibles(
          origen.salsas
        ),

      ingredientes:
        obtenerOpcionesDisponibles(
          origen.ingredientes
        ),
    }
  }, [
    opcionesPasta,
    producto,
  ])

  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const [
    tipoPastaSeleccionado,
    setTipoPastaSeleccionado,
  ] = useState(null)

  const [
    proteinasSeleccionadas,
    setProteinasSeleccionadas,
  ] = useState([])

  const [
    salsaSeleccionada,
    setSalsaSeleccionada,
  ] = useState(null)

  const [
    ingredientesSeleccionados,
    setIngredientesSeleccionados,
  ] = useState([])

  const [
    observaciones,
    setObservaciones,
  ] = useState('')

  const [
    mensajeError,
    setMensajeError,
  ] = useState('')

  /*
  |--------------------------------------------------------------------------
  | FORMATEAR PRECIOS
  |--------------------------------------------------------------------------
  */

  const formatearPrecio = (monto) => {
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

  /*
  |--------------------------------------------------------------------------
  | SELECCIÓN ÚNICA DEL TIPO DE PASTA
  |--------------------------------------------------------------------------
  */

  const seleccionarTipoPasta = (
    opcion
  ) => {
    setTipoPastaSeleccionado(
      opcion
    )

    setMensajeError('')
  }

  /*
  |--------------------------------------------------------------------------
  | SELECCIÓN MÚLTIPLE
  |--------------------------------------------------------------------------
  */

  const toggleSeleccionMultiple = (
    opcion,
    actualizarEstado
  ) => {
    actualizarEstado(
      (opcionesActuales) => {
        const yaSeleccionada =
          opcionesActuales.some(
            (seleccionada) =>
              Number(
                seleccionada.id
              ) ===
              Number(opcion.id)
          )

        if (yaSeleccionada) {
          return opcionesActuales.filter(
            (seleccionada) =>
              Number(
                seleccionada.id
              ) !==
              Number(opcion.id)
          )
        }

        return [
          ...opcionesActuales,
          opcion,
        ]
      }
    )
  }

  /*
  |--------------------------------------------------------------------------
  | SELECCIÓN OPCIONAL DE SALSA
  |--------------------------------------------------------------------------
  */

  const seleccionarSalsa = (
    opcion
  ) => {
    const yaSeleccionada =
      Number(
        salsaSeleccionada?.id
      ) === Number(opcion.id)

    setSalsaSeleccionada(
      yaSeleccionada
        ? null
        : opcion
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CÁLCULO VISUAL DEL PRECIO
  |--------------------------------------------------------------------------
  |
  | Este cálculo solamente se muestra en React.
  | Laravel vuelve a consultar todos los precios
  | desde la base de datos al crear el pedido.
  |
  */

  const calcularTotalOpciones = () => {
    const precioTipo =
      precioOpcion(
        tipoPastaSeleccionado
      )

    const precioProteinas =
      proteinasSeleccionadas.reduce(
        (total, opcion) =>
          total +
          precioOpcion(opcion),
        0
      )

    const precioSalsa =
      precioOpcion(
        salsaSeleccionada
      )

    const precioIngredientes =
      ingredientesSeleccionados.reduce(
        (total, opcion) =>
          total +
          precioOpcion(opcion),
        0
      )

    return (
      precioTipo +
      precioProteinas +
      precioSalsa +
      precioIngredientes
    )
  }

  const calcularTotal = () => {
    const precioBase = Number(
      producto?.precio || 0
    )

    return (
      precioBase +
      calcularTotalOpciones()
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR PERSONALIZACIÓN
  |--------------------------------------------------------------------------
  */

  const handleConfirmar = () => {
    if (!tipoPastaSeleccionado) {
      setMensajeError(
        'Debes seleccionar un tipo de pasta.'
      )

      return
    }

    const observacionesLimpias =
      observaciones.trim()

    const pasta = {
      tipo_pasta_id:
        Number(
          tipoPastaSeleccionado.id
        ),

      proteina_ids:
        proteinasSeleccionadas.map(
          (opcion) =>
            Number(opcion.id)
        ),

      salsa_id:
        salsaSeleccionada
          ? Number(
              salsaSeleccionada.id
            )
          : null,

      ingrediente_ids:
        ingredientesSeleccionados.map(
          (opcion) =>
            Number(opcion.id)
        ),
    }

    /*
     * personalizacion se utiliza solamente
     * para mostrar la composición en React.
     *
     * Laravel no confía en estos nombres ni
     * precios para calcular el pedido.
     */
    const personalizacion = {
      tipo: 'pasta',

      tipo_pasta: {
        id:
          Number(
            tipoPastaSeleccionado.id
          ),

        nombre:
          tipoPastaSeleccionado.nombre,

        precio_extra:
          precioOpcion(
            tipoPastaSeleccionado
          ),
      },

      proteinas:
        proteinasSeleccionadas.map(
          (opcion) => ({
            id:
              Number(opcion.id),

            nombre:
              opcion.nombre,

            precio_extra:
              precioOpcion(opcion),
          })
        ),

      salsa:
        salsaSeleccionada
          ? {
              id:
                Number(
                  salsaSeleccionada.id
                ),

              nombre:
                salsaSeleccionada.nombre,

              precio_extra:
                precioOpcion(
                  salsaSeleccionada
                ),
            }
          : null,

      ingredientes:
        ingredientesSeleccionados.map(
          (opcion) => ({
            id:
              Number(opcion.id),

            nombre:
              opcion.nombre,

            precio_extra:
              precioOpcion(opcion),
          })
        ),

      observaciones:
        observacionesLimpias ||
        null,
    }

    onConfirmar({
      producto_id:
        producto.id,

      nombre:
        producto.nombre,

      precio:
        calcularTotal(),

      cantidad: 1,

      imagen_url:
        producto.imagen_url,

      extras: null,

      extras_ids: [],

      pasta,

      acompanamientos_ids: [],

      observaciones:
        observacionesLimpias ||
        null,

      personalizacion,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | COMPONENTE DE OPCIÓN MÚLTIPLE
  |--------------------------------------------------------------------------
  */

  const renderOpcionMultiple = (
    opcion,
    seleccionadas,
    actualizarEstado
  ) => {
    const seleccionada =
      seleccionadas.some(
        (item) =>
          Number(item.id) ===
          Number(opcion.id)
      )

    return (
      <button
        key={opcion.id}
        type="button"
        onClick={() =>
          toggleSeleccionMultiple(
            opcion,
            actualizarEstado
          )
        }
        className={`
          flex w-full items-center
          justify-between rounded-xl
          border p-3 text-left
          transition-all
          ${
            seleccionada
              ? `
                  border-[#F5A300]
                  bg-[#F5A300]/10
                  text-[#F5A300]
                `
              : `
                  border-white/10
                  bg-black/20
                  text-white/60
                  hover:border-white/20
                  hover:bg-white/5
                  hover:text-white
                `
          }
        `}
      >
        <span className="flex items-center gap-2">
          {seleccionada ? (
            <Check
              size={16}
              className="text-[#F5A300]"
            />
          ) : (
            <Plus size={16} />
          )}

          <span className="font-medium">
            {opcion.nombre}
          </span>
        </span>

        <span className="font-mono text-xs font-bold">
          {precioOpcion(opcion) > 0
            ? `+₡${formatearPrecio(
                opcion.precio_extra
              )}`
            : 'Incluido'}
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#F5A300]/30 bg-[#160F0B] shadow-2xl">
        <div className="h-[4px] bg-gradient-to-r from-[#E4002B] via-[#F5A300] to-[#E4002B]" />

        <div className="p-4 sm:p-6">
          {/* HEADER */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5A300]/15">
                <UtensilsCrossed className="h-6 w-6 text-[#F5A300]" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#F5A300]">
                  Pasta personalizada
                </p>

                <h2 className="truncate text-lg font-black text-white sm:text-xl">
                  {producto.nombre}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancelar}
              aria-label="Cerrar personalizador de pasta"
              className="shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-[#E4002B]"
            >
              <X size={24} />
            </button>
          </div>

          {/* PRECIO BASE */}
          <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-sm text-white/60">
              Precio base
            </span>

            <span className="font-mono text-sm font-bold text-white">
              ₡
              {formatearPrecio(
                producto.precio
              )}
            </span>
          </div>

          {/* TIPO DE PASTA */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  1. Tipo de pasta
                </h3>

                <p className="text-xs text-white/40">
                  Selecciona una opción obligatoria.
                </p>
              </div>

              <span className="rounded-full bg-[#E4002B]/15 px-2 py-1 text-[10px] font-bold text-[#E4002B]">
                Obligatorio
              </span>
            </div>

            {opciones.tiposPasta.length ===
            0 ? (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300">
                No hay tipos de pasta disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {opciones.tiposPasta.map(
                  (opcion) => {
                    const seleccionada =
                      Number(
                        tipoPastaSeleccionado
                          ?.id
                      ) ===
                      Number(opcion.id)

                    return (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() =>
                          seleccionarTipoPasta(
                            opcion
                          )
                        }
                        className={`
                          flex items-center
                          justify-between
                          rounded-xl border
                          p-3 text-left
                          transition-all
                          ${
                            seleccionada
                              ? `
                                  border-[#F5A300]
                                  bg-[#F5A300]/10
                                  text-[#F5A300]
                                `
                              : `
                                  border-white/10
                                  bg-black/20
                                  text-white/60
                                  hover:border-white/20
                                  hover:bg-white/5
                                  hover:text-white
                                `
                          }
                        `}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`
                              flex h-5 w-5
                              items-center
                              justify-center
                              rounded-full border
                              ${
                                seleccionada
                                  ? `
                                      border-[#F5A300]
                                      bg-[#F5A300]
                                      text-black
                                    `
                                  : `
                                      border-white/20
                                    `
                              }
                            `}
                          >
                            {seleccionada && (
                              <Check size={13} />
                            )}
                          </span>

                          <span className="font-medium">
                            {opcion.nombre}
                          </span>
                        </span>

                        <span className="font-mono text-xs font-bold">
                          {precioOpcion(
                            opcion
                          ) > 0
                            ? `+₡${formatearPrecio(
                                opcion.precio_extra
                              )}`
                            : 'Incluido'}
                        </span>
                      </button>
                    )
                  }
                )}
              </div>
            )}
          </div>

          {/* PROTEÍNAS */}
          <div className="mb-5">
            <div className="mb-2">
              <h3 className="text-sm font-black text-white">
                2. Proteínas
              </h3>

              <p className="text-xs text-white/40">
                Puedes elegir ninguna, una o varias.
              </p>
            </div>

            {opciones.proteinas.length ===
            0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
                No hay proteínas disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {opciones.proteinas.map(
                  (opcion) =>
                    renderOpcionMultiple(
                      opcion,
                      proteinasSeleccionadas,
                      setProteinasSeleccionadas
                    )
                )}
              </div>
            )}
          </div>

          {/* SALSA */}
          <div className="mb-5">
            <div className="mb-2">
              <h3 className="text-sm font-black text-white">
                3. Salsa
              </h3>

              <p className="text-xs text-white/40">
                Es opcional y solo puedes seleccionar una.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setSalsaSeleccionada(
                    null
                  )
                }
                className={`
                  flex items-center
                  justify-between
                  rounded-xl border
                  p-3 text-left
                  transition-all
                  ${
                    salsaSeleccionada ===
                    null
                      ? `
                          border-[#F5A300]
                          bg-[#F5A300]/10
                          text-[#F5A300]
                        `
                      : `
                          border-white/10
                          bg-black/20
                          text-white/60
                          hover:border-white/20
                          hover:bg-white/5
                        `
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {salsaSeleccionada ===
                  null ? (
                    <Check size={16} />
                  ) : (
                    <Plus size={16} />
                  )}

                  Sin salsa
                </span>

                <span className="text-xs font-bold">
                  Incluido
                </span>
              </button>

              {opciones.salsas.map(
                (opcion) => {
                  const seleccionada =
                    Number(
                      salsaSeleccionada?.id
                    ) === Number(opcion.id)

                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() =>
                        seleccionarSalsa(
                          opcion
                        )
                      }
                      className={`
                        flex items-center
                        justify-between
                        rounded-xl border
                        p-3 text-left
                        transition-all
                        ${
                          seleccionada
                            ? `
                                border-[#F5A300]
                                bg-[#F5A300]/10
                                text-[#F5A300]
                              `
                            : `
                                border-white/10
                                bg-black/20
                                text-white/60
                                hover:border-white/20
                                hover:bg-white/5
                                hover:text-white
                              `
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {seleccionada ? (
                          <Check size={16} />
                        ) : (
                          <Plus size={16} />
                        )}

                        {opcion.nombre}
                      </span>

                      <span className="font-mono text-xs font-bold">
                        {precioOpcion(
                          opcion
                        ) > 0
                          ? `+₡${formatearPrecio(
                              opcion.precio_extra
                            )}`
                          : 'Incluido'}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          {/* INGREDIENTES */}
          <div className="mb-5">
            <div className="mb-2">
              <h3 className="text-sm font-black text-white">
                4. Ingredientes adicionales
              </h3>

              <p className="text-xs text-white/40">
                Selecciona todos los que desees.
              </p>
            </div>

            {opciones.ingredientes.length ===
            0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
                No hay ingredientes adicionales disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {opciones.ingredientes.map(
                  (opcion) =>
                    renderOpcionMultiple(
                      opcion,
                      ingredientesSeleccionados,
                      setIngredientesSeleccionados
                    )
                )}
              </div>
            )}
          </div>

          {/* RESUMEN */}
          <div className="mb-5 rounded-xl border border-[#F5A300]/20 bg-[#F5A300]/5 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#F5A300]">
              Resumen de la pasta
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-white/50">
                  Tipo
                </span>

                <span className="text-right text-white">
                  {tipoPastaSeleccionado
                    ?.nombre ||
                    'Sin seleccionar'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-white/50">
                  Proteínas
                </span>

                <span className="text-right text-white">
                  {proteinasSeleccionadas
                    .length > 0
                    ? proteinasSeleccionadas
                        .map(
                          (opcion) =>
                            opcion.nombre
                        )
                        .join(', ')
                    : 'Sin proteína'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-white/50">
                  Salsa
                </span>

                <span className="text-right text-white">
                  {salsaSeleccionada
                    ?.nombre ||
                    'Sin salsa'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-white/50">
                  Adicionales
                </span>

                <span className="text-right text-white">
                  {ingredientesSeleccionados
                    .length > 0
                    ? ingredientesSeleccionados
                        .map(
                          (opcion) =>
                            opcion.nombre
                        )
                        .join(', ')
                    : 'Ninguno'}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-[#F5A300]/15 pt-2">
                <span className="font-bold text-white/70">
                  Opciones adicionales
                </span>

                <span className="font-mono font-bold text-[#F5A300]">
                  ₡
                  {formatearPrecio(
                    calcularTotalOpciones()
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div className="mb-5">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-white/60">
              📝 Observaciones
            </label>

            <textarea
              value={observaciones}
              onChange={(event) =>
                setObservaciones(
                  event.target.value
                )
              }
              maxLength={2000}
              placeholder="Ej: Sin cebolla, salsa aparte, alergia a algún ingrediente, etc."
              className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#F5A300]"
            />

            <p className="mt-1 text-right text-[10px] text-white/30">
              {observaciones.length}
              /2000
            </p>
          </div>

          {/* ERROR */}
          {mensajeError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
              {mensajeError}
            </div>
          )}

          {/* TOTAL Y BOTONES */}
          <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-white/60">
                Total estimado
              </p>

              <p className="font-mono text-2xl font-black text-[#F5A300]">
                ₡
                {formatearPrecio(
                  calcularTotal()
                )}
              </p>

              <p className="mt-1 text-[10px] text-white/30">
                El precio final será validado por el sistema.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-xl border border-white/10 px-4 py-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmar}
                disabled={
                  !tipoPastaSeleccionado
                }
                className="rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-6 py-2 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#E4002B]/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}