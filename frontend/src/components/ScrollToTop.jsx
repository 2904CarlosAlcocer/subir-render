import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const posicionInicial = window.scrollY
    const duracion = 1000 // 1 segundo
    let animationFrameId

    const easeInOutCubic = (progreso) =>
      progreso < 0.5
        ? 4 * progreso * progreso * progreso
        : 1 - Math.pow(-2 * progreso + 2, 3) / 2

    const iniciarAnimacion = performance.now()

    const desplazar = (tiempoActual) => {
      const tiempoTranscurrido = tiempoActual - iniciarAnimacion
      const progreso = Math.min(tiempoTranscurrido / duracion, 1)
      const progresoSuavizado = easeInOutCubic(progreso)

      window.scrollTo({
        top: posicionInicial * (1 - progresoSuavizado),
        left: 0,
      })

      if (progreso < 1) {
        animationFrameId = requestAnimationFrame(desplazar)
      }
    }

    animationFrameId = requestAnimationFrame(desplazar)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [pathname])

  return null
}