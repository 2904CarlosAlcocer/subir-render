import { useMemo, useState } from 'react'
import {
  Check,
  Plus,
  UtensilsCrossed,
  X,
} from 'lucide-react'

const normalizarAcompanamientos = (
  acompanamientos
) => {
  if (!Array.isArray(acompanamientos)) {
    return []
  }

  return acompanamientos.filter(
    (acompanamiento) =>
      acompanamiento &&
      Number(acompanamiento.id) > 0 &&
      acompanamiento.estado !== 'agotado'
  )
}

const obtenerPrecioExtra = (
  acompanamiento
) => {
  return Number(
    acompanamiento?.precio_extra || 0
  )
}

export default function PersonalizadorAcompanamientos({
  producto,
  onConfirmar,
  onCancelar,
  acompanamientosDisponibles = null,
}) {
  /*
  |--------------------------------------------------------------------------
  | ACOMPAÑAMIENTOS DISPONIBLES
  |--------------------------------------------------------------------------
  |
  | Se pueden recibir directamente mediante la propiedad
  | acompanamientosDisponibles o desde el producto enviado
  | por ProductoController.
  |
  */

  const acompanamientos = useMemo(() => {
    const origen =
      Array.isArray(
        acompanamientosDisponibles
      )
        ? acompanamientosDisponibles
        : producto
            ?.acompanamientos_disponibles

    return normalizarAcompanamientos(
      origen
    )
  }, [
    acompanamientosDisponibles,
    producto,
  ])

  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const [
    seleccionados,
    setSeleccionados,
  ] = useState([])

  const [
    observaciones,
    setObservaciones,
  ] = useState('')

  /*
  |--------------------------------------------------------------------------
  | FORMATEAR PRECIO
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
  | SELECCIONAR O QUITAR ACOMPAÑAMIENTO
  |--------------------------------------------------------------------------
  |
  | El orden de selección se conserva.
  |
  | - Posiciones 1 y 2: incluidas.
  | - Posición 3 en adelante: adicionales.
  |
  */

  const toggleAcompanamiento = (
    acompanamiento
  ) => {
    setSeleccionados(
      (seleccionActual) => {
        const yaSeleccionado =
          seleccionActual.some(
            (item) =>
              Number(item.id) ===
              Number(
                acompanamiento.id
              )
          )

        if (yaSeleccionado) {
          return seleccionActual.filter(
            (item) =>
              Number(item.id) !==
              Number(
                acompanamiento.id
              )
          )
        }

        return [
          ...seleccionActual,
          acompanamiento,
        ]
      }
    )
  }

  /*
  |--------------------------------------------------------------------------
  | OBTENER POSICIÓN
  |--------------------------------------------------------------------------
  */

  const obtenerPosicion = (
    acompanamiento
  ) => {
    return seleccionados.findIndex(
      (item) =>
        Number(item.id) ===
        Number(acompanamiento.id)
    )
  }

  const estaSeleccionado = (
    acompanamiento
  ) => {
    return obtenerPosicion(
      acompanamiento
    ) !== -1
  }

  const estaIncluido = (
    acompanamiento
  ) => {
    const posicion =
      obtenerPosicion(
        acompanamiento
      )

    return (
      posicion >= 0 &&
      posicion < 2
    )
  }

  /*
  |--------------------------------------------------------------------------
  | SEPARAR INCLUIDOS Y ADICIONALES
  |--------------------------------------------------------------------------
  */

  const incluidos =
    seleccionados.slice(0, 2)

  const adicionales =
    seleccionados.slice(2)

  /*
  |--------------------------------------------------------------------------
  | CALCULAR PRECIO ADICIONAL
  |--------------------------------------------------------------------------
  |
  | Solamente se cobran los acompañamientos ubicados
  | desde la tercera posición.
  |
  | Este cálculo es una estimación visual. Laravel vuelve
  | a consultar los precios reales en la base de datos.
  |
  */

  const calcularTotalAdicionales = () => {
    return adicionales.reduce(
      (
        total,
        acompanamiento
      ) => {
        return (
          total +
          obtenerPrecioExtra(
            acompanamiento
          )
        )
      },
      0
    )
  }

  const calcularTotal = () => {
    const precioBase = Number(
      producto?.precio || 0
    )

    return (
      precioBase +
      calcularTotalAdicionales()
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR PERSONALIZACIÓN
  |--------------------------------------------------------------------------
  */

  const handleConfirmar = () => {
    const observacionesLimpias =
      observaciones.trim()

    /*
     * Se conserva exactamente el orden en el que
     * el cliente seleccionó los acompañamientos.
     */
    const acompanamientosIds =
      seleccionados.map(
        (acompanamiento) =>
          Number(acompanamiento.id)
      )

    /*
     * Este objeto se utiliza para mostrar la selección
     * en React. Laravel no utiliza estos nombres ni
     * precios para calcular el total definitivo.
     */
    const acompanamientosPreparados =
      seleccionados.map(
        (
          acompanamiento,
          indice
        ) => ({
          id:
            Number(
              acompanamiento.id
            ),

          nombre:
            acompanamiento.nombre,

          precio_extra:
            obtenerPrecioExtra(
              acompanamiento
            ),

          incluido:
            indice < 2,

          adicional:
            indice >= 2,

          posicion:
            indice + 1,
        })
      )

    const personalizacion = {
      tipo: 'acompanamientos',

      acompanamientos:
        acompanamientosPreparados,

      acompanamientos_incluidos:
        acompanamientosPreparados.filter(
          (acompanamiento) =>
            acompanamiento.incluido
        ),

      acompanamientos_adicionales:
        acompanamientosPreparados.filter(
          (acompanamiento) =>
            acompanamiento.adicional
        ),

      total_adicionales:
        calcularTotalAdicionales(),

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

      descripcion:
        producto.descripcion,

      extras: null,

      extras_ids: [],

      pasta: null,

      acompanamientos_ids:
        acompanamientosIds,

      observaciones:
        observacionesLimpias ||
        null,

      personalizacion,
    })
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
                  Selecciona tus acompañamientos
                </p>

                <h2 className="truncate text-lg font-black text-white sm:text-xl">
                  {producto.nombre}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancelar}
              aria-label="Cerrar selector de acompañamientos"
              className="shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-[#E4002B]"
            >
              <X size={24} />
            </button>
          </div>

          {/* PRECIO BASE */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="text-sm text-white/60">
              Precio del producto
            </span>

            <span className="font-mono text-sm font-bold text-white">
              ₡
              {formatearPrecio(
                producto.precio
              )}
            </span>
          </div>

          {/* INFORMACIÓN */}
          <div className="mb-5 rounded-xl border border-[#F5A300]/20 bg-[#F5A300]/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5A300]/15 text-sm font-black text-[#F5A300]">
                2
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Los primeros dos están incluidos
                </p>

                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Puedes seleccionar más acompañamientos. El tercero y los siguientes se cobrarán con el precio configurado.
                </p>
              </div>
            </div>
          </div>

          {/* CONTADOR */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white">
                Acompañamientos disponibles
              </h3>

              <p className="text-xs text-white/40">
                Se respeta el orden de selección.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
              {seleccionados.length}{' '}
              {seleccionados.length === 1
                ? 'seleccionado'
                : 'seleccionados'}
            </span>
          </div>

          {/* LISTA DE ACOMPAÑAMIENTOS */}
          {acompanamientos.length === 0 ? (
            <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
              <p className="text-sm font-medium text-yellow-300">
                No hay acompañamientos disponibles en este momento.
              </p>
            </div>
          ) : (
            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {acompanamientos.map(
                (acompanamiento) => {
                  const seleccionado =
                    estaSeleccionado(
                      acompanamiento
                    )

                  const incluido =
                    estaIncluido(
                      acompanamiento
                    )

                  const posicion =
                    obtenerPosicion(
                      acompanamiento
                    )

                  const esAdicional =
                    seleccionado &&
                    posicion >= 2

                  return (
                    <button
                      key={acompanamiento.id}
                      type="button"
                      onClick={() =>
                        toggleAcompanamiento(
                          acompanamiento
                        )
                      }
                      className={`
                        flex min-h-[76px]
                        w-full items-center
                        justify-between gap-3
                        rounded-xl border
                        p-3 text-left
                        transition-all
                        ${
                          seleccionado
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
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`
                            flex h-7 w-7
                            shrink-0 items-center
                            justify-center
                            rounded-lg border
                            ${
                              seleccionado
                                ? `
                                    border-[#F5A300]
                                    bg-[#F5A300]
                                    text-black
                                  `
                                : `
                                    border-white/20
                                    text-white/40
                                  `
                            }
                          `}
                        >
                          {seleccionado ? (
                            <Check size={16} />
                          ) : (
                            <Plus size={16} />
                          )}
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">
                            {acompanamiento.nombre}
                          </span>

                          {seleccionado && (
                            <span className="mt-0.5 block text-[10px] font-medium">
                              Selección{' '}
                              {posicion + 1}
                            </span>
                          )}
                        </span>
                      </span>

                      <span className="shrink-0 text-right">
                        {incluido ? (
                          <span className="block rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black text-green-300">
                            Incluido
                          </span>
                        ) : esAdicional ? (
                          <>
                            <span className="block text-[9px] font-bold uppercase text-white/40">
                              Adicional
                            </span>

                            <span className="block font-mono text-xs font-black text-[#F5A300]">
                              +₡
                              {formatearPrecio(
                                acompanamiento
                                  .precio_extra
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-xs font-bold text-white/40">
                            +₡
                            {formatearPrecio(
                              acompanamiento
                                .precio_extra
                            )}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          )}

          {/* RESUMEN DE SELECCIÓN */}
          <div className="mb-5 rounded-xl border border-[#F5A300]/20 bg-[#F5A300]/5 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#F5A300]">
              Resumen de acompañamientos
            </p>

            {seleccionados.length === 0 ? (
              <p className="text-sm text-white/40">
                No has seleccionado acompañamientos.
              </p>
            ) : (
              <div className="space-y-3">
                {/* INCLUIDOS */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-white/60">
                      Incluidos
                    </p>

                    <span className="text-[10px] font-bold text-green-300">
                      {incluidos.length}/2
                    </span>
                  </div>

                  {incluidos.length === 0 ? (
                    <p className="text-xs text-white/30">
                      Ninguno seleccionado.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {incluidos.map(
                        (
                          acompanamiento,
                          indice
                        ) => (
                          <div
                            key={
                              acompanamiento.id
                            }
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-white/70">
                              {indice + 1}.{' '}
                              {
                                acompanamiento.nombre
                              }
                            </span>

                            <span className="text-xs font-bold text-green-300">
                              Incluido
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* ADICIONALES */}
                {adicionales.length > 0 && (
                  <div className="border-t border-[#F5A300]/15 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold text-white/60">
                        Adicionales
                      </p>

                      <span className="text-[10px] font-bold text-[#F5A300]">
                        {adicionales.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {adicionales.map(
                        (
                          acompanamiento,
                          indice
                        ) => (
                          <div
                            key={
                              acompanamiento.id
                            }
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-white/70">
                              {indice + 3}.{' '}
                              {
                                acompanamiento.nombre
                              }
                            </span>

                            <span className="font-mono text-xs font-bold text-[#F5A300]">
                              +₡
                              {formatearPrecio(
                                acompanamiento
                                  .precio_extra
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#F5A300]/15 pt-3">
                  <span className="text-sm font-bold text-white/70">
                    Total adicionales
                  </span>

                  <span className="font-mono font-black text-[#F5A300]">
                    ₡
                    {formatearPrecio(
                      calcularTotalAdicionales()
                    )}
                  </span>
                </div>
              </div>
            )}
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
              placeholder="Ej: Papas bien tostadas, ensalada sin cebolla, acompañamiento aparte, etc."
              className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#F5A300]"
            />

            <p className="mt-1 text-right text-[10px] text-white/30">
              {observaciones.length}
              /2000
            </p>
          </div>

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
                Laravel validará nuevamente los precios y la disponibilidad.
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
                className="rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] px-6 py-2 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#E4002B]/50"
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