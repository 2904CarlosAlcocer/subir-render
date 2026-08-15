import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import {
  lazy,
  Suspense,
} from 'react'

import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import NavbarPublico from './components/NavbarPublico'

/*
|--------------------------------------------------------------------------
| LOGIN, REGISTRO Y RECUPERACIÓN (ahora en lazy load)
|--------------------------------------------------------------------------
|
| Ninguna de estas páginas es la ruta inicial ("/"), así que no deberían
| cargarse en el bundle principal. Antes se importaban de forma directa
| y por eso terminaban en el chunk index-*.js incluso sin necesitarse
| en la primera visita.
|
*/

const Login = lazy(
  () => import('./components/Login')
)

const OlvidePassword = lazy(
  () => import('./pages/OlvidePassword')
)

const RestablecerPassword = lazy(
  () => import('./pages/RestablecerPassword')
)

/*
|--------------------------------------------------------------------------
| PÁGINAS PRIVADAS
|--------------------------------------------------------------------------
*/

const AdminDashboard = lazy(
  () => import('./pages/AdminDashboard')
)

const AdminProductos = lazy(
  () => import('./pages/AdminProductos')
)

const AdminMensajes = lazy(
  () => import('./pages/AdminMensajes')
)

const AdminHorario = lazy(
  () => import('./pages/AdminHorario')
)

const CocinaDashboard = lazy(
  () => import('./pages/CocinaDashboard')
)

const CajaDashboard = lazy(
  () => import('./pages/CajaDashboard')
)

const PerfilCliente = lazy(
  () => import('./pages/PerfilCliente')
)

/*
|--------------------------------------------------------------------------
| PÁGINAS PÚBLICAS
|--------------------------------------------------------------------------
*/

const Home = lazy(
  () => import('./pages/Home')
)

const Nosotros = lazy(
  () => import('./pages/Nosotros')
)

const Menu = lazy(
  () => import('./pages/Menu')
)

const Carrito = lazy(
  () => import('./pages/Carrito')
)

const Ubicacion = lazy(
  () => import('./pages/Ubicacion')
)

const Contacto = lazy(
  () => import('./pages/Contacto')
)

const EstadoPedido = lazy(
  () => import('./pages/EstadoPedido')
)

const SubirComprobante = lazy(
  () => import('./pages/SubirComprobante')
)

const Register = lazy(
  () => import('./pages/Register')
)

/*
|--------------------------------------------------------------------------
| PANTALLA DE CARGA
|--------------------------------------------------------------------------
*/

function Cargando() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#120C08]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#F5A300]" />

        <p className="text-white/60">
          Cargando...
        </p>
      </div>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| DISEÑO DE LAS PÁGINAS PÚBLICAS
|--------------------------------------------------------------------------
*/

function LayoutPublico({
  children,
}) {
  return (
    <div className="min-h-[100dvh] bg-[#120C08]">
      <NavbarPublico />

      <main className="m-0 p-0">
        {children}
      </main>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| APLICACIÓN
|--------------------------------------------------------------------------
*/

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={<Cargando />}>
        <Routes>
          {/*
          |--------------------------------------------------------------------------
          | LOGIN, REGISTRO Y RECUPERACIÓN
          |--------------------------------------------------------------------------
          */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/olvide-contrasena"
            element={
              <OlvidePassword />
            }
          />

          <Route
            path="/restablecer-password"
            element={
              <RestablecerPassword />
            }
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/*
          |--------------------------------------------------------------------------
          | PÁGINAS PÚBLICAS
          |--------------------------------------------------------------------------
          */}

          <Route
            path="/"
            element={
              <LayoutPublico>
                <Home />
              </LayoutPublico>
            }
          />

          <Route
            path="/nosotros"
            element={
              <LayoutPublico>
                <Nosotros />
              </LayoutPublico>
            }
          />

          <Route
            path="/menu"
            element={
              <LayoutPublico>
                <Menu />
              </LayoutPublico>
            }
          />

          <Route
            path="/ubicacion"
            element={
              <LayoutPublico>
                <Ubicacion />
              </LayoutPublico>
            }
          />

          <Route
            path="/contacto"
            element={
              <LayoutPublico>
                <Contacto />
              </LayoutPublico>
            }
          />

          <Route
            path="/carrito"
            element={
              <LayoutPublico>
                <Carrito />
              </LayoutPublico>
            }
          />

          <Route
            path="/estado-pedido"
            element={
              <LayoutPublico>
                <EstadoPedido />
              </LayoutPublico>
            }
          />

          <Route
            path="/subir-comprobante/:codigo"
            element={
              <LayoutPublico>
                <SubirComprobante />
              </LayoutPublico>
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | PERFIL DEL CLIENTE
          |--------------------------------------------------------------------------
          |
          | Solo los usuarios autenticados con rol cliente
          | pueden acceder a esta página.
          |
          */}

          <Route
            path="/perfil"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'cliente',
                ]}
              >
                <LayoutPublico>
                  <PerfilCliente />
                </LayoutPublico>
              </ProtectedRoute>
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | RUTAS DEL ADMINISTRADOR
          |--------------------------------------------------------------------------
          */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'admin',
                ]}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/productos"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'admin',
                ]}
              >
                <AdminProductos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/mensajes"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'admin',
                ]}
              >
                <AdminMensajes />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/horario"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'admin',
                ]}
              >
                <AdminHorario />
              </ProtectedRoute>
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | RUTA DE COCINA
          |--------------------------------------------------------------------------
          |
          | Cocina puede entrar a esta ruta.
          | El administrador también tiene acceso porque
          | ProtectedRoute permite automáticamente al rol admin.
          |
          */}

          <Route
            path="/cocina"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'cocina',
                ]}
              >
                <CocinaDashboard />
              </ProtectedRoute>
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | RUTA DE CAJA
          |--------------------------------------------------------------------------
          |
          | Caja puede entrar a esta ruta.
          | El administrador también tiene acceso porque
          | ProtectedRoute permite automáticamente al rol admin.
          |
          */}

          <Route
            path="/caja"
            element={
              <ProtectedRoute
                rolesPermitidos={[
                  'caja',
                ]}
              >
                <CajaDashboard />
              </ProtectedRoute>
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | RUTA NO ENCONTRADA
          |--------------------------------------------------------------------------
          */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App