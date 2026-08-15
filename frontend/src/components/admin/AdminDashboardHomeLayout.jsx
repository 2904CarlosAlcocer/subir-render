import { useState } from 'react'

import {
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pizza,
  ShoppingBag,
  Store,
  Users,
  Utensils,
  Clock3,
  X,
} from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import logoRooster from '../../assets/logodef.jpeg'

function AdminDashboardHomeLayout({
  children,
  onSelectView,
  activeView = 'dashboard',
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const logoutStore = useAuthStore(
    (state) => state.logout
  )

  const [menuMovilAbierto, setMenuMovilAbierto] =
    useState(false)

  const seleccionarVista = (vista) => {
    setMenuMovilAbierto(false)

    if (typeof onSelectView === 'function') {
      onSelectView(vista)
    }
  }

  const irAProductos = () => {
    setMenuMovilAbierto(false)
    navigate('/admin/productos')
  }

  const irAHorario = () => {
    setMenuMovilAbierto(false)
    navigate('/admin/horario')
  }

  const irAMensajes = () => {
    setMenuMovilAbierto(false)
    navigate('/admin/mensajes')
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      action: () =>
        seleccionarVista('dashboard'),
    },
    {
      id: 'ordenes',
      label: 'Órdenes',
      icon: ClipboardList,
      action: () =>
        seleccionarVista('ordenes'),
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
      route: '/admin/productos',
      action: irAProductos,
    },
    {
      id: 'ingredientes',
      label: 'Ingredientes',
      icon: Pizza,
      action: () =>
        seleccionarVista('ingredientes'),
    },
    {
      id: 'pasta',
      label: 'Pasta',
      icon: Utensils,
      action: () =>
        seleccionarVista('pasta'),
    },
    {
      id: 'acompanamientos',
      label: 'Acompañamientos',
      icon: ShoppingBag,
      action: () =>
        seleccionarVista('acompanamientos'),
    },
    {
      id: 'comprobantes',
      label: 'Comprobantes',
      icon: CreditCard,
      action: () =>
        seleccionarVista('comprobantes'),
    },
    {
      id: 'caja',
      label: 'Control de Caja',
      icon: Store,
      action: () =>
        seleccionarVista('caja'),
    },
    {
      id: 'personal',
      label: 'Personal',
      icon: Users,
      action: () =>
        seleccionarVista('personal'),
    },
    {
      id: 'horario',
      label: 'Horario',
      icon: Clock3,
      route: '/admin/horario',
      action: irAHorario,
    },
    {
      id: 'mensajes',
      label: 'Mensajes',
      icon: MessageSquare,
      route: '/admin/mensajes',
      action: irAMensajes,
    },
  ]

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.error(
        'Error cerrando sesión:',
        error
      )
    } finally {
      logoutStore()

      navigate('/login', {
        replace: true,
      })
    }
  }

  const renderMenuItems = () =>
    menuItems.map((item) => {
      const Icon = item.icon

      const activo =
        item.route
          ? location.pathname === item.route
          : activeView === item.id

      return (
        <button
          key={item.id}
          type="button"
          onClick={item.action}
          className={`
            group
            flex
            w-full
            items-center
            gap-3
            rounded-lg
            border
            px-3
            py-2.5
            text-left
            text-[11px]
            font-medium
            transition-all
            duration-200

            ${
              activo
                ? `
                  border-orange-400/10
                  bg-orange-500/[0.08]
                  text-white
                  shadow-[inset_3px_0_0_#f97316]
                `
                : `
                  border-transparent
                  text-white/45
                  hover:bg-white/[0.035]
                  hover:text-white/80
                `
            }
          `}
        >
          <Icon
            className={`
              h-4
              w-4
              shrink-0
              transition-colors

              ${
                activo
                  ? 'text-orange-400'
                  : 'text-white/35 group-hover:text-orange-300'
              }
            `}
            strokeWidth={1.6}
          />

          <span>
            {item.label}
          </span>
        </button>
      )
    })

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen">

        {/* =================================================== */}
        {/* SIDEBAR DESKTOP */}
        {/* =================================================== */}

        <aside
          className="
            fixed
            bottom-0
            left-0
            top-0
            z-40
            hidden
            w-[190px]
            flex-col
            border-r
            border-white/[0.06]
            bg-[#0b0b0b]
            lg:flex
          "
        >
          {/* LOGO */}

          <div
            className="
              flex
              h-[82px]
              items-center
              border-b
              border-white/[0.045]
              px-5
            "
          >
            <div className="flex items-center gap-3">
              <img
                src={logoRooster}
                alt="Rooster CR"
                className="
                  h-10
                  w-10
                  rounded-lg
                  object-cover
                "
              />

              <div>
                <p
                  className="
                    text-[11px]
                    font-bold
                    tracking-[0.12em]
                    text-white
                  "
                >
                  ROOSTER
                </p>

                <p
                  className="
                    text-[9px]
                    font-bold
                    tracking-[0.18em]
                    text-orange-400
                  "
                >
                  CR
                </p>
              </div>
            </div>
          </div>

          {/* NAVEGACIÓN */}

          <nav
            className="
              admin-home-scrollbar
              flex-1
              space-y-1
              overflow-y-auto
              px-3
              py-5
            "
          >
            {renderMenuItems()}
          </nav>

          {/* CERRAR SESIÓN */}

          <div
            className="
              border-t
              border-white/[0.05]
              px-3
              py-5
            "
          >
            <button
              type="button"
              onClick={handleLogout}
              className="
                group
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-[11px]
                font-medium
                text-white/35
                transition-all
                hover:bg-red-500/[0.06]
                hover:text-red-300
              "
            >
              <LogOut
                className="
                  h-4
                  w-4
                  text-white/30
                  transition
                  group-hover:text-red-300
                "
                strokeWidth={1.6}
              />

              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* =================================================== */}
        {/* BARRA SUPERIOR MÓVIL */}
        {/* =================================================== */}

        <header
          className="
            fixed
            left-0
            right-0
            top-0
            z-40
            flex
            h-[64px]
            items-center
            justify-between
            border-b
            border-white/[0.06]
            bg-[#0b0b0b]/95
            px-4
            backdrop-blur-xl
            lg:hidden
          "
        >
          <div className="flex items-center gap-2.5">
            <img
              src={logoRooster}
              alt="Rooster CR"
              className="
                h-9
                w-9
                rounded-lg
                object-cover
              "
            />

            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  tracking-[0.12em]
                  text-white
                "
              >
                ROOSTER
              </p>

              <p
                className="
                  text-[8px]
                  font-bold
                  tracking-[0.18em]
                  text-orange-400
                "
              >
                CR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setMenuMovilAbierto(true)
            }
            aria-label="Abrir menú administrativo"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-orange-400/15
              bg-orange-500/[0.08]
              text-orange-300
              transition
              hover:bg-orange-500/15
            "
          >
            <Menu size={19} />
          </button>
        </header>

        {/* =================================================== */}
        {/* OVERLAY MÓVIL */}
        {/* =================================================== */}

        {menuMovilAbierto && (
          <div
            className="
              fixed
              inset-0
              z-50
              lg:hidden
            "
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() =>
                setMenuMovilAbierto(false)
              }
              className="
                absolute
                inset-0
                h-full
                w-full
                bg-black/70
                backdrop-blur-sm
              "
            />

            <aside
              className="
                absolute
                bottom-0
                right-0
                top-0
                flex
                w-[82%]
                max-w-[310px]
                flex-col
                border-l
                border-white/[0.07]
                bg-[#0b0b0b]
                shadow-[-20px_0_60px_rgba(0,0,0,0.45)]
              "
            >
              {/* CABECERA MÓVIL */}

              <div
                className="
                  flex
                  h-[70px]
                  items-center
                  justify-between
                  border-b
                  border-white/[0.05]
                  px-4
                "
              >
                <div className="flex items-center gap-3">
                  <img
                    src={logoRooster}
                    alt="Rooster CR"
                    className="
                      h-9
                      w-9
                      rounded-lg
                      object-cover
                    "
                  />

                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        tracking-[0.12em]
                        text-white
                      "
                    >
                      ROOSTER
                    </p>

                    <p
                      className="
                        text-[8px]
                        font-bold
                        tracking-[0.18em]
                        text-orange-400
                      "
                    >
                      ADMIN
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMenuMovilAbierto(false)
                  }
                  aria-label="Cerrar menú"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-white/[0.07]
                    bg-white/[0.03]
                    text-white/50
                    transition
                    hover:bg-white/[0.06]
                    hover:text-white
                  "
                >
                  <X size={18} />
                </button>
              </div>

              {/* NAVEGACIÓN MÓVIL */}

              <nav
                className="
                  admin-home-scrollbar
                  flex-1
                  space-y-1
                  overflow-y-auto
                  px-3
                  py-4
                "
              >
                {renderMenuItems()}
              </nav>

              {/* LOGOUT MÓVIL */}

              <div
                className="
                  border-t
                  border-white/[0.05]
                  p-3
                "
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    group
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-[11px]
                    font-medium
                    text-white/40
                    transition
                    hover:bg-red-500/[0.06]
                    hover:text-red-300
                  "
                >
                  <LogOut
                    className="
                      h-4
                      w-4
                      text-white/30
                      transition
                      group-hover:text-red-300
                    "
                    strokeWidth={1.6}
                  />

                  Cerrar sesión
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* =================================================== */}
        {/* CONTENIDO */}
        {/* =================================================== */}

        <main
          className="
            min-w-0
            flex-1
            bg-[#080808]
            pt-[64px]
            lg:ml-[190px]
            lg:pt-0
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[1600px]
              px-3
              py-3
              sm:px-5
              sm:py-5
              xl:px-7
            "
          >
            {children}
          </div>
        </main>
      </div>

      <style>{`
        html {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color:
            rgba(245, 163, 0, 0.75)
            #0a0705;
        }

        html::-webkit-scrollbar {
          width: 8px;
        }

        html::-webkit-scrollbar-track {
          background: #0a0705;
        }

        html::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(245, 163, 0, 0.75),
            rgba(228, 0, 43, 0.65)
          );
          border: 2px solid #0a0705;
          border-radius: 999px;
        }

        html::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(245, 163, 0, 1),
            rgba(228, 0, 43, 0.9)
          );
        }

        .admin-home-scrollbar {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(245, 163, 0, 0.45)
            transparent;
        }

        .admin-home-scrollbar::-webkit-scrollbar {
          width: 5px;
        }

        .admin-home-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-home-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 163, 0, 0.45);
          border-radius: 999px;
        }

        .admin-home-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 163, 0, 0.75);
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminDashboardHomeLayout