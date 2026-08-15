import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL =
  __ENV.BASE_URL ||
  'http://localhost/rooster-project/backend/public/api';

const erroresCreacion =
  new Rate('errores_creacion_pedido');

const duracionCreacion =
  new Trend('duracion_creacion_pedido', true);

export const options = {
  scenarios: {
    productos_distintos: {
      executor: 'shared-iterations',
      vus: 3,
      iterations: 12,
      maxDuration: '5m',
      gracefulStop: '30s',
    },
  },

  thresholds: {
    errores_creacion_pedido: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
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
      'Faltan CAJA_EMAIL y CAJA_PASSWORD.'
    );
  }

  const headersJson = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

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
    'Login caja: HTTP 200': (r) =>
      r.status === 200,

    'Login caja: token recibido': () =>
      typeof token === 'string' &&
      token.length > 0,
  });

  if (!loginCorrecto || !token) {
    fail(
      `No se pudo iniciar sesión. ` +
      `HTTP ${loginRespuesta.status}. ` +
      `${String(loginRespuesta.body).slice(0, 300)}`
    );
  }

  const headersAutenticados = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const clientesRespuesta = http.get(
    `${BASE_URL}/clientes`,
    {
      headers: headersAutenticados,
      tags: {
        endpoint: 'clientes_setup',
      },
    }
  );

  const clientes = obtenerJson(
    clientesRespuesta
  );

  if (
    clientesRespuesta.status !== 200 ||
    !Array.isArray(clientes) ||
    clientes.length === 0
  ) {
    fail(
      'No existen clientes disponibles.'
    );
  }

  const productosRespuesta = http.get(
    `${BASE_URL}/productos`,
    {
      headers: headersAutenticados,
      tags: {
        endpoint: 'productos_setup',
      },
    }
  );

  const productos = obtenerJson(
    productosRespuesta
  );

  if (
    productosRespuesta.status !== 200 ||
    !Array.isArray(productos)
  ) {
    fail(
      'No fue posible obtener los productos.'
    );
  }

  const productosSimples = productos
    .filter((producto) => {
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
    })
    .slice(0, 3);

  if (productosSimples.length < 3) {
    fail(
      'Se necesitan al menos tres productos ' +
      'sencillos disponibles.'
    );
  }

  productosSimples.forEach(
    (producto, indice) => {
      console.log(
        `Producto VU ${indice + 1}: ` +
        `${producto.id} - ${producto.nombre}`
      );
    }
  );

  return {
    token,
    clienteId: clientes[0].id,

    productos: productosSimples.map(
      (producto) => ({
        id: producto.id,
        nombre: producto.nombre,

        esPizza: esVerdadero(
          producto.es_pizza
        ),
      })
    ),
  };
}

export default function (datos) {
  const indiceProducto =
    (__VU - 1) % datos.productos.length;

  const producto =
    datos.productos[indiceProducto];

  const productosPayload = [
    {
      producto_id: producto.id,
      cantidad: 1,

      tamano_pizza: producto.esPizza
        ? 'grande'
        : null,

      extras: null,
      extras_ids: [],
      pasta: null,
      acompanamientos_ids: [],

      observaciones:
        `DIAGNÓSTICO K6 PRODUCTOS DISTINTOS ` +
        `VU ${__VU} - NO DESPACHAR`,

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

        Authorization:
          `Bearer ${datos.token}`,
      },

      tags: {
        endpoint: 'crear_pedido',
        prueba: 'productos_distintos',
      },
    }
  );

  duracionCreacion.add(
    respuesta.timings.duration
  );

  const cuerpo = obtenerJson(respuesta);

  const correcto = check(respuesta, {
    'Pedido: HTTP 201': (r) =>
      r.status === 201,

    'Pedido: JSON válido': () =>
      cuerpo !== null,

    'Pedido: identificador recibido': () =>
      Boolean(cuerpo?.pedido?.id),

    'Pedido: tracking recibido': () =>
      typeof cuerpo?.pedido
        ?.codigo_tracking === 'string',

    'Pedido: total calculado': () =>
      Number(cuerpo?.pedido?.total) > 0,
  });

  erroresCreacion.add(!correcto);

  if (respuesta.status === 201) {
    console.log(
      `VU ${__VU} | ` +
      `${producto.nombre} | ` +
      `${cuerpo.pedido.codigo_tracking} | ` +
      `${respuesta.timings.duration.toFixed(2)} ms`
    );
  } else {
    console.error(
      `VU ${__VU} rechazado. ` +
      `HTTP ${respuesta.status}: ` +
      `${String(respuesta.body).slice(0, 400)}`
    );
  }

  sleep(2);
}