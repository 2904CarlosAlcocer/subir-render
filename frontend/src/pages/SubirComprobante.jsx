import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react'

const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
]

const TAMANO_MAXIMO = 10 * 1024 * 1024

function SubirComprobante() {
  const { codigo } = useParams()
  const inputRef = useRef(null)

  const [pedido, setPedido] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    const cargarPedido = async () => {
      try {
        const response = await api.get(`/pedidos/publico/${codigo}`)
        setPedido(response.data.pedido)
      } catch (err) {
        setMensaje({
          tipo: 'error',
          texto: 'No se encontró el pedido o el enlace no es válido.',
        })
      } finally {
        setCargando(false)
      }
    }

    cargarPedido()
  }, [codigo])

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const formatearPrecio = (monto) =>
    Number(monto || 0).toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

  const limpiarArchivo = () => {
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }

    setArchivo(null)
    setPreview(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const seleccionarArchivo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setMensaje({
        tipo: 'error',
        texto: 'Solo se permite JPG, PNG o PDF.',
      })
      limpiarArchivo()
      return
    }

    if (file.size > TAMANO_MAXIMO) {
      setMensaje({
        tipo: 'error',
        texto: 'El archivo no puede pesar más de 10 MB.',
      })
      limpiarArchivo()
      return
    }

    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }

    setArchivo(file)
    setMensaje(null)

    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  const enviarComprobante = async () => {
    if (!archivo) {
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona un comprobante.',
      })
      return
    }

    setEnviando(true)
    setMensaje(null)

    try {
      const formData = new FormData()
      formData.append('comprobante', archivo)

      await api.post(`/pedidos/${codigo}/comprobante`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setPedido((pedidoActual) => ({
        ...pedidoActual,
        comprobante_pago_url:
          pedidoActual?.comprobante_pago_url || 'comprobante-enviado',
      }))

      setMensaje({
        tipo: 'exito',
        texto: 'Comprobante enviado correctamente.',
      })

      limpiarArchivo()
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto:
          err.response?.data?.message ||
          'No se pudo enviar el comprobante.',
      })
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909] px-4 text-white">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF6500]" />
          Cargando pedido...
        </div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909] px-4 pt-24">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151311] p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />

          <h1 className="mt-4 text-xl font-black text-white">
            Pedido no encontrado
          </h1>

          <p className="mt-2 text-sm text-white/45">
            El enlace no es válido o el pedido ya no está disponible.
          </p>
        </div>
      </div>
    )
  }

  const comprobanteRecibido = Boolean(pedido.comprobante_pago_url)

  return (
    <div className="min-h-screen bg-[#090909] px-4 pb-10 pt-28">
      <main className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FF7A21]">
            Rooster Pizza
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Subir comprobante
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Adjunta el comprobante de tu pago SINPE.
          </p>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#151311] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="h-1 bg-gradient-to-r from-[#E4002B] via-[#FF6500] to-[#F5A300]" />

          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Pedido
                </p>

                <p className="mt-1 font-mono text-lg font-black text-white">
                  #{pedido.codigo_tracking}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-white/30">Total</p>

                <p className="mt-1 font-mono text-2xl font-black text-[#FF8A38]">
                  ₡{formatearPrecio(pedido.total)}
                </p>
              </div>
            </div>

            {comprobanteRecibido ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>

                <h2 className="mt-5 text-xl font-black text-white">
                  Comprobante recibido
                </h2>

                <p className="mt-2 text-sm text-white/45">
                  Tu comprobante fue enviado correctamente.
                </p>
              </div>
            ) : (
              <>
                {!archivo ? (
                  <label
                    htmlFor="comprobante"
                    className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.025] px-5 py-10 text-center transition hover:border-[#FF6500]/50 hover:bg-[#FF6500]/5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6500]/10 text-[#FF7A21]">
                      <UploadCloud className="h-7 w-7" />
                    </div>

                    <p className="mt-4 text-sm font-black text-white/85">
                      Seleccionar comprobante
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      JPG, PNG o PDF · máximo 10 MB
                    </p>
                  </label>
                ) : (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6500]/10 text-[#FF7A21]">
                        {archivo.type === 'application/pdf' ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white/80">
                          {archivo.name}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Archivo seleccionado
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={limpiarArchivo}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/35 transition hover:bg-red-400/10 hover:text-red-300"
                        aria-label="Eliminar archivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {preview && (
                      <div className="border-t border-white/[0.07] bg-black/20 p-3">
                        <img
                          src={preview}
                          alt="Vista previa del comprobante"
                          className="mx-auto max-h-64 w-full rounded-xl object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={inputRef}
                  id="comprobante"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={seleccionarArchivo}
                  className="hidden"
                />

                {mensaje && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      mensaje.tipo === 'exito'
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                        : 'border-red-400/20 bg-red-400/10 text-red-200'
                    }`}
                  >
                    {mensaje.texto}
                  </div>
                )}

                <button
                  type="button"
                  onClick={enviarComprobante}
                  disabled={enviando || !archivo}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E4002B] to-[#FF7200] py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-5 w-5" />
                      Enviar comprobante
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default SubirComprobante