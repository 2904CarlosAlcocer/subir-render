import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import api from '../api/axios'

const ESTADO_INICIAL = {
  estado: 'cargando',
  titulo: 'Consultando horario',
  mensaje: 'Estamos verificando si podemos recibir tu pedido.',
  acepta_pedidos: false,
  abierta: false,
  local_abierto: false,
  pedidos_pausados: false,
  horario_extendido: false,
  ultimos_pedidos: false,
  hora_apertura: '12:00',
  hora_ultimo_pedido: '21:30',
  hora_cierre: '22:00',
  hora_apertura_humana: '12:00 p. m.',
  hora_ultimo_pedido_humana: '9:30 p. m.',
  hora_cierre_humana: '10:00 p. m.',
}

export default function useHorarioPedidos({
  intervalo = 30000,
} = {}) {
  const [estado, setEstado] = useState(
    ESTADO_INICIAL
  )
  const [cargando, setCargando] =
    useState(true)
  const [error, setError] = useState('')

  const recargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) {
        setCargando(true)
      }

      try {
        const response = await api.get(
          '/horario-pedidos/estado'
        )

        const nuevoEstado = {
          ...ESTADO_INICIAL,
          ...(response.data || {}),
          abierta: Boolean(
            response.data?.acepta_pedidos
          ),
        }

        setEstado(nuevoEstado)
        setError('')

        return nuevoEstado
      } catch (err) {
        console.error(
          'No se pudo consultar el horario de pedidos:',
          err
        )

        const estadoSeguro = {
          ...ESTADO_INICIAL,
          estado: 'sin_conexion',
          titulo: 'Horario no disponible',
          mensaje:
            'No pudimos verificar el horario. Intenta nuevamente en unos segundos.',
        }

        setEstado(estadoSeguro)
        setError(
          err.response?.data?.message ||
            'No se pudo verificar el horario.'
        )

        return estadoSeguro
      } finally {
        setCargando(false)
      }
    },
    []
  )

  useEffect(() => {
    recargar()

    const temporizador = window.setInterval(
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          recargar({ silencioso: true })
        }
      },
      intervalo
    )

    const actualizarAlVolver = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        recargar({ silencioso: true })
      }
    }

    window.addEventListener(
      'focus',
      actualizarAlVolver
    )
    document.addEventListener(
      'visibilitychange',
      actualizarAlVolver
    )

    return () => {
      window.clearInterval(temporizador)
      window.removeEventListener(
        'focus',
        actualizarAlVolver
      )
      document.removeEventListener(
        'visibilitychange',
        actualizarAlVolver
      )
    }
  }, [intervalo, recargar])

  return {
    estado,
    cargando,
    error,
    recargar,
  }
}
