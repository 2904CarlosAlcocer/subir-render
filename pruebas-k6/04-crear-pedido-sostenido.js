import flujoPedido, {
  setup as prepararDatos,
} from './03-crear-pedido-controlado.js';

export const options = {
  scenarios: {
    creacion_sostenida: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 10,
      maxDuration: '5m',
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