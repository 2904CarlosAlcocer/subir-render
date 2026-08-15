import { ArrowLeft, Store, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function CajaLayout({
  children,
  titulo = 'Punto de caja',
  estadoCaja = null,
}) {
  const navigate = useNavigate()

  const usuario = JSON.parse(
    localStorage.getItem('user') || 'null'
  )

  const cerrarSesion = async () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      navigate('/login')
    } catch (error) {
      console.error('Error cerrando sesión:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0b09] text-white">
      {/* =====================================================
          HEADER EXCLUSIVO DEL PUNTO DE CAJA
      ====================================================== */}
      <header className="sticky top-0 z-[100] border-b border-white/[0.07] bg-[#0d0b09]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-[1920px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* IZQUIERDA */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-white/45 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              title="Volver al panel"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F5A300]/20 bg-[#F5A300]/10 text-[#F5A300]">
              <Store size={19} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-black text-white sm:text-base">
                  {titulo}
                </h1>

                {estadoCaja && (
                  <span
                    className={`hidden rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] sm:inline-flex ${
                      estadoCaja.abierta
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                        : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
                    }`}
                  >
                    {estadoCaja.abierta
                      ? 'Caja abierta'
                      : 'Caja cerrada'}
                  </span>
                )}
              </div>

              <p className="truncate text-[10px] text-white/25 sm:text-[11px]">
                Rooster Pizza · Sistema POS
              </p>
            </div>
          </div>

          {/* DERECHA */}
          <div className="flex shrink-0 items-center gap-2">
            {usuario && (
              <div className="hidden text-right md:block">
                <p className="max-w-[160px] truncate text-xs font-black text-white/65">
                  {usuario.name || usuario.nombre || 'Usuario'}
                </p>

                <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">
                  {usuario.rol || usuario.role || 'Caja'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={cerrarSesion}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-white/35 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300"
              title="Cerrar sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}
      <main className="mx-auto w-full max-w-[1920px] px-3 py-4 sm:px-5 lg:px-6">
        {children}
      </main>
    </div>
  )
}

export default CajaLayout