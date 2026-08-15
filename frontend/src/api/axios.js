import axios from 'axios'

const TOKEN_KEY = 'rooster_token'
const USER_KEY = 'rooster_user'

/*
|--------------------------------------------------------------------------
| ELIMINAR SESIONES ANTIGUAS DE LOCALSTORAGE
|--------------------------------------------------------------------------
|
| El proyecto utiliza sessionStorage mediante authStore.
| Estas llaves antiguas podían provocar que Axios enviara
| un token diferente al usuario mostrado en pantalla.
|
*/

localStorage.removeItem(TOKEN_KEY)
localStorage.removeItem(USER_KEY)
localStorage.removeItem('token')
localStorage.removeItem('user')
localStorage.removeItem('auth_token')
localStorage.removeItem('auth_user')

/*
|--------------------------------------------------------------------------
| INSTANCIA DE AXIOS
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000/api',

  headers: {
    Accept: 'application/json',
  },
})

/*
|--------------------------------------------------------------------------
| AGREGAR EL TOKEN DE AUTENTICACIÓN
|--------------------------------------------------------------------------
|
| El usuario y el token se guardan en sessionStorage.
| Todas las solicitudes protegidas enviarán automáticamente
| el token mediante el encabezado Authorization.
|
*/

api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem(TOKEN_KEY)

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }

    return config
  },

  (error) => {
    return Promise.reject(error)
  }
)

/*
|--------------------------------------------------------------------------
| CONTROLAR TOKEN INVÁLIDO O VENCIDO
|--------------------------------------------------------------------------
|
| Un estado 401 significa que el token ya no es válido.
| Si el usuario está dentro de una ruta privada, se elimina
| la sesión y se le envía nuevamente al inicio de sesión.
|
| Un estado 403 no debe cerrar la sesión, porque significa
| que el usuario está autenticado, pero no tiene permiso.
|
*/

api.interceptors.response.use(
  (response) => {
    return response
  },

  (error) => {
    const estado =
      error.response?.status

    const rutaActual =
      window.location.pathname

    const rutasPrivadas = [
      '/admin',
      '/cocina',
      '/caja',
      '/perfil',
    ]

    const estaEnRutaPrivada =
      rutasPrivadas.some((ruta) => {
        return (
          rutaActual === ruta ||
          rutaActual.startsWith(
            `${ruta}/`
          )
        )
      })

    if (
      estado === 401 &&
      estaEnRutaPrivada
    ) {
      sessionStorage.removeItem(
        TOKEN_KEY
      )

      sessionStorage.removeItem(
        USER_KEY
      )

      window.location.replace(
        '/login'
      )
    }

    return Promise.reject(error)
  }
)

export default api