import Swal from 'sweetalert2'
import '../styles/sweetalert-rooster.css'

const TEXTO_PREDETERMINADO = {
  exito: 'La operación se completó correctamente.',
  error: 'Ocurrió un problema al procesar la solicitud.',
  info: 'Revisa la información indicada.',
  advertencia: 'Revisa esta acción antes de continuar.',
}

const normalizarTexto = (
  valor,
  textoAlternativo
) => {
  if (
    typeof valor === 'string' &&
    valor.trim() !== ''
  ) {
    return valor.trim()
  }

  return textoAlternativo
}

const clasesAviso = {
  container: 'rooster-swal-container',
  popup: 'rooster-alerta',
  title: 'rooster-alerta__title',
  htmlContainer: 'rooster-alerta__text',
  closeButton: 'rooster-alerta__close',
  timerProgressBar:
    'rooster-alerta__progress',
}

const clasesModal = {
  container: 'rooster-swal-container',
  popup: 'rooster-modal',
  title: 'rooster-modal__title',
  htmlContainer: 'rooster-modal__text',
  actions: 'rooster-modal__actions',

  confirmButton:
    'rooster-modal__button rooster-modal__button--confirm',

  cancelButton:
    'rooster-modal__button rooster-modal__button--cancel',

  closeButton: 'rooster-modal__close',
}

const animacionAviso = {
  showClass: {
    popup: 'rooster-alerta--entrar',
  },

  hideClass: {
    popup: 'rooster-alerta--salir',
  },
}

const animacionModal = {
  showClass: {
    popup: 'rooster-modal--entrar',
  },

  hideClass: {
    popup: 'rooster-modal--salir',
  },
}

/*
|--------------------------------------------------------------------------
| AVISO CENTRADO SIN ÍCONOS
|--------------------------------------------------------------------------
*/

const mostrarAviso = ({
  titulo,
  mensaje,
  duracion = 3200,
}) => {
  return Swal.fire({
    position: 'center',

    title: titulo,
    text: mensaje,

    timer: duracion,
    timerProgressBar: true,

    showConfirmButton: false,
    showCloseButton: true,

    backdrop: false,

    allowEscapeKey: true,
    allowOutsideClick: false,

    stopKeydownPropagation: false,
    heightAuto: false,

    customClass: clasesAviso,

    ...animacionAviso,
  })
}

/*
|--------------------------------------------------------------------------
| ÉXITO
|--------------------------------------------------------------------------
*/

export const alertaExito = (
  mensaje = TEXTO_PREDETERMINADO.exito,
  titulo = 'Listo'
) => {
  return mostrarAviso({
    titulo: normalizarTexto(
      titulo,
      'Listo'
    ),

    mensaje: normalizarTexto(
      mensaje,
      TEXTO_PREDETERMINADO.exito
    ),
  })
}

/*
|--------------------------------------------------------------------------
| ERROR
|--------------------------------------------------------------------------
*/

export const alertaError = (
  mensaje = TEXTO_PREDETERMINADO.error,
  titulo = 'No se pudo completar'
) => {
  return mostrarAviso({
    titulo: normalizarTexto(
      titulo,
      'No se pudo completar'
    ),

    mensaje: normalizarTexto(
      mensaje,
      TEXTO_PREDETERMINADO.error
    ),

    duracion: 4600,
  })
}

/*
|--------------------------------------------------------------------------
| INFORMACIÓN
|--------------------------------------------------------------------------
*/

export const alertaInfo = (
  mensaje = TEXTO_PREDETERMINADO.info,
  titulo = 'Información'
) => {
  return mostrarAviso({
    titulo: normalizarTexto(
      titulo,
      'Información'
    ),

    mensaje: normalizarTexto(
      mensaje,
      TEXTO_PREDETERMINADO.info
    ),

    duracion: 3600,
  })
}

/*
|--------------------------------------------------------------------------
| ADVERTENCIA
|--------------------------------------------------------------------------
*/

export const alertaAdvertencia = (
  mensaje = TEXTO_PREDETERMINADO.advertencia,
  titulo = 'Atención'
) => {
  return mostrarAviso({
    titulo: normalizarTexto(
      titulo,
      'Atención'
    ),

    mensaje: normalizarTexto(
      mensaje,
      TEXTO_PREDETERMINADO.advertencia
    ),

    duracion: 4200,
  })
}

/*
|--------------------------------------------------------------------------
| CONFIRMACIÓN SIN ÍCONOS
|--------------------------------------------------------------------------
*/

export const confirmarAccion = async ({
  titulo = '¿Deseas continuar?',

  mensaje =
    'Esta acción requiere confirmación.',

  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',

  peligro = false,
} = {}) => {
  const resultado = await Swal.fire({
    position: 'center',

    title: normalizarTexto(
      titulo,
      '¿Deseas continuar?'
    ),

    text: normalizarTexto(
      mensaje,
      'Esta acción requiere confirmación.'
    ),

    showCancelButton: true,
    showConfirmButton: true,

    reverseButtons: true,
    focusCancel: peligro,

    confirmButtonText: normalizarTexto(
      textoConfirmar,
      'Confirmar'
    ),

    cancelButtonText: normalizarTexto(
      textoCancelar,
      'Cancelar'
    ),

    buttonsStyling: false,
    backdrop: false,

    allowEscapeKey: true,
    allowOutsideClick: false,

    heightAuto: false,

    customClass: {
      ...clasesModal,

      confirmButton: peligro
        ? 'rooster-modal__button rooster-modal__button--danger'
        : clasesModal.confirmButton,
    },

    ...animacionModal,
  })

  return resultado.isConfirmed
}

/*
|--------------------------------------------------------------------------
| CONFIRMAR ELIMINACIÓN
|--------------------------------------------------------------------------
*/

export const confirmarEliminacion = ({
  titulo = '¿Eliminar este elemento?',

  mensaje =
    'Esta acción no se puede deshacer.',

  textoConfirmar = 'Sí, eliminar',
  textoCancelar = 'Cancelar',
} = {}) => {
  return confirmarAccion({
    titulo,
    mensaje,
    textoConfirmar,
    textoCancelar,
    peligro: true,
  })
}

/*
|--------------------------------------------------------------------------
| CARGANDO
|--------------------------------------------------------------------------
*/

export const mostrarCargando = (
  mensaje = 'Procesando solicitud...'
) => {
  return Swal.fire({
    position: 'center',

    title: 'Un momento',

    text: normalizarTexto(
      mensaje,
      'Procesando solicitud...'
    ),

    backdrop: false,

    allowEscapeKey: false,
    allowOutsideClick: false,

    showConfirmButton: false,
    heightAuto: false,

    customClass: clasesModal,

    ...animacionModal,

    didOpen: () => {
      Swal.showLoading()
    },
  })
}

/*
|--------------------------------------------------------------------------
| CERRAR ALERTA
|--------------------------------------------------------------------------
*/

export const cerrarAlerta = () => {
  Swal.close()
}

export default {
  alertaExito,
  alertaError,
  alertaInfo,
  alertaAdvertencia,
  confirmarAccion,
  confirmarEliminacion,
  mostrarCargando,
  cerrarAlerta,
}