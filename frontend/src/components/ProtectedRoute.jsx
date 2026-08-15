import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({
  children,
  rolesPermitidos = [],
}) {
  const user = useAuthStore(
    (state) => state.user
  )

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR AUTENTICACIÓN
  |--------------------------------------------------------------------------
  */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | OBTENER EL ROL
  |--------------------------------------------------------------------------
  |
  | Permite recibir el rol de varias maneras:
  |
  | user.rol = "admin"
  | user.rol.nombre = "admin"
  | user.rol.name = "admin"
  | user.role = "admin"
  |
  */

  const rol =
    user?.rol?.nombre ??
    user?.rol?.name ??
    user?.rol ??
    user?.role ??
    ''

  const rolNormalizado = String(rol)
    .trim()
    .toLowerCase()

  /*
  |--------------------------------------------------------------------------
  | NORMALIZAR ROLES PERMITIDOS
  |--------------------------------------------------------------------------
  */

  const rolesNormalizados =
    rolesPermitidos.map((item) =>
      String(item)
        .trim()
        .toLowerCase()
    )

  /*
  |--------------------------------------------------------------------------
  | ADMINISTRADOR
  |--------------------------------------------------------------------------
  |
  | El administrador puede entrar a cualquier ruta protegida.
  |
  */

  const esAdministrador =
    rolNormalizado === 'admin' ||
    rolNormalizado === 'administrador'

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR PERMISO
  |--------------------------------------------------------------------------
  */

  const tienePermiso =
    rolesNormalizados.length === 0 ||
    esAdministrador ||
    rolesNormalizados.includes(
      rolNormalizado
    )

  /*
  |--------------------------------------------------------------------------
  | REDIRECCIONAR SI NO TIENE PERMISO
  |--------------------------------------------------------------------------
  */

  if (!tienePermiso) {
    const rutasPorRol = {
      cocina: '/cocina',
      caja: '/caja',
      cliente: '/',
    }

    return (
      <Navigate
        to={
          rutasPorRol[rolNormalizado] ||
          '/'
        }
        replace
      />
    )
  }

  return children
}