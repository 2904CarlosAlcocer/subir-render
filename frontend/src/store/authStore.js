import { create } from 'zustand'

const USER_KEY = 'rooster_user'
const TOKEN_KEY = 'rooster_token'

function obtenerUsuarioGuardado() {
  try {
    const usuario =
      sessionStorage.getItem(USER_KEY)

    return usuario
      ? JSON.parse(usuario)
      : null
  } catch (error) {
    console.error(
      'Error al leer el usuario guardado:',
      error
    )

    sessionStorage.removeItem(USER_KEY)

    return null
  }
}

const usuarioInicial =
  obtenerUsuarioGuardado()

const tokenInicial =
  sessionStorage.getItem(TOKEN_KEY)

const useAuthStore = create((set) => ({
  user: usuarioInicial,
  token: tokenInicial,

  isAuthenticated: Boolean(
    usuarioInicial && tokenInicial
  ),

  /*
  |--------------------------------------------------------------------------
  | INICIAR SESIÓN
  |--------------------------------------------------------------------------
  */

  login: (user, token) => {
    sessionStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    )

    sessionStorage.setItem(
      TOKEN_KEY,
      token
    )

    set({
      user,
      token,
      isAuthenticated: true,
    })
  },

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR USUARIO AUTENTICADO
  |--------------------------------------------------------------------------
  |
  | Se utilizará después de editar el perfil.
  | Mantiene el token actual y actualiza únicamente
  | la información del usuario.
  |
  */

  actualizarUsuario: (nuevosDatos) => {
    set((state) => {
      if (!state.user) {
        return state
      }

      const usuarioActualizado = {
        ...state.user,
        ...nuevosDatos,
      }

      sessionStorage.setItem(
        USER_KEY,
        JSON.stringify(usuarioActualizado)
      )

      return {
        user: usuarioActualizado,
      }
    })
  },

  /*
  |--------------------------------------------------------------------------
  | CERRAR SESIÓN
  |--------------------------------------------------------------------------
  */

  logout: () => {
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
}))

export default useAuthStore