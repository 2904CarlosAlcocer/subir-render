import { create } from 'zustand'

/*
|--------------------------------------------------------------------------
| NORMALIZAR IDENTIFICADORES
|--------------------------------------------------------------------------
*/

const normalizarId = (valor) => {
  const id = Number(valor)

  return Number.isInteger(id) && id > 0
    ? id
    : null
}

/*
 * Se utiliza para selecciones en las que el orden
 * no cambia el resultado, como extras de pizza,
 * proteínas e ingredientes de pasta.
 */
const normalizarIdsOrdenados = (ids) => {
  if (!Array.isArray(ids)) {
    return []
  }

  return ids
    .map((id) => normalizarId(id))
    .filter((id) => id !== null)
    .filter(
      (id, indice, arreglo) =>
        arreglo.indexOf(id) === indice
    )
    .sort((a, b) => a - b)
}

/*
 * Los acompañamientos conservan el orden elegido.
 * Laravel considera los primeros dos como incluidos
 * y cobra los seleccionados desde la tercera posición.
 */
const normalizarIdsConOrden = (ids) => {
  if (!Array.isArray(ids)) {
    return []
  }

  return ids
    .map((id) => normalizarId(id))
    .filter((id) => id !== null)
    .filter(
      (id, indice, arreglo) =>
        arreglo.indexOf(id) === indice
    )
}

const normalizarExtrasIds = (extrasIds) => {
  return normalizarIdsOrdenados(
    extrasIds
  )
}

/*
|--------------------------------------------------------------------------
| NORMALIZAR TAMAÑO DE PIZZA
|--------------------------------------------------------------------------
|
| Solamente se aceptan:
|
| - grande
| - personal
|
| Los productos que no son pizzas mantienen este valor en null.
|
*/

const normalizarTamanoPizza = (tamano) => {
  const valor = String(
    tamano || ''
  )
    .trim()
    .toLowerCase()

  if (
    valor === 'grande' ||
    valor === 'personal'
  ) {
    return valor
  }

  return null
}

/*
|--------------------------------------------------------------------------
| NORMALIZAR PERSONALIZACIÓN DE PASTA
|--------------------------------------------------------------------------
|
| Este objeto utiliza exactamente las claves que espera Laravel:
|
| - tipo_pasta_id
| - proteina_ids
| - salsa_id
| - ingrediente_ids
|
*/

const normalizarPasta = (pasta) => {
  if (
    !pasta ||
    typeof pasta !== 'object' ||
    Array.isArray(pasta)
  ) {
    return null
  }

  const resultado = {
    tipo_pasta_id:
      normalizarId(
        pasta.tipo_pasta_id
      ),

    proteina_ids:
      normalizarIdsOrdenados(
        pasta.proteina_ids
      ),

    salsa_id:
      normalizarId(
        pasta.salsa_id
      ),

    ingrediente_ids:
      normalizarIdsOrdenados(
        pasta.ingrediente_ids
      ),
  }

  const tieneSeleccion =
    resultado.tipo_pasta_id !== null ||
    resultado.proteina_ids.length > 0 ||
    resultado.salsa_id !== null ||
    resultado.ingrediente_ids.length > 0

  return tieneSeleccion
    ? resultado
    : null
}

/*
|--------------------------------------------------------------------------
| NORMALIZAR TEXTO PARA LA IDENTIDAD DE LA LÍNEA
|--------------------------------------------------------------------------
*/

const normalizarTexto = (valor) => {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/*
|--------------------------------------------------------------------------
| CREAR IDENTIFICADOR DE PERSONALIZACIÓN
|--------------------------------------------------------------------------
|
| Dos productos se combinan en una sola línea únicamente cuando tienen:
|
| - El mismo producto.
| - El mismo tamaño de pizza.
| - Los mismos extras de pizza.
| - La misma composición de pasta.
| - Los mismos acompañamientos en el mismo orden.
| - Las mismas observaciones.
|
*/

const crearLineaId = (producto) => {
  const productoId =
    normalizarId(
      producto.producto_id ??
      producto.id
    ) ?? 0

  const tamanoPizza =
    normalizarTamanoPizza(
      producto.tamano_pizza
    )

  const extrasIds =
    normalizarExtrasIds(
      producto.extras_ids
    )

  const pasta =
    normalizarPasta(
      producto.pasta
    )

  const acompanamientosIds =
    normalizarIdsConOrden(
      producto.acompanamientos_ids
    )

  const observaciones =
    normalizarTexto(
      producto.observaciones
    )

  return JSON.stringify({
    producto_id: productoId,
    tamano_pizza: tamanoPizza,
    extras_ids: extrasIds,
    pasta,
    acompanamientos_ids:
      acompanamientosIds,
    observaciones,
  })
}

/*
|--------------------------------------------------------------------------
| STORE DEL CARRITO
|--------------------------------------------------------------------------
*/

const useCarritoStore = create(
  (set, get) => ({
    items: [],

    modalidad:
      'consumo_local',

    cliente: {
      nombre: '',
      telefono: '',
      correo: '',
    },

    /*
    |--------------------------------------------------------------------------
    | AGREGAR PRODUCTO
    |--------------------------------------------------------------------------
    */

    agregarProducto: (producto) =>
      set((state) => {
        const productoId =
          normalizarId(
            producto.producto_id ??
            producto.id
          )

        if (productoId === null) {
          console.error(
            'No se pudo agregar el producto porque su ID no es válido.',
            producto
          )

          return state
        }

        const cantidadAgregar =
          Math.max(
            1,
            Number(
              producto.cantidad
            ) || 1
          )

        /*
         * Este precio se utiliza solamente como estimación
         * visual en React. Laravel vuelve a calcular el valor
         * definitivo desde la base de datos.
         */
        const precioProducto =
          Number(
            producto.precio
          ) || 0

        const tamanoPizza =
          normalizarTamanoPizza(
            producto.tamano_pizza
          )

        const extrasIds =
          normalizarExtrasIds(
            producto.extras_ids
          )

        const pasta =
          normalizarPasta(
            producto.pasta
          )

        const acompanamientosIds =
          normalizarIdsConOrden(
            producto.acompanamientos_ids
          )

        const lineaId =
          crearLineaId({
            ...producto,

            producto_id:
              productoId,

            tamano_pizza:
              tamanoPizza,

            extras_ids:
              extrasIds,

            pasta,

            acompanamientos_ids:
              acompanamientosIds,
          })

        const existente =
          state.items.find(
            (item) =>
              item.linea_id ===
              lineaId
          )

        /*
         * Si existe exactamente la misma personalización,
         * únicamente aumenta su cantidad.
         */
        if (existente) {
          return {
            items:
              state.items.map(
                (item) =>
                  item.linea_id ===
                  lineaId
                    ? {
                        ...item,

                        cantidad:
                          Number(
                            item.cantidad
                          ) +
                          cantidadAgregar,

                        precio:
                          precioProducto,

                        tamano_pizza:
                          tamanoPizza,

                        extras:
                          producto.extras ??
                          item.extras ??
                          null,

                        extras_ids:
                          extrasIds,

                        pasta,

                        acompanamientos_ids:
                          acompanamientosIds,

                        observaciones:
                          producto
                            .observaciones ??
                          item
                            .observaciones ??
                          null,

                        personalizacion:
                          producto
                            .personalizacion ??
                          item
                            .personalizacion ??
                          null,
                      }
                    : item
              ),
          }
        }

        /*
         * Si es una personalización distinta,
         * crea una línea nueva.
         */
        const nuevoItem = {
          /*
           * ID real del producto.
           * Se mantiene para enviarlo correctamente
           * a Laravel.
           */
          id: productoId,

          producto_id:
            productoId,

          /*
           * Identificador único de esta personalización
           * dentro del carrito.
           */
          linea_id:
            lineaId,

          nombre:
            producto.nombre,

          precio:
            precioProducto,

          imagen_url:
            producto.imagen_url ??
            null,

          descripcion:
            producto.descripcion ??
            null,

          cantidad:
            cantidadAgregar,

          /*
           * Tamaño elegido dentro de PersonalizadorPizza.
           * En productos que no son pizzas permanece en null.
           */
          tamano_pizza:
            tamanoPizza,

          /*
           * Personalización actual de pizzas.
           */
          extras:
            producto.extras ??
            null,

          extras_ids:
            extrasIds,

          /*
           * Estructura que Laravel utilizará
           * para recalcular una pasta.
           */
          pasta,

          /*
           * El orden debe conservarse porque los
           * primeros dos acompañamientos son incluidos.
           */
          acompanamientos_ids:
            acompanamientosIds,

          observaciones:
            producto.observaciones ??
            null,

          /*
           * Información preparada por React para mostrar
           * la selección en el carrito. Laravel no confía
           * en este objeto para calcular el precio.
           */
          personalizacion:
            producto.personalizacion ??
            null,
        }

        return {
          items: [
            ...state.items,
            nuevoItem,
          ],
        }
      }),

    /*
    |--------------------------------------------------------------------------
    | ELIMINAR UNA LÍNEA DEL CARRITO
    |--------------------------------------------------------------------------
    |
    | El identificador correcto es linea_id.
    |
    | También acepta temporalmente el ID del producto
    | para mantener compatibilidad con Carrito.jsx.
    |
    */

    eliminarProducto: (
      identificador
    ) =>
      set((state) => {
        const existeLinea =
          state.items.some(
            (item) =>
              item.linea_id ===
              identificador
          )

        return {
          items:
            existeLinea
              ? state.items.filter(
                  (item) =>
                    item.linea_id !==
                    identificador
                )
              : state.items.filter(
                  (item) =>
                    Number(item.id) !==
                    Number(
                      identificador
                    )
                ),
        }
      }),

    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR CANTIDAD DE UNA LÍNEA
    |--------------------------------------------------------------------------
    */

    actualizarCantidad: (
      identificador,
      cantidad
    ) =>
      set((state) => {
        const nuevaCantidad =
          Number(cantidad)

        const existeLinea =
          state.items.some(
            (item) =>
              item.linea_id ===
              identificador
          )

        const itemsActualizados =
          state.items.map(
            (item) => {
              const coincide =
                existeLinea
                  ? item.linea_id ===
                    identificador
                  : Number(
                      item.id
                    ) ===
                    Number(
                      identificador
                    )

              return coincide
                ? {
                    ...item,
                    cantidad:
                      nuevaCantidad,
                  }
                : item
            }
          )

        return {
          items:
            itemsActualizados.filter(
              (item) =>
                Number(
                  item.cantidad
                ) > 0
            ),
        }
      }),

    /*
    |--------------------------------------------------------------------------
    | MODALIDAD
    |--------------------------------------------------------------------------
    */

    setModalidad: (
      modalidad
    ) =>
      set({
        modalidad,
      }),

    /*
    |--------------------------------------------------------------------------
    | CLIENTE
    |--------------------------------------------------------------------------
    */

    setCliente: (cliente) =>
      set({
        cliente,
      }),

    /*
    |--------------------------------------------------------------------------
    | LIMPIAR CARRITO
    |--------------------------------------------------------------------------
    */

    limpiarCarrito: () =>
      set({
        items: [],

        modalidad:
          'consumo_local',

        cliente: {
          nombre: '',
          telefono: '',
          correo: '',
        },
      }),

    /*
    |--------------------------------------------------------------------------
    | OBTENER TOTAL
    |--------------------------------------------------------------------------
    */

    obtenerTotal: () => {
      return get().items.reduce(
        (total, item) => {
          const precio =
            Number(
              item.precio
            ) || 0

          const cantidad =
            Number(
              item.cantidad
            ) || 0

          return (
            total +
            precio * cantidad
          )
        },
        0
      )
    },

    /*
    |--------------------------------------------------------------------------
    | OBTENER CANTIDAD TOTAL
    |--------------------------------------------------------------------------
    */

    obtenerCantidadItems:
      () => {
        return get().items.reduce(
          (total, item) => {
            return (
              total +
              (
                Number(
                  item.cantidad
                ) || 0
              )
            )
          },
          0
        )
      },
  })
)

export default useCarritoStore