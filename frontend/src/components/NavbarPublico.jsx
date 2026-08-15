import { useState } from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  ShoppingCart,
  Menu,
  X,
  Home,
  Users,
  Pizza,
  MapPin,
  Phone,
  PackageSearch,
  LogIn,
  UserPlus,
  User,
  LogOut,
} from 'lucide-react'

import useCarritoStore from '../store/carritoStore'
import useAuthStore from '../store/authStore'
import logoRooster64 from '../assets/logodef-64.webp'
import logoRooster128 from '../assets/logodef-128.webp'

const navItems = [
  {
    path: '/',
    label: 'Inicio',
    icon: Home,
  },
  {
    path: '/nosotros',
    label: 'Nosotros',
    icon: Users,
  },
  {
    path: '/menu',
    label: 'Menú',
    icon: Pizza,
  },
  {
    path: '/ubicacion',
    label: 'Ubicación',
    icon: MapPin,
  },
  {
    path: '/contacto',
    label: 'Contacto',
    icon: Phone,
  },
  {
    path: '/estado-pedido',
    label: 'Estado pedido',
    icon: PackageSearch,
  },
]

export default function NavbarPublico() {
  const navigate = useNavigate()

  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false)

  const cantidadItems = useCarritoStore(
    (state) =>
      state.obtenerCantidadItems()
  )

  const user = useAuthStore(
    (state) => state.user
  )

  const logout = useAuthStore(
    (state) => state.logout
  )

  const isAuthenticated =
    Boolean(user)

  const rolUsuario = String(
    user?.rol || ''
  )
    .trim()
    .toLowerCase()

  const esCliente =
    isAuthenticated &&
    rolUsuario === 'cliente'

  const nombreUsuario =
    user?.name ||
    user?.nombre ||
    'Usuario'

  const cerrarMenu = () => {
    setMenuAbierto(false)
  }

  const handleLogout = () => {
    cerrarMenu()
    logout()

    navigate('/', {
      replace: true,
    })
  }

  return (
    <nav
      className="
        fixed left-0 right-0 top-0
        z-[9999]
        border-b border-white/10
        bg-black/35
        shadow-lg shadow-black/30
        backdrop-blur-xl
      "
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* LOGO */}
        <Link
          to="/"
          onClick={cerrarMenu}
          className="group flex shrink-0 items-center gap-3"
        >
          <img
            src={logoRooster64}
            srcSet={`
              ${logoRooster64} 64w,
              ${logoRooster128} 128w
            `}
            sizes="44px"
            alt="Logo Rooster"
            width={44}
            height={44}
            decoding="async"
            className="
              h-11 w-11
              rounded-full
              border border-white/20
              object-cover
              transition-colors
              group-hover:border-[#F5A300]/50
            "
          />

          <span className="flex items-center text-xl font-black leading-none tracking-tight sm:text-2xl">
            <span className="text-white">
              ROOSTER
            </span>

            <span className="text-[#F5A300]">
              PIZZA
            </span>
          </span>
        </Link>

        {/* ENLACES DE ESCRITORIO */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icono = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className="
                  group relative
                  flex items-center gap-2
                  rounded-lg
                  px-3 py-2
                  text-white/90
                  transition-all duration-200
                  hover:text-[#F5A300]
                "
              >
                <Icono className="h-4 w-4" />

                <span className="text-sm font-medium">
                  {item.label}
                </span>

                <span
                  className="
                    absolute bottom-0 left-1/2
                    h-[2px] w-0
                    bg-[#F5A300]
                    transition-all duration-300
                    group-hover:left-0
                    group-hover:w-full
                  "
                />
              </Link>
            )
          })}
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-3">
          <Link
            to="/menu"
            className="
              hidden items-center gap-2
              rounded-lg
              bg-gradient-to-r
              from-[#E4002B]
              to-[#F5A300]
              px-4 py-2
              text-sm font-bold text-white
              transition-all duration-300
              hover:scale-105
              hover:shadow-lg
              hover:shadow-[#E4002B]/40
              xl:flex
            "
          >
            Ordenar ahora
          </Link>

          {/* CARRITO */}
          <Link
            to="/carrito"
            aria-label="Ver carrito"
            className="relative rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <ShoppingCart className="h-5 w-5 text-white/90 transition-colors hover:text-[#F5A300]" />

            {cantidadItems > 0 && (
              <span
                className="
                  absolute -right-1 -top-1
                  flex h-5 w-5
                  items-center justify-center
                  rounded-full
                  bg-[#E4002B]
                  text-[10px]
                  font-bold text-white
                  shadow-lg shadow-black/50
                "
              >
                {cantidadItems}
              </span>
            )}
          </Link>

          {/* AUTENTICACIÓN DE ESCRITORIO */}
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {esCliente ? (
                  <Link
                    to="/perfil"
                    className="
                      flex items-center gap-2
                      rounded-lg
                      border border-[#F5A300]/20
                      bg-[#F5A300]/10
                      px-3 py-2
                      text-sm font-semibold
                      text-[#F5A300]
                      transition-all
                      hover:border-[#F5A300]/40
                      hover:bg-[#F5A300]/20
                    "
                  >
                    <User className="h-4 w-4" />

                    <span className="max-w-28 truncate">
                      {nombreUsuario}
                    </span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-white/60">
                    <User className="h-4 w-4" />

                    <span className="max-w-28 truncate">
                      {nombreUsuario}
                    </span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex items-center gap-1
                    rounded-lg
                    px-3 py-1.5
                    text-sm text-white/60
                    transition-colors
                    hover:bg-white/10
                    hover:text-[#E4002B]
                  "
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="
                    flex items-center gap-1
                    rounded-lg
                    px-4 py-2
                    text-sm font-medium
                    text-white/80
                    transition-colors
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  className="
                    flex items-center gap-1
                    rounded-lg
                    bg-gradient-to-r
                    from-[#E80000]
                    to-[#FF6B00]
                    px-4 py-2
                    text-sm font-bold text-white
                    transition-all
                    hover:shadow-lg
                    hover:shadow-[#E80000]/40
                  "
                >
                  <UserPlus className="h-4 w-4" />
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* BOTÓN MÓVIL */}
          <button
            type="button"
            onClick={() =>
              setMenuAbierto(
                (estado) => !estado
              )
            }
            aria-label={
              menuAbierto
                ? 'Cerrar menú'
                : 'Abrir menú'
            }
            className="relative z-[10000] rounded-lg p-2 transition-colors hover:bg-white/10 lg:hidden"
          >
            {menuAbierto ? (
              <X className="h-7 w-7 text-white" />
            ) : (
              <Menu className="h-7 w-7 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* FONDO DEL MENÚ MÓVIL */}
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
          className="fixed inset-0 top-[68px] bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* MENÚ MÓVIL */}
      <div
        className={`
          fixed left-0 right-0 top-[68px]
          z-[9999]
          max-h-[calc(100dvh-68px)]
          space-y-2
          overflow-y-auto
          border-b border-t
          border-white/10
          bg-black/95
          p-4
          backdrop-blur-xl
          transition-all duration-300
          lg:hidden
          ${
            menuAbierto
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : '-translate-y-4 opacity-0 pointer-events-none'
          }
        `}
      >
        {navItems.map((item) => {
          const Icono = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={cerrarMenu}
              className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/10"
            >
              <Icono className="h-5 w-5 text-[#F5A300]" />

              <span className="font-medium text-white">
                {item.label}
              </span>
            </Link>
          )
        })}

        <Link
          to="/menu"
          onClick={cerrarMenu}
          className="
            mt-2 flex w-full
            items-center justify-center gap-2
            rounded-lg
            bg-gradient-to-r
            from-[#E4002B]
            to-[#F5A300]
            px-5 py-3
            text-sm font-bold text-white
          "
        >
          Ordenar ahora
        </Link>

        <Link
          to="/carrito"
          onClick={cerrarMenu}
          className="
            flex w-full
            items-center justify-center gap-2
            rounded-lg
            border border-white/10
            bg-white/5
            px-5 py-3
            text-white/90
            transition-colors
            hover:bg-white/10
          "
        >
          <ShoppingCart className="h-4 w-4" />

          <span>
            Ver carrito
          </span>

          {cantidadItems > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E4002B] text-xs font-bold text-white">
              {cantidadItems}
            </span>
          )}
        </Link>

        {/* AUTENTICACIÓN MÓVIL */}
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center px-4 py-2 text-sm text-white/60">
                <span className="flex min-w-0 items-center gap-2">
                  <User className="h-4 w-4 shrink-0" />

                  <span className="truncate">
                    {nombreUsuario}
                  </span>
                </span>
              </div>

              {esCliente && (
                <Link
                  to="/perfil"
                  onClick={cerrarMenu}
                  className="
                    flex w-full
                    items-center justify-center gap-2
                    rounded-lg
                    border border-[#F5A300]/30
                    bg-[#F5A300]/10
                    px-5 py-3
                    font-bold text-[#F5A300]
                    transition-colors
                    hover:bg-[#F5A300]/20
                  "
                >
                  <User className="h-4 w-4" />
                  Mi perfil
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex w-full
                  items-center justify-center gap-2
                  rounded-lg
                  border border-white/10
                  bg-white/5
                  px-5 py-3
                  text-white/90
                  transition-colors
                  hover:border-red-500/30
                  hover:bg-red-500/20
                  hover:text-red-200
                "
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={cerrarMenu}
                className="
                  flex w-full
                  items-center justify-center gap-2
                  rounded-lg
                  border border-white/10
                  bg-white/5
                  px-5 py-3
                  text-white/90
                  transition-colors
                  hover:bg-white/10
                "
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </Link>

              <Link
                to="/register"
                onClick={cerrarMenu}
                className="
                  flex w-full
                  items-center justify-center gap-2
                  rounded-lg
                  bg-gradient-to-r
                  from-[#E80000]
                  to-[#FF6B00]
                  px-5 py-3
                  text-sm font-bold text-white
                "
              >
                <UserPlus className="h-4 w-4" />
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}