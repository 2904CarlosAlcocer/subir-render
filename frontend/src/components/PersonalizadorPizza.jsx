import { useState } from 'react'
import {
  Plus,
  X,
  Check,
  Pizza,
} from 'lucide-react'

export default function PersonalizadorPizza({
  producto,
  onConfirmar,
  onCancelar,
  extrasDisponibles = [],
}) {
  const [
    extrasSeleccionados,
    setExtrasSeleccionados,
  ] = useState([])

  const [
    observaciones,
    setObservaciones,
  ] = useState('')

  const [
    mostrarExtras,
    setMostrarExtras,
  ] = useState(false)

  /*
  |--------------------------------------------------------------------------
  | TAMAÑO DE LA PIZZA
  |--------------------------------------------------------------------------
  |
  | precio:
  | Precio de la pizza grande.
  |
  | precio_personal:
  | Precio opcional de la pizza personal.
  |
  */

  const tienePrecioPersonal =
    Number(
      producto?.precio_personal || 0
    ) > 0

  const [
    tamanoSeleccionado,
    setTamanoSeleccionado,
  ] = useState('grande')

  const precioBaseSeleccionado =
    tamanoSeleccionado === 'personal' &&
    tienePrecioPersonal
      ? Number(
          producto?.precio_personal || 0
        )
      : Number(producto?.precio || 0)

  const nombreTamanoSeleccionado =
    tamanoSeleccionado === 'personal' &&
    tienePrecioPersonal
      ? 'Personal'
      : 'Grande'

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR O QUITAR UN INGREDIENTE EXTRA
  |--------------------------------------------------------------------------
  */

  const toggleExtra = (extra) => {
    setExtrasSeleccionados(
      (extrasActuales) => {
        const yaSeleccionado =
          extrasActuales.some(
            (ingrediente) =>
              ingrediente.id === extra.id
          )

        if (yaSeleccionado) {
          return extrasActuales.filter(
            (ingrediente) =>
              ingrediente.id !== extra.id
          )
        }

        return [
          ...extrasActuales,
          extra,
        ]
      }
    )
  }

  /*
  |--------------------------------------------------------------------------
  | FORMATEAR PRECIOS
  |--------------------------------------------------------------------------
  */

  const formatearPrecio = (monto) => {
    return Number(monto || 0).toLocaleString(
      'es-CR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CALCULAR PRECIO DE LOS EXTRAS
  |--------------------------------------------------------------------------
  |
  | Cada ingrediente utiliza precio_extra,
  | recibido desde la base de datos.
  |
  */

  const calcularTotalExtras = () => {
    return extrasSeleccionados.reduce(
      (total, extra) => {
        const precioExtra = Number(
          extra.precio_extra || 0
        )

        return total + precioExtra
      },
      0
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CALCULAR PRECIO TOTAL
  |--------------------------------------------------------------------------
  */

  const calcularTotal = () => {
    const totalExtras =
      calcularTotalExtras()

    return (
      precioBaseSeleccionado +
      totalExtras
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR PERSONALIZACIÓN
  |--------------------------------------------------------------------------
  |
  | Se envían:
  |
  | - tamano_pizza: grande o personal.
  | - extras: nombres para mostrarlos en el carrito.
  | - extras_ids: identificadores para que Laravel
  |   consulte nuevamente sus precios en la BD.
  |
  | El precio enviado por React es solamente visual.
  | Laravel volverá a calcular el precio definitivo.
  |
  */

  const handleConfirmar = () => {
    const totalCalculado =
      calcularTotal()

    const nombresExtras =
      extrasSeleccionados
        .map((extra) => extra.nombre)
        .join(', ')

    const identificadoresExtras =
      extrasSeleccionados.map(
        (extra) => extra.id
      )

    const tamanoFinal =
      tamanoSeleccionado === 'personal' &&
      tienePrecioPersonal
        ? 'personal'
        : 'grande'

    const nombreTamanoFinal =
      tamanoFinal === 'personal'
        ? 'Personal'
        : 'Grande'

    onConfirmar({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: totalCalculado,
      cantidad: 1,
      imagen_url: producto.imagen_url,

      tamano_pizza:
        tamanoFinal,

      extras:
        nombresExtras || null,

      extras_ids:
        identificadoresExtras,

      observaciones:
        observaciones.trim() || null,

      personalizacion: {
        tipo: 'pizza',

        tamano_pizza:
          tamanoFinal,

        tamano_texto:
          nombreTamanoFinal,

        precio_base:
          precioBaseSeleccionado,

        extras:
          extrasSeleccionados,

        extras_ids:
          identificadoresExtras,

        observaciones:
          observaciones.trim() || null,
      },
    })
  }

  return (
    <div className="
      fixed inset-0 z-[10000]
      flex items-center justify-center
      bg-black/75
      px-4 py-6
      backdrop-blur-md
    ">
      <div className="
        max-h-[90vh]
        w-full max-w-2xl
        overflow-y-auto
        rounded-3xl
        border border-[#F5A300]/30
        bg-[#160F0B]
        shadow-2xl
      ">
        <div className="
          h-[4px]
          bg-gradient-to-r
          from-[#E4002B]
          via-[#F5A300]
          to-[#E4002B]
        " />

        <div className="p-6">
          {/* HEADER */}
          <div className="
            mb-4
            flex items-center justify-between
          ">
            <div className="
              flex min-w-0 items-center gap-3
            ">
              <Pizza className="
                h-6 w-6 shrink-0
                text-[#F5A300]
              " />

              <h2 className="
                truncate
                text-xl font-bold text-white
              ">
                Personalizar{' '}
                {producto.nombre}
              </h2>
            </div>

            <button
              type="button"
              onClick={onCancelar}
              aria-label="Cerrar personalizador"
              className="
                ml-3 shrink-0
                rounded-lg p-1
                text-white/40
                transition-colors
                hover:bg-white/5
                hover:text-[#E4002B]
              "
            >
              <X size={24} />
            </button>
          </div>

          {/* SELECCIÓN DE TAMAÑO */}
          {tienePrecioPersonal ? (
            <div className="mb-4">
              <p className="
                mb-2
                text-xs font-bold
                uppercase tracking-wide
                text-white/60
              ">
                Selecciona el tamaño
              </p>

              <div className="
                grid grid-cols-1 gap-3
                sm:grid-cols-2
              ">
                <button
                  type="button"
                  onClick={() =>
                    setTamanoSeleccionado(
                      'grande'
                    )
                  }
                  className={`
                    flex items-center
                    justify-between
                    rounded-xl
                    border p-4
                    text-left
                    transition-all
                    ${
                      tamanoSeleccionado ===
                      'grande'
                        ? `
                          border-[#F5A300]
                          bg-[#F5A300]/10
                          shadow-lg
                          shadow-[#F5A300]/10
                        `
                        : `
                          border-white/10
                          bg-black/20
                          hover:border-white/20
                          hover:bg-white/5
                        `
                    }
                  `}
                >
                  <span>
                    <span className="
                      block text-sm
                      font-black text-white
                    ">
                      Grande
                    </span>

                    <span className="
                      mt-0.5 block
                      text-xs text-white/40
                    ">
                      Pizza de tamaño grande
                    </span>
                  </span>

                  <span className="
                    ml-3 whitespace-nowrap
                    font-mono text-sm
                    font-black text-[#F5A300]
                  ">
                    ₡
                    {formatearPrecio(
                      producto.precio
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTamanoSeleccionado(
                      'personal'
                    )
                  }
                  className={`
                    flex items-center
                    justify-between
                    rounded-xl
                    border p-4
                    text-left
                    transition-all
                    ${
                      tamanoSeleccionado ===
                      'personal'
                        ? `
                          border-[#F5A300]
                          bg-[#F5A300]/10
                          shadow-lg
                          shadow-[#F5A300]/10
                        `
                        : `
                          border-white/10
                          bg-black/20
                          hover:border-white/20
                          hover:bg-white/5
                        `
                    }
                  `}
                >
                  <span>
                    <span className="
                      block text-sm
                      font-black text-white
                    ">
                      Personal
                    </span>

                    <span className="
                      mt-0.5 block
                      text-xs text-white/40
                    ">
                      Pizza individual
                    </span>
                  </span>

                  <span className="
                    ml-3 whitespace-nowrap
                    font-mono text-sm
                    font-black text-[#F5A300]
                  ">
                    ₡
                    {formatearPrecio(
                      producto.precio_personal
                    )}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="
              mb-4
              flex items-center justify-between
              rounded-xl
              border border-white/10
              bg-black/20
              p-3
            ">
              <span className="
                text-sm text-white/60
              ">
                Precio de la pizza
              </span>

              <span className="
                font-mono
                text-sm font-bold
                text-white
              ">
                ₡
                {formatearPrecio(
                  producto.precio
                )}
              </span>
            </div>
          )}

          {/* RESUMEN DEL TAMAÑO */}
          {tienePrecioPersonal && (
            <div className="
              mb-4
              flex items-center justify-between
              rounded-xl
              border border-[#F5A300]/20
              bg-[#F5A300]/5
              p-3
            ">
              <span className="
                text-sm text-white/60
              ">
                Tamaño seleccionado
              </span>

              <span className="
                text-sm font-bold
                text-[#F5A300]
              ">
                {nombreTamanoSeleccionado}
              </span>
            </div>
          )}

          {/* INGREDIENTES BASE */}
          {producto.ingredientes_base &&
            producto.ingredientes_base
              .length > 0 && (
              <div className="
                mb-4
                rounded-xl
                bg-white/5
                p-3
              ">
                <p className="
                  mb-2
                  text-xs font-bold
                  uppercase tracking-wide
                  text-white/60
                ">
                  Ingredientes base
                </p>

                <div className="
                  flex flex-wrap gap-2
                ">
                  {producto
                    .ingredientes_base
                    .map((ingrediente) => (
                      <span
                        key={ingrediente.id}
                        className="
                          rounded-lg
                          bg-[#F5A300]/20
                          px-2 py-1
                          text-xs
                          text-[#F5A300]
                        "
                      >
                        {ingrediente.nombre}
                      </span>
                    ))}
                </div>
              </div>
            )}

          {/* EXTRAS */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() =>
                setMostrarExtras(
                  (estadoActual) =>
                    !estadoActual
                )
              }
              className="
                flex items-center gap-2
                text-sm font-bold
                text-[#F5A300]
                transition-colors
                hover:text-[#FFD166]
              "
            >
              {mostrarExtras
                ? 'Ocultar extras disponibles'
                : 'Mostrar extras disponibles'}

              <Plus
                size={16}
                className={`
                  transition-transform
                  ${
                    mostrarExtras
                      ? 'rotate-45'
                      : 'rotate-0'
                  }
                `}
              />
            </button>

            {mostrarExtras && (
              <div className="
                mt-3 space-y-2
              ">
                {extrasDisponibles.length ===
                0 ? (
                  <div className="
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    p-4 text-center
                  ">
                    <p className="
                      text-sm text-white/50
                    ">
                      No hay ingredientes
                      extras disponibles.
                    </p>
                  </div>
                ) : (
                  extrasDisponibles.map(
                    (extra) => {
                      const seleccionado =
                        extrasSeleccionados.some(
                          (ingrediente) =>
                            ingrediente.id ===
                            extra.id
                        )

                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() =>
                            toggleExtra(extra)
                          }
                          className={`
                            flex w-full
                            items-center
                            justify-between
                            rounded-xl
                            border p-3
                            text-left
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
                          <span className="
                            flex items-center gap-2
                          ">
                            {seleccionado ? (
                              <Check
                                size={16}
                                className="
                                  text-[#F5A300]
                                "
                              />
                            ) : (
                              <Plus size={16} />
                            )}

                            {extra.nombre}
                          </span>

                          <span className="
                            font-mono
                            text-xs font-bold
                          ">
                            +₡
                            {formatearPrecio(
                              extra.precio_extra
                            )}
                          </span>
                        </button>
                      )
                    }
                  )
                )}
              </div>
            )}
          </div>

          {/* EXTRAS SELECCIONADOS */}
          {extrasSeleccionados.length >
            0 && (
            <div className="
              mb-4
              rounded-xl
              border border-[#F5A300]/20
              bg-[#F5A300]/5
              p-3
            ">
              <p className="
                mb-2
                text-xs font-bold
                uppercase tracking-wide
                text-[#F5A300]
              ">
                Extras seleccionados
              </p>

              <div className="space-y-2">
                {extrasSeleccionados.map(
                  (extra) => (
                    <div
                      key={extra.id}
                      className="
                        flex items-center
                        justify-between
                        text-sm
                      "
                    >
                      <span className="
                        text-white/70
                      ">
                        {extra.nombre}
                      </span>

                      <span className="
                        font-mono
                        text-[#F5A300]
                      ">
                        +₡
                        {formatearPrecio(
                          extra.precio_extra
                        )}
                      </span>
                    </div>
                  )
                )}

                <div className="
                  flex items-center
                  justify-between
                  border-t
                  border-[#F5A300]/20
                  pt-2
                  text-sm font-bold
                ">
                  <span className="
                    text-white/70
                  ">
                    Total extras
                  </span>

                  <span className="
                    font-mono
                    text-[#F5A300]
                  ">
                    ₡
                    {formatearPrecio(
                      calcularTotalExtras()
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* OBSERVACIONES */}
          <div className="mb-4">
            <label className="
              mb-1 block
              text-xs font-bold
              uppercase tracking-wide
              text-white/60
            ">
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
              placeholder="Ej: Sin cebolla, bien cocida, soy alérgico al marisco, etc."
              className="
                h-20 w-full
                resize-none
                rounded-xl
                border border-white/10
                bg-black/40
                px-3 py-2
                text-sm text-white
                outline-none
                transition-colors
                placeholder:text-white/30
                focus:border-[#F5A300]
              "
            />

            <p className="
              mt-1 text-right
              text-[10px] text-white/30
            ">
              {observaciones.length}/2000
            </p>
          </div>

          {/* TOTAL Y BOTONES */}
          <div className="
            flex flex-col gap-4
            border-t border-white/10
            pt-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">
            <div>
              <p className="
                text-xs text-white/60
              ">
                Total
              </p>

              <p className="
                font-mono
                text-2xl font-black
                text-[#F5A300]
              ">
                ₡
                {formatearPrecio(
                  calcularTotal()
                )}
              </p>

              <p className="
                mt-1 text-xs
                text-white/40
              ">
                Tamaño{' '}
                {nombreTamanoSeleccionado}
                {extrasSeleccionados.length >
                0
                  ? ` · ${
                      extrasSeleccionados.length
                    } ${
                      extrasSeleccionados.length ===
                      1
                        ? 'extra'
                        : 'extras'
                    }`
                  : ''}
              </p>
            </div>

            <div className="
              flex flex-col gap-2
              sm:flex-row
            ">
              <button
                type="button"
                onClick={onCancelar}
                className="
                  rounded-xl
                  border border-white/10
                  px-4 py-2
                  text-white/60
                  transition-colors
                  hover:bg-white/5
                  hover:text-white
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmar}
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-[#E4002B]
                  to-[#F5A300]
                  px-6 py-2
                  font-bold text-white
                  transition-all
                  hover:shadow-lg
                  hover:shadow-[#E4002B]/50
                "
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