import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL =
  __ENV.BASE_URL ||
  'http://localhost/rooster-project/backend/public/api';

const erroresCreacion = new Rate('errores_creacion_pedido');
const duracionCreacion = new Trend(
  'duracion_creacion_pedido',
  true
);

export const options = {
  scenarios: {
    creacion_controlada: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '2m',
    },
  },

  thresholds: {
    errores_creacion_pedido: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],

    // SLO provisional para una transacción completa de escritura.
    duracion_creacion_pedido: ['p(95)<2000'],
  },
};

function obtenerJson(respuesta) {
  try {
    return respuesta.json();
  } catch {
    return null;
  }
}

function esVerdadero(valor) {
  return (
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    String(valor).toLowerCase() === 'true'
  );
}

export function setup() {
  if (!__ENV.CAJA_EMAIL || !__ENV.CAJA_PASSWORD) {
    fail(
      'Faltan las variables CAJA_EMAIL y CAJA_PASSWORD.'
    );
  }

  const headersJson = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  /*
   * 1. Iniciar sesión como caja.
   */
  const loginRespuesta = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({
      email: __ENV.CAJA_EMAIL,
      password: __ENV.CAJA_PASSWORD,
    }),
    {
      headers: headersJson,
      tags: {
        endpoint: 'login_caja',
      },
    }
  );

  const loginJson = obtenerJson(loginRespuesta);
  const token = loginJson?.token;

  const loginCorrecto = check(loginRespuesta, {
    'Login caja: estado HTTP 200': (r) =>
      r.status === 200,

    'Login caja: token recibido': () =>
      typeof token === 'string' && token.length > 0,
  });

  if (!loginCorrecto || !token) {
    fail(
      `No se pudo iniciar sesión como caja. ` +
      `HTTP ${loginRespuesta.status}. ` +
      `${String(loginRespuesta.body).slice(0, 300)}`
    );
  }

  const headersAutenticados = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  /*
   * 2. Obtener clientes existentes.
   */
  const clientesRespuesta = http.get(
    `${BASE_URL}/clientes`,
    {
      headers: headersAutenticados,
      tags: {
        endpoint: 'clientes_setup',
      },
    }
  );

  const clientes = obtenerJson(clientesRespuesta);

  if (
    clientesRespuesta.status !== 200 ||
    !Array.isArray(clientes) ||
    clientes.length === 0
  ) {
    fail(
      'No existen clientes disponibles para crear la prueba.'
    );
  }

  /*
   * 3. Obtener productos disponibles.
   */
  const productosRespuesta = http.get(
    `${BASE_URL}/productos`,
    {
      headers: headersAutenticados,
      tags: {
        endpoint: 'productos_setup',
      },
    }
  );

  const productos = obtenerJson(productosRespuesta);

  if (
    productosRespuesta.status !== 200 ||
    !Array.isArray(productos) ||
    productos.length === 0
  ) {
    fail(
      'No existen productos disponibles para crear la prueba.'
    );
  }

  /*
   * Seleccionar un producto que no requiera pasta
   * ni acompañamientos obligatorios.
   *
   * Una pizza es válida porque se enviará como grande.
   */
  const productoSeleccionado = productos.find(
    (producto) => {
      const estado = String(
        producto?.estado ?? 'disponible'
      ).toLowerCase();

      const tipoPersonalizacion = String(
        producto?.tipo_personalizacion ?? ''
      )
        .trim()
        .toLowerCase();

      return (
        estado === 'disponible' &&
        tipoPersonalizacion === '' &&
        !esVerdadero(
          producto?.es_pasta_personalizable
        ) &&
        !esVerdadero(
          producto?.usa_acompanamientos
        )
      );
    }
  );

  if (!productoSeleccionado) {
    fail(
      'No se encontró un producto sencillo disponible para la prueba.'
    );
  }

  console.log(
    `Cliente de prueba: ${clientes[0].id} - ` +
    `${clientes[0].nombre}`
  );

  console.log(
    `Producto de prueba: ${productoSeleccionado.id} - ` +
    `${productoSeleccionado.nombre}`
  );

  return {
    token,
    clienteId: clientes[0].id,
    productoId: productoSeleccionado.id,
    productoEsPizza: esVerdadero(
      productoSeleccionado.es_pizza
    ),
  };
}

export default function (datos) {
  const numeroPrueba = __ITER + 1;

  const productosPayload = [
    {
      producto_id: datos.productoId,
      cantidad: 1,

      tamano_pizza: datos.productoEsPizza
        ? 'grande'
        : null,

      extras: null,
      extras_ids: [],
      pasta: null,
      acompanamientos_ids: [],

      observaciones:
        `PRUEBA K6 ${numeroPrueba} - NO DESPACHAR`,

      alergias: null,
    },
  ];

  const payload = {
    cliente_id: datos.clienteId,
    modalidad_entrega: 'retiro',
    metodo_pago: 'efectivo',
    productos: JSON.stringify(
      productosPayload
    ),
  };

  const respuesta = http.post(
    `${BASE_URL}/pedidos`,
    JSON.stringify(payload),
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${datos.token}`,
      },

      tags: {
        endpoint: 'crear_pedido',
        flujo: 'caja',
      },
    }
  );

  duracionCreacion.add(
    respuesta.timings.duration
  );

  const cuerpo = obtenerJson(respuesta);

  const pedidoCorrecto = check(respuesta, {
    'Pedido: estado HTTP 201': (r) =>
      r.status === 201,

    'Pedido: respuesta JSON válida': () =>
      cuerpo !== null,

    'Pedido: identificador recibido': () =>
      Boolean(cuerpo?.pedido?.id),

    'Pedido: código tracking recibido': () =>
      typeof cuerpo?.pedido?.codigo_tracking ===
        'string' &&
      cuerpo.pedido.codigo_tracking.length > 0,

    'Pedido: total calculado': () =>
      Number(cuerpo?.pedido?.total) > 0,
  });

  erroresCreacion.add(!pedidoCorrecto);

  if (respuesta.status === 201) {
    console.log(
      `Pedido creado: ` +
      `${cuerpo.pedido.codigo_tracking} | ` +
      `${respuesta.timings.duration.toFixed(2)} ms`
    );
  } else {
    console.error(
      `Pedido rechazado. HTTP ${respuesta.status}: ` +
      `${String(respuesta.body).slice(0, 500)}`
    );
  }

  sleep(2);
}