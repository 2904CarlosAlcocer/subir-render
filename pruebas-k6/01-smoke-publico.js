import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL =
  __ENV.BASE_URL ||
  'http://127.0.0.1:8000/api'

const erroresApi = new Rate(
  'errores_api'
)

const duracionCategorias = new Trend(
  'duracion_categorias',
  true
)

const duracionProductos = new Trend(
  'duracion_productos',
  true
)

const duracionDestacado = new Trend(
  'duracion_destacado',
  true
)

export const options = {
  vus: 1,

  iterations: 5,

  thresholds: {
    /*
     * Menos del 1 % de solicitudes HTTP
     * pueden fallar.
     */
    http_req_failed: [
      'rate<0.01',
    ],

    /*
     * El 95 % de todas las solicitudes
     * debe tardar menos de 500 ms.
     */
    http_req_duration: [
      'p(95)<500',
    ],

    /*
     * Menos del 1 % de las validaciones
     * internas pueden fallar.
     */
    errores_api: [
      'rate<0.01',
    ],

    /*
     * Criterios individuales para cada
     * operación del menú.
     */
    duracion_categorias: [
      'p(95)<500',
    ],

    duracion_productos: [
      'p(95)<500',
    ],

    duracion_destacado: [
      'p(95)<500',
    ],
  },
}

function registrarResultado(
  respuesta,
  metrica,
  nombre,
  validacionContenido
) {
  /*
   * Guardar la duración de esta
   * solicitud en su métrica.
   */
  metrica.add(
    respuesta.timings.duration
  )

  /*
   * Comprobar el estado HTTP,
   * el formato JSON y el contenido.
   */
  const resultado = check(
    respuesta,
    {
      [`${nombre}: estado HTTP 200`]:
        (res) => {
          return res.status === 200
        },

      [`${nombre}: respuesta JSON válida`]:
        (res) => {
          try {
            res.json()

            return true
          } catch (error) {
            return false
          }
        },

      [`${nombre}: contenido esperado`]:
        (res) => {
          try {
            const contenido =
              res.json()

            return validacionContenido(
              contenido
            )
          } catch (error) {
            return false
          }
        },
    }
  )

  /*
   * Registrar como error cuando alguna
   * de las comprobaciones falla.
   */
  erroresApi.add(
    !resultado
  )
}

export default function () {
  group(
    'Flujo público: consultar menú',
    () => {
      /*
       * CONSULTAR CATEGORÍAS
       */
      const categorias = http.get(
        `${BASE_URL}/categorias`,
        {
          headers: {
            Accept:
              'application/json',
          },

          tags: {
            endpoint:
              'categorias',
          },
        }
      )

      registrarResultado(
        categorias,
        duracionCategorias,
        'Categorías',
        (contenido) => {
          return (
            Array.isArray(
              contenido
            ) &&
            contenido.length > 0
          )
        }
      )

      /*
       * Simular una pausa breve del
       * usuario entre solicitudes.
       */
      sleep(0.5)

      /*
       * CONSULTAR PRODUCTOS
       */
      const productos = http.get(
        `${BASE_URL}/productos`,
        {
          headers: {
            Accept:
              'application/json',
          },

          tags: {
            endpoint:
              'productos',
          },
        }
      )

      registrarResultado(
        productos,
        duracionProductos,
        'Productos',
        (contenido) => {
          return (
            Array.isArray(
              contenido
            ) &&
            contenido.length > 0
          )
        }
      )

      sleep(0.5)

      /*
       * CONSULTAR PRODUCTO DESTACADO
       */
      const destacado = http.get(
        `${BASE_URL}/productos/destacado-home`,
        {
          headers: {
            Accept:
              'application/json',
          },

          tags: {
            endpoint:
              'producto_destacado',
          },
        }
      )

      registrarResultado(
        destacado,
        duracionDestacado,
        'Producto destacado',
        (contenido) => {
          return (
            contenido !== null &&
            typeof contenido ===
              'object' &&
            Boolean(contenido.id) &&
            Boolean(
              contenido.nombre
            )
          )
        }
      )
    }
  )

  /*
   * Simular un tiempo breve de lectura
   * antes de comenzar otra iteración.
   */
  sleep(1)
}