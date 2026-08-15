import flujoPedido, {
  setup as prepararDatos,
} from './03-crear-pedido-controlado.js';

export const options = {
  scenarios: {
    creacion_concurrente: {
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

export function setup() {
  return prepararDatos();
}

export default function (datos) {
  flujoPedido(datos);
}