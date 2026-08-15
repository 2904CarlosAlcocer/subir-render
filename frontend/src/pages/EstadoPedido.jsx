import { useEffect, useState, useRef } from 'react'
import api from '../api/axios'
import {
  Search,
  Clock,
  CheckCircle2,
  Flame,
  PackageCheck,
  ShoppingBag,
} from 'lucide-react'
import fondoPrincipal from '../assets/fondoPrincipal1.png'

const ESTADOS = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

const ORDEN_ESTADOS = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'listo',
  'entregado',
]

const ICONOS = {
  pendiente: Clock,
  confirmado: CheckCircle2,
  en_preparacion: Flame,
  listo: PackageCheck,
  entregado: ShoppingBag,
}

// Componente de partículas de fuego
function FireParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = []

    class Particle {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 100
        this.size = Math.random() * 4 + 1
        this.speedY = Math.random() * 2 + 0.8
        this.speedX = (Math.random() - 0.5) * 0.8
        this.life = 1
        this.decay = Math.random() * 0.008 + 0.004
        // Colores entre rojo, naranja y amarillo
        const colors = [
          [229, 0, 43],    // #E4002B rojo
          [245, 163, 0],   // #F5A300 naranja
          [255, 200, 50],  // amarillo
          [255, 100, 20],  // naranja oscuro
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.y -= this.speedY
        this.x += this.speedX + Math.sin(this.y * 0.04) * 0.4
        this.life -= this.decay
        this.size *= 0.995
      }

      draw() {
        const [r, g, b] = this.color
        ctx.save()
        ctx.globalAlpha = this.life * 0.55
        const grad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 3
        )
        grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Pre-poblar partículas
    for (let i = 0; i < 80; i++) {
      const p = new Particle()
      p.y = Math.random() * canvas.height
      p.life = Math.random()
      particles.push(p)
    }

    let animId
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Agregar nuevas partículas
      if (particles.length < 120) {
        particles.push(new Particle())
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update()
        particles[i].draw()
        if (particles[i].life <= 0 || particles[i].y < -20) {
          particles[i].reset()
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.35 }}
    />
  )
}

export default function EstadoPedido() {
  const [codigo, setCodigo] = useState('')
  const [codigoConsultado, setCodigoConsultado] = useState('')
  const [pedido, setPedido] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const consultarPedido = async (codigoBuscar = codigo) => {
    const codigoLimpio = codigoBuscar.trim().toUpperCase()

    if (!codigoLimpio) {
      setMensaje('Ingresa el código de seguimiento.')
      return
    }

    setCargando(true)
    setMensaje('')

    try {
      const response = await api.get(`/pedidos/tracking/${codigoLimpio}`)
      setPedido(response.data)
      setCodigoConsultado(codigoLimpio)
    } catch (err) {
      setPedido(null)
      setMensaje(
        err.response?.data?.message || 'No se pudo consultar el pedido.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (!codigoConsultado) return

    const intervalo = setInterval(() => {
      consultarPedido(codigoConsultado)
    }, 3000)

    return () => clearInterval(intervalo)
  }, [codigoConsultado])

  const indiceActual = pedido
    ? ORDEN_ESTADOS.indexOf(pedido.estado_pedido)
    : -1

  return (
    <div
      className="relative min-h-screen text-white px-4 py-28 overflow-hidden"
      style={{
        backgroundImage: `url(${fondoPrincipal})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#120C08',
      }}
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Partículas de fuego */}
      <FireParticles />

      {/* Contenido principal */}
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="bg-black/55 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4002B]/20 border border-[#E4002B]/40 rounded-full mb-4">
              <PackageCheck size={18} className="text-[#F5A300]" />
              <span className="text-[#F5A300] font-bold text-sm">
                Seguimiento de pedido
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black">
              Estado de tu pedido
            </h1>

            <p className="text-white/60 mt-3">
              Ingresa el código que recibiste al confirmar tu pedido.
            </p>
          </div>

          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') consultarPedido()
              }}
              placeholder="Ejemplo: RC-ABC123"
              className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#F5A300] font-mono"
            />

            <button
              onClick={() => consultarPedido()}
              disabled={cargando}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#F5A300] font-bold disabled:opacity-50"
            >
              <Search size={20} />
            </button>
          </div>

          {mensaje && (
            <div className="bg-[#FCEBEB] border border-[#F09595] text-[#A32D2D] rounded-xl px-4 py-3 text-sm mb-5 font-semibold">
              {mensaje}
            </div>
          )}

          {pedido && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <p className="text-[#F5A300] font-mono font-black text-xl">
                    #{pedido.codigo_tracking}
                  </p>

                  <p className="text-white/60 text-sm mt-1">
                    Cliente: {pedido.cliente?.nombre || 'Sin cliente'}
                  </p>
                </div>

                <div className="bg-[#F5A300]/10 border border-[#F5A300]/30 rounded-xl px-4 py-2 text-right">
                  <p className="text-white/40 text-xs uppercase font-bold">
                    Estado actual
                  </p>
                  <p className="text-[#F5A300] font-black">
                    {ESTADOS[pedido.estado_pedido] || pedido.estado_pedido}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-6">
                {ORDEN_ESTADOS.map((estado, index) => {
                  const Icon = ICONOS[estado]
                  const activo = index <= indiceActual

                  return (
                    <div
                      key={estado}
                      className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                        activo
                          ? 'border-[#F5A300] bg-[#F5A300]/15 text-[#F5A300]'
                          : 'border-white/10 bg-black/30 text-white/35'
                      }`}
                    >
                      <Icon size={18} className="mx-auto mb-1" />
                      <p className="text-[11px] font-bold">
                        {ESTADOS[estado]}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase text-white/40 font-bold mb-3">
                  Productos
                </p>

                <div className="space-y-2">
                  {pedido.detalles?.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-white/70">
                        {d.cantidad}x {d.producto?.nombre}
                      </span>

                      <span className="text-white/50 font-mono">
                        ₡{parseFloat(d.subtotal).toLocaleString('es-CR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 mt-4 pt-4 flex justify-between">
                <span className="text-white/60 font-semibold">Total</span>

                <span className="text-[#F5A300] font-black font-mono text-lg">
                  ₡{parseFloat(pedido.total).toLocaleString('es-CR')}
                </span>
              </div>

              <p className="text-white/30 text-xs mt-5 text-center">
                Esta información se actualiza automáticamente cada 3 segundos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}