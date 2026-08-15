import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL =
  __ENV.BASE_URL ||
  'http://localhost/rooster-project/backend/public/api';

const erroresApi = new Rate('errores_api_personal');

const duracionLogin = new Trend('duracion_login', true);
const duracionPerfil = new Trend('duracion_perfil', true);
const duracionPedidos = new Trend('duracion_pedidos', true);

export const options = {
  vus: 3,
  duration: '30s',

  thresholds: {
    errores_api_personal: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    duracion_perfil: ['p(95)<500'],
    duracion_pedidos: ['p(95)<500'],
  },
};

const cuentas = [
  {
    nombre: 'admin',
    email: __ENV.ADMIN_EMAIL,
    password: __ENV.ADMIN_PASSWORD,
    rolEsperado: 'admin',
  },
  {
    nombre: 'cocina',
    email: __ENV.COCINA_EMAIL,
    password: __ENV.COCINA_PASSWORD,
    rolEsperado: 'cocina',
  },
  {
    nombre: 'caja',
    email: __ENV.CAJA_EMAIL,
    password: __ENV.CAJA_PASSWORD,
    rolEsperado: 'caja',
  },
];

function obtenerJson(respuesta) {
  try {
    return respuesta.json();
  } catch {
    return null;
  }
}

export function setup() {
  const sesiones = [];

  for (const cuenta of cuentas) {
    if (!cuenta.email || !cuenta.password) {
      throw new Error(
        `Faltan las variables de entorno para la cuenta ${cuenta.nombre}.`
      );
    }

    const respuesta = http.post(
      `${BASE_URL}/login`,
      JSON.stringify({
        email: cuenta.email,
        password: cuenta.password,
      }),
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        tags: {
          endpoint: 'login',
          rol: cuenta.nombre,
        },
      }
    );

    duracionLogin.add(respuesta.timings.duration);

    const cuerpo = obtenerJson(respuesta);
    const token = cuerpo?.token;
    const rol = cuerpo?.user?.rol || cuerpo?.user?.role;

    const loginCorrecto = check(respuesta, {
      [`Login ${cuenta.nombre}: estado HTTP 200`]: (r) =>
        r.status === 200,

      [`Login ${cuenta.nombre}: respuesta JSON válida`]: () =>
        cuerpo !== null,

      [`Login ${cuenta.nombre}: token recibido`]: () =>
        typeof token === 'string' && token.length > 0,

      [`Login ${cuenta.nombre}: rol correcto`]: () =>
        rol === cuenta.rolEsperado,
    });

    if (!loginCorrecto || !token) {
      throw new Error(
        `No se pudo iniciar sesión como ${cuenta.nombre}. ` +
        `Estado HTTP: ${respuesta.status}. ` +
        `Respuesta: ${respuesta.body.substring(0, 250)}`
      );
    }

    sesiones.push({
      nombre: cuenta.nombre,
      token,
    });
  }

  return sesiones;
}

export default function (sesiones) {
  const indice = (__VU - 1) % sesiones.length;
  const sesion = sesiones[indice];

  const parametros = {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${sesion.token}`,
    },
    tags: {
      rol: sesion.nombre,
    },
  };

  group(`Flujo protegido: ${sesion.nombre}`, function () {
    const respuestaPerfil = http.get(`${BASE_URL}/user`, {
      ...parametros,
      tags: {
        ...parametros.tags,
        endpoint: 'perfil',
      },
    });

    duracionPerfil.add(respuestaPerfil.timings.duration);

    const cuerpoPerfil = obtenerJson(respuestaPerfil);

    const perfilCorrecto = check(respuestaPerfil, {
      'Perfil: estado HTTP 200': (r) => r.status === 200,

      'Perfil: respuesta JSON válida': () =>
        cuerpoPerfil !== null,

      'Perfil: usuario presente': () =>
        Boolean(cuerpoPerfil?.id || cuerpoPerfil?.user?.id),
    });

    erroresApi.add(!perfilCorrecto);

    const respuestaPedidos = http.get(`${BASE_URL}/pedidos`, {
      ...parametros,
      tags: {
        ...parametros.tags,
        endpoint: 'pedidos',
      },
    });

    duracionPedidos.add(respuestaPedidos.timings.duration);

    const cuerpoPedidos = obtenerJson(respuestaPedidos);

    const pedidosCorrectos = check(respuestaPedidos, {
      'Pedidos: estado HTTP 200': (r) => r.status === 200,

      'Pedidos: respuesta JSON válida': () =>
        cuerpoPedidos !== null,

      'Pedidos: lista recibida': () =>
        Array.isArray(cuerpoPedidos) ||
        Array.isArray(cuerpoPedidos?.data),
    });

    erroresApi.add(!pedidosCorrectos);
  });

  sleep(1);
}