import { useState, useEffect } from 'react'
import api from '../api/axios'
import DashboardLayout from '../components/DashboardLayout'
import { Plus, X, Pencil, ImageOff } from 'lucide-react'

const TIPOS_IMAGEN_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]

const TAMANO_MAXIMO_IMAGEN =
  4 * 1024 * 1024

function AdminProductos() {
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalCategoria, setModalCategoria] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [catNombre, setCatNombre] = useState('')
  const [catDescripcion, setCatDescripcion] = useState('')
  const [catError, setCatError] = useState('')
  const [catGuardando, setCatGuardando] = useState(false)

  const [modalProducto, setModalProducto] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [prodNombre, setProdNombre] = useState('')
  const [prodDescripcion, setProdDescripcion] = useState('')
  const [prodPrecio, setProdPrecio] = useState('')
  const [prodPrecioPersonal, setProdPrecioPersonal] = useState('')
  const [prodCategoriaId, setProdCategoriaId] = useState('')
  const [prodImagen, setProdImagen] = useState(null)
  const [prodPreview, setProdPreview] = useState(null)
  const [prodError, setProdError] = useState('')
  const [prodGuardando, setProdGuardando] = useState(false)

  const formatearColones = (monto) => {
    return Math.round(
      Number(monto || 0)
    ).toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const cargarDatos = async () => {
    setCargando(true)
    setError('')

    try {
      const [resCategorias, resProductos] = await Promise.all([
        api.get('/categorias'),
        api.get('/admin/productos'),
      ])

      setCategorias(resCategorias.data)
      setProductos(resProductos.data)
    } catch (err) {
      setError('No se pudo cargar el catálogo.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const esCategoriaPizzas = (categoriaId) => {
    const categoria = categorias.find(
      (item) => Number(item.id) === Number(categoriaId)
    )

    return String(categoria?.nombre || '')
      .trim()
      .toLowerCase() === 'pizzas'
  }

  const categoriaProductoEsPizza =
    esCategoriaPizzas(prodCategoriaId)

  const abrirModalCategoria = (categoria = null) => {
    setCategoriaEditando(categoria)
    setCatNombre(categoria?.nombre || '')
    setCatDescripcion(categoria?.descripcion || '')
    setCatError('')
    setModalCategoria(true)
  }

  const guardarCategoria = async (e) => {
    e.preventDefault()
    setCatError('')
    setCatGuardando(true)

    try {
      const payload = {
        nombre: catNombre,
        descripcion: catDescripcion || null,
      }

      if (categoriaEditando) {
        await api.put(`/categorias/${categoriaEditando.id}`, payload)
      } else {
        await api.post('/categorias', payload)
      }

      setModalCategoria(false)
      cargarDatos()
    } catch (err) {
      setCatError(
        err.response?.data?.errors?.nombre?.[0] ||
          'No se pudo guardar la categoría.'
      )
    } finally {
      setCatGuardando(false)
    }
  }

  const toggleCategoria = async (categoria) => {
    try {
      await api.patch(`/categorias/${categoria.id}/toggle-estado`)
      cargarDatos()
    } catch (err) {
      setError('No se pudo actualizar el estado de la categoría.')
    }
  }

  const abrirModalProducto = (producto = null) => {
    setProductoEditando(producto)
    setProdNombre(producto?.nombre || '')
    setProdDescripcion(producto?.descripcion || '')

    setProdPrecio(
      producto?.precio !== null &&
      producto?.precio !== undefined
        ? String(
            Math.round(
              Number(producto.precio)
            )
          )
        : ''
    )

    setProdPrecioPersonal(
      Number(producto?.precio_personal) > 0
        ? String(
            Math.round(
              Number(
                producto.precio_personal
              )
            )
          )
        : ''
    )

    const catId =
      producto?.categoria_id ||
      (
        categorias.length > 0
          ? categorias[0].id
          : ''
      )

    setProdCategoriaId(catId)
    setProdImagen(null)
    setProdPreview(producto?.imagen_url || null)
    setProdError('')
    setModalProducto(true)
  }

  const handleSeleccionImagen = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    setProdError('')

    if (
      !TIPOS_IMAGEN_PERMITIDOS.includes(
        file.type
      )
    ) {
      setProdImagen(null)
      setProdError(
        'La imagen debe ser JPG, JPEG, PNG, WEBP o AVIF.'
      )

      e.target.value = ''
      return
    }

    if (
      file.size >
      TAMANO_MAXIMO_IMAGEN
    ) {
      setProdImagen(null)
      setProdError(
        'La imagen no puede superar los 4 MB.'
      )

      e.target.value = ''
      return
    }

    if (
      typeof prodPreview === 'string' &&
      prodPreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        prodPreview
      )
    }

    setProdImagen(file)
    setProdPreview(
      URL.createObjectURL(file)
    )
  }

  const guardarProducto = async (e) => {
    e.preventDefault()
    setProdError('')
    setProdGuardando(true)

    const formData = new FormData()

    formData.append(
      'nombre',
      prodNombre
    )

    formData.append(
      'descripcion',
      prodDescripcion || ''
    )

    formData.append(
      'precio',
      String(prodPrecio)
    )

    formData.append(
      'precio_personal',
      categoriaProductoEsPizza &&
      prodPrecioPersonal !== ''
        ? String(prodPrecioPersonal)
        : ''
    )

    formData.append(
      'categoria_id',
      String(prodCategoriaId)
    )

    if (prodImagen) {
      formData.append(
        'imagen',
        prodImagen
      )
    }

    try {
      if (productoEditando) {
        await api.post(
          `/productos/${productoEditando.id}`,
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
          }
        )
      } else {
        await api.post(
          '/productos',
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
          }
        )
      }

      setModalProducto(false)
      cargarDatos()
    } catch (err) {
      console.log(
        err.response?.data
      )

      const errores =
        err.response?.data?.errors

      setProdError(
        errores
          ? Object.values(errores)[0][0]
          : 'No se pudo guardar el producto.'
      )
    } finally {
      setProdGuardando(false)
    }
  }

  const toggleProducto = async (producto) => {
    try {
      await api.patch(
        `/productos/${producto.id}/toggle-estado`
      )

      cargarDatos()
    } catch (err) {
      setError(
        'No se pudo actualizar el estado del producto.'
      )
    }
  }

  const productosPorCategoria =
    productos.reduce(
      (acc, producto) => {
        const categoriaNombre =
          producto.categoria?.nombre ||
          'Sin categoría'

        if (!acc[categoriaNombre]) {
          acc[categoriaNombre] = []
        }

        acc[categoriaNombre].push(
          producto
        )

        return acc
      },
      {}
    )

  return (
    <DashboardLayout
      titulo="Catálogo"
      dark
      acciones={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              abrirModalCategoria()
            }
            className="
              rounded-xl
              border border-white/15
              bg-white/10
              px-4 py-2.5
              text-sm font-bold
              text-white/80
              backdrop-blur-md
              transition-colors
              hover:border-[#F5A300]
              hover:text-[#F5A300]
            "
          >
            + Categoría
          </button>

          <button
            type="button"
            onClick={() =>
              abrirModalProducto()
            }
            disabled={
              categorias.length === 0
            }
            className="
              flex items-center gap-2
              rounded-xl
              bg-[#E4002B]
              px-4 py-2.5
              text-sm font-black
              text-white
              shadow-lg
              transition-colors
              hover:bg-[#F5A300]
              disabled:opacity-40
            "
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>
      }
    >
      {cargando ? (
        <p className="text-sm text-white/60">
          Cargando catálogo...
        </p>
      ) : error ? (
        <p className="text-sm text-[#F09595]">
          {error}
        </p>
      ) : (
        <div className="space-y-8">
          <div className="
            overflow-hidden
            rounded-2xl
            border border-white/10
            bg-white/10
            shadow-2xl
            backdrop-blur-md
          ">
            <div className="
              h-[4px]
              bg-gradient-to-r
              from-[#E4002B]
              via-[#F5A300]
              to-[#E4002B]
            " />

            <div className="
              border-b border-white/10
              bg-black/20
              px-5 py-3
            ">
              <h3 className="
                text-xs font-bold
                uppercase tracking-wide
                text-[#F5A300]
              ">
                Categorías
              </h3>
            </div>

            <div className="
              divide-y divide-white/10
            ">
              {categorias.length === 0 ? (
                <p className="
                  p-5
                  text-sm text-white/50
                ">
                  No hay categorías todavía.
                </p>
              ) : (
                categorias.map(
                  (categoria) => (
                    <div
                      key={categoria.id}
                      className="
                        flex items-center
                        justify-between
                        px-5 py-3
                        transition-colors
                        hover:bg-white/5
                      "
                    >
                      <div>
                        <p className="
                          text-sm font-bold
                          text-white
                        ">
                          {categoria.nombre}
                        </p>

                        {categoria.descripcion && (
                          <p className="
                            mt-0.5
                            text-xs
                            text-white/50
                          ">
                            {
                              categoria.descripcion
                            }
                          </p>
                        )}
                      </div>

                      <div className="
                        flex items-center gap-3
                      ">
                        <span
                          className={`
                            rounded-full
                            px-2.5 py-1
                            text-xs font-bold
                            uppercase
                            ${
                              categoria.estado ===
                              'activa'
                                ? `
                                  bg-[#EAF3DE]
                                  text-[#3B6D11]
                                `
                                : `
                                  bg-white/10
                                  text-white/50
                                `
                            }
                          `}
                        >
                          {categoria.estado}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            abrirModalCategoria(
                              categoria
                            )
                          }
                          aria-label={
                            `Editar categoría ${categoria.nombre}`
                          }
                          className="
                            text-white/60
                            transition-colors
                            hover:text-[#F5A300]
                          "
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleCategoria(
                              categoria
                            )
                          }
                          className="
                            text-sm font-bold
                            text-[#F5A300]
                            transition-colors
                            hover:text-[#E4002B]
                          "
                        >
                          {categoria.estado ===
                          'activa'
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {Object.entries(
            productosPorCategoria
          ).map(
            ([
              categoriaNombre,
              productosCategoria,
            ]) => (
              <div key={categoriaNombre}>
                <h3 className="
                  mb-3
                  text-xs font-black
                  uppercase tracking-wide
                  text-[#F5A300]
                ">
                  {categoriaNombre}
                </h3>

                <div className="
                  grid grid-cols-1
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                ">
                  {productosCategoria.map(
                    (producto) => (
                      <div
                        key={producto.id}
                        className="
                          overflow-hidden
                          rounded-2xl
                          border border-white/10
                          bg-white/10
                          shadow-2xl
                          backdrop-blur-md
                        "
                      >
                        <div className="
                          flex aspect-video
                          items-center
                          justify-center
                          overflow-hidden
                          bg-black/30
                        ">
                          {producto.imagen_url ? (
                            <img
                              src={
                                producto.imagen_url
                              }
                              alt={
                                producto.nombre
                              }
                              className="
                                h-full w-full
                                object-cover
                              "
                            />
                          ) : (
                            <ImageOff
                              size={28}
                              className="
                                text-white/30
                              "
                            />
                          )}
                        </div>

                        <div className="p-4">
                          <div className="
                            mb-1
                            flex items-start
                            justify-between
                            gap-2
                          ">
                            <p className="
                              text-sm font-bold
                              text-white
                            ">
                              {producto.nombre}
                            </p>

                            <span
                              className={`
                                shrink-0
                                rounded-full
                                px-2.5 py-1
                                text-xs font-bold
                                uppercase
                                ${
                                  producto.estado ===
                                  'disponible'
                                    ? `
                                      bg-[#EAF3DE]
                                      text-[#3B6D11]
                                    `
                                    : `
                                      bg-white/10
                                      text-white/50
                                    `
                                }
                              `}
                            >
                              {producto.estado}
                            </span>
                          </div>

                          {producto.descripcion && (
                            <p className="
                              mb-3
                              line-clamp-2
                              text-xs
                              text-white/60
                            ">
                              {
                                producto.descripcion
                              }
                            </p>
                          )}

                          {Number(
                            producto
                              .precio_personal
                          ) > 0 ? (
                            <div className="
                              mb-4
                              grid grid-cols-2
                              overflow-hidden
                              rounded-xl
                              border border-white/10
                              bg-black/25
                            ">
                              <div className="
                                border-r
                                border-white/10
                                p-3
                              ">
                                <span className="
                                  mb-1 block
                                  text-[9px]
                                  font-black
                                  uppercase
                                  tracking-[0.14em]
                                  text-white/40
                                ">
                                  Grande
                                </span>

                                <p className="
                                  whitespace-nowrap
                                  font-mono
                                  text-base
                                  font-black
                                  text-[#F5A300]
                                ">
                                  ₡
                                  {formatearColones(
                                    producto.precio
                                  )}
                                </p>
                              </div>

                              <div className="p-3">
                                <span className="
                                  mb-1 block
                                  text-[9px]
                                  font-black
                                  uppercase
                                  tracking-[0.14em]
                                  text-white/40
                                ">
                                  Personal
                                </span>

                                <p className="
                                  whitespace-nowrap
                                  font-mono
                                  text-base
                                  font-black
                                  text-[#F5A300]
                                ">
                                  ₡
                                  {formatearColones(
                                    producto
                                      .precio_personal
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="
                              mb-4
                              rounded-xl
                              border border-white/10
                              bg-black/25
                              p-3
                            ">
                              <span className="
                                mb-1 block
                                text-[9px]
                                font-black
                                uppercase
                                tracking-[0.14em]
                                text-white/40
                              ">
                                Precio
                              </span>

                              <p className="
                                whitespace-nowrap
                                font-mono
                                text-lg
                                font-black
                                text-[#F5A300]
                              ">
                                ₡
                                {formatearColones(
                                  producto.precio
                                )}
                              </p>
                            </div>
                          )}

                          <div className="
                            flex items-center gap-3
                          ">
                            <button
                              type="button"
                              onClick={() =>
                                abrirModalProducto(
                                  producto
                                )
                              }
                              className="
                                flex items-center
                                gap-1
                                text-sm font-bold
                                text-white
                                transition-colors
                                hover:text-[#F5A300]
                              "
                            >
                              <Pencil size={14} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleProducto(
                                  producto
                                )
                              }
                              className="
                                text-sm font-bold
                                text-[#F5A300]
                                transition-colors
                                hover:text-[#E4002B]
                              "
                            >
                              {producto.estado ===
                              'disponible'
                                ? 'Marcar agotado'
                                : 'Marcar disponible'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {modalCategoria && (
        <div className="
          fixed inset-0 z-50
          flex items-center
          justify-center
          bg-black/70
          px-4
          backdrop-blur-sm
        ">
          <div className="
            w-full max-w-sm
            overflow-hidden
            rounded-2xl
            border border-white/10
            bg-[#21150F]/95
            shadow-2xl
          ">
            <div className="
              h-[4px]
              bg-gradient-to-r
              from-[#E4002B]
              via-[#F5A300]
              to-[#E4002B]
            " />

            <div className="
              flex items-center
              justify-between
              border-b
              border-white/10
              px-6 py-4
            ">
              <h3 className="
                text-base font-black
                uppercase tracking-wide
                text-white
              ">
                {categoriaEditando
                  ? 'Editar categoría'
                  : 'Nueva categoría'}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setModalCategoria(false)
                }
                className="
                  text-white/60
                  transition-colors
                  hover:text-[#F5A300]
                "
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={guardarCategoria}
              className="
                space-y-4
                px-6 py-5
              "
            >
              <div>
                <label className="
                  mb-1.5 block
                  text-xs font-bold
                  uppercase tracking-wide
                  text-white/60
                ">
                  Nombre
                </label>

                <input
                  type="text"
                  value={catNombre}
                  onChange={(e) =>
                    setCatNombre(
                      e.target.value
                    )
                  }
                  required
                  className="
                    w-full rounded-lg
                    border border-white/15
                    bg-white/10
                    px-3.5 py-2.5
                    text-sm text-white
                    outline-none
                    transition
                    focus:border-[#F5A300]
                    focus:ring-2
                    focus:ring-[#F5A300]/20
                  "
                />
              </div>

              <div>
                <label className="
                  mb-1.5 block
                  text-xs font-bold
                  uppercase tracking-wide
                  text-white/60
                ">
                  Descripción
                </label>

                <input
                  type="text"
                  value={catDescripcion}
                  onChange={(e) =>
                    setCatDescripcion(
                      e.target.value
                    )
                  }
                  className="
                    w-full rounded-lg
                    border border-white/15
                    bg-white/10
                    px-3.5 py-2.5
                    text-sm text-white
                    outline-none
                    transition
                    focus:border-[#F5A300]
                    focus:ring-2
                    focus:ring-[#F5A300]/20
                  "
                />
              </div>

              {catError && (
                <div className="
                  rounded-lg
                  border border-[#F09595]
                  bg-[#FCEBEB]
                  px-4 py-2.5
                  text-sm font-medium
                  text-[#A32D2D]
                ">
                  {catError}
                </div>
              )}

              <button
                type="submit"
                disabled={catGuardando}
                className="
                  w-full rounded-xl
                  bg-[#E4002B]
                  py-3
                  text-sm font-black
                  uppercase
                  text-white
                  shadow-lg
                  transition-colors
                  hover:bg-[#F5A300]
                  disabled:opacity-50
                "
              >
                {catGuardando
                  ? 'Guardando...'
                  : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalProducto && (
        <div className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/80
          px-3 py-4
          backdrop-blur-md
          sm:px-5 sm:py-6
        ">
          <div className="
            flex
            max-h-[92vh]
            w-full max-w-5xl
            flex-col
            overflow-hidden
            rounded-[24px]
            border border-white/10
            bg-[#11100f]
            shadow-[0_35px_100px_rgba(0,0,0,0.65)]
          ">
            {/* HEADER */}
            <div className="
              shrink-0
              border-b border-white/[0.07]
              bg-[#151311]
              px-5 py-4
              sm:px-6
            ">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="
                      text-lg font-black
                      tracking-[-0.02em]
                      text-white
                      sm:text-xl
                    ">
                      {productoEditando
                        ? 'Editar producto'
                        : 'Nuevo producto'}
                    </h3>

                    {productoEditando && (
                      <span className={`
                        rounded-full
                        border
                        px-2.5 py-1
                        text-[9px] font-black
                        uppercase tracking-[0.12em]
                        ${
                          productoEditando.estado === 'disponible'
                            ? 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300'
                            : 'border-white/10 bg-white/5 text-white/35'
                        }
                      `}>
                        {productoEditando.estado}
                      </span>
                    )}
                  </div>

                  <p className="
                    mt-1
                    max-w-2xl
                    text-xs leading-5
                    text-white/30
                  ">
                    {productoEditando
                      ? 'Actualiza la información del producto que se muestra en el catálogo.'
                      : 'Completa la información para agregar un nuevo producto al catálogo.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalProducto(false)}
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-white/[0.07]
                    bg-white/[0.03]
                    text-white/35
                    transition
                    hover:border-white/15
                    hover:bg-white/[0.06]
                    hover:text-white
                  "
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form
              onSubmit={guardarProducto}
              className="
                flex min-h-0 flex-1 flex-col
              "
            >
              {/* CONTENIDO CON SCROLL INTERNO */}
              <div className="
                min-h-0 flex-1
                overflow-y-auto
                px-5 py-5
                custom-pos-scrollbar
                sm:px-6 sm:py-6
              ">
                <div className="
                  grid gap-6
                  lg:grid-cols-[320px_minmax(0,1fr)]
                  xl:grid-cols-[350px_minmax(0,1fr)]
                ">
                  {/* COLUMNA IZQUIERDA */}
                  <aside className="space-y-4">
                    <div className="
                      rounded-2xl
                      border border-white/[0.07]
                      bg-white/[0.025]
                      p-4
                    ">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="
                            text-[10px] font-black
                            uppercase tracking-[0.14em]
                            text-white/35
                          ">
                            Imagen del producto
                          </p>
                          <p className="mt-1 text-[10px] text-white/20">
                            JPG, PNG, WEBP o AVIF · Máx. 4 MB
                          </p>
                        </div>
                      </div>

                      <label className="
                        group relative
                        flex aspect-[4/3] w-full
                        cursor-pointer
                        items-center justify-center
                        overflow-hidden
                        rounded-2xl
                        border border-dashed border-white/10
                        bg-black/30
                        transition
                        hover:border-[#F5A300]/35
                        hover:bg-black/40
                      ">
                        {prodPreview ? (
                          <>
                            <img
                              src={prodPreview}
                              alt="Vista previa"
                              className="
                                h-full w-full
                                object-cover
                                transition duration-300
                                group-hover:scale-[1.02]
                              "
                            />

                            <div className="
                              absolute inset-0
                              flex items-end
                              bg-gradient-to-t
                              from-black/75
                              via-black/5
                              to-transparent
                              opacity-0
                              transition
                              group-hover:opacity-100
                            ">
                              <span className="
                                m-3
                                rounded-lg
                                border border-white/10
                                bg-black/60
                                px-3 py-2
                                text-[10px] font-bold
                                text-white/80
                                backdrop-blur-sm
                              ">
                                Cambiar imagen
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="px-5 text-center">
                            <div className="
                              mx-auto
                              flex h-12 w-12
                              items-center justify-center
                              rounded-2xl
                              bg-white/5
                              text-white/20
                            ">
                              <ImageOff size={22} />
                            </div>

                            <p className="
                              mt-3
                              text-xs font-bold
                              text-white/45
                            ">
                              Seleccionar imagen
                            </p>

                            <p className="
                              mt-1
                              text-[10px]
                              text-white/20
                            ">
                              Haz clic para explorar archivos
                            </p>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
                          onChange={handleSeleccionImagen}
                          className="hidden"
                        />
                      </label>

                      {prodImagen && (
                        <div className="
                          mt-3
                          rounded-xl
                          border border-emerald-400/10
                          bg-emerald-400/[0.06]
                          px-3 py-2
                        ">
                          <p className="
                            truncate
                            text-[10px] font-semibold
                            text-emerald-300/80
                          ">
                            Nueva imagen: {prodImagen.name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="
                      rounded-2xl
                      border border-white/[0.07]
                      bg-white/[0.025]
                      p-4
                    ">
                      <p className="
                        text-[10px] font-black
                        uppercase tracking-[0.14em]
                        text-white/35
                      ">
                        Resumen
                      </p>

                      <div className="mt-3 space-y-3">
                        <div className="
                          flex items-center justify-between
                          gap-3
                          border-b border-white/[0.05]
                          pb-3
                        ">
                          <span className="text-[11px] text-white/25">
                            Categoría
                          </span>
                          <span className="
                            max-w-[180px]
                            truncate
                            text-[11px] font-bold
                            text-white/65
                          ">
                            {
                              categorias.find(
                                (item) =>
                                  Number(item.id) ===
                                  Number(prodCategoriaId)
                              )?.nombre || 'Sin seleccionar'
                            }
                          </span>
                        </div>

                        <div className="
                          flex items-center justify-between
                          gap-3
                        ">
                          <span className="text-[11px] text-white/25">
                            Tipo de precio
                          </span>
                          <span className="
                            text-[11px] font-bold
                            text-[#F5A300]/80
                          ">
                            {categoriaProductoEsPizza
                              ? 'Grande + personal'
                              : 'Precio único'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* COLUMNA DERECHA */}
                  <div className="space-y-5">
                    <section className="
                      rounded-2xl
                      border border-white/[0.07]
                      bg-white/[0.025]
                      p-4
                      sm:p-5
                    ">
                      <div className="
                        mb-4
                        border-b border-white/[0.05]
                        pb-3
                      ">
                        <p className="
                          text-xs font-black
                          text-white/70
                        ">
                          Información general
                        </p>
                        <p className="
                          mt-1
                          text-[10px]
                          text-white/20
                        ">
                          Datos visibles para el cliente en el menú.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="
                            mb-1.5 block
                            text-[10px] font-black
                            uppercase tracking-[0.12em]
                            text-white/30
                          ">
                            Nombre
                          </label>

                          <input
                            type="text"
                            value={prodNombre}
                            onChange={(e) =>
                              setProdNombre(e.target.value)
                            }
                            required
                            placeholder="Nombre del producto"
                            className="
                              w-full rounded-xl
                              border border-white/[0.08]
                              bg-black/25
                              px-4 py-3
                              text-sm font-medium
                              text-white
                              outline-none
                              transition
                              placeholder:text-white/15
                              focus:border-[#F5A300]/40
                              focus:bg-black/35
                              focus:ring-2
                              focus:ring-[#F5A300]/10
                            "
                          />
                        </div>

                        <div>
                          <label className="
                            mb-1.5 block
                            text-[10px] font-black
                            uppercase tracking-[0.12em]
                            text-white/30
                          ">
                            Descripción
                          </label>

                          <textarea
                            value={prodDescripcion}
                            onChange={(e) =>
                              setProdDescripcion(e.target.value)
                            }
                            rows={4}
                            placeholder="Describe brevemente el producto..."
                            className="
                              w-full resize-none
                              rounded-xl
                              border border-white/[0.08]
                              bg-black/25
                              px-4 py-3
                              text-sm leading-6
                              text-white/80
                              outline-none
                              transition
                              placeholder:text-white/15
                              focus:border-[#F5A300]/40
                              focus:bg-black/35
                              focus:ring-2
                              focus:ring-[#F5A300]/10
                            "
                          />
                        </div>
                      </div>
                    </section>

                    <section className="
                      rounded-2xl
                      border border-white/[0.07]
                      bg-white/[0.025]
                      p-4
                      sm:p-5
                    ">
                      <div className="
                        mb-4
                        border-b border-white/[0.05]
                        pb-3
                      ">
                        <p className="
                          text-xs font-black
                          text-white/70
                        ">
                          Precio y clasificación
                        </p>
                        <p className="
                          mt-1
                          text-[10px]
                          text-white/20
                        ">
                          Configura el precio y la categoría del producto.
                        </p>
                      </div>

                      <div className="
                        grid gap-4
                        sm:grid-cols-2
                      ">
                        <div>
                          <label className="
                            mb-1.5 block
                            text-[10px] font-black
                            uppercase tracking-[0.12em]
                            text-white/30
                          ">
                            {categoriaProductoEsPizza
                              ? 'Precio grande'
                              : 'Precio'}
                          </label>

                          <div className="relative">
                            <span className="
                              absolute left-4 top-1/2
                              -translate-y-1/2
                              font-mono
                              text-sm font-black
                              text-[#F5A300]
                            ">
                              ₡
                            </span>

                            <input
                              type="text"
                              inputMode="numeric"
                              value={prodPrecio}
                              onChange={(e) => {
                                const valor =
                                  e.target.value.replace(
                                    /\D/g,
                                    ''
                                  )

                                setProdPrecio(valor)
                              }}
                              placeholder="0"
                              required
                              className="
                                w-full rounded-xl
                                border border-white/[0.08]
                                bg-black/25
                                py-3 pl-9 pr-4
                                font-mono text-sm font-bold
                                text-white
                                outline-none
                                transition
                                placeholder:text-white/15
                                focus:border-[#F5A300]/40
                                focus:bg-black/35
                                focus:ring-2
                                focus:ring-[#F5A300]/10
                              "
                            />
                          </div>
                        </div>

                        {categoriaProductoEsPizza && (
                          <div>
                            <label className="
                              mb-1.5 block
                              text-[10px] font-black
                              uppercase tracking-[0.12em]
                              text-white/30
                            ">
                              Precio personal
                            </label>

                            <div className="relative">
                              <span className="
                                absolute left-4 top-1/2
                                -translate-y-1/2
                                font-mono
                                text-sm font-black
                                text-[#F5A300]
                              ">
                                ₡
                              </span>

                              <input
                                type="text"
                                inputMode="numeric"
                                value={prodPrecioPersonal}
                                onChange={(e) => {
                                  const valor =
                                    e.target.value.replace(
                                      /\D/g,
                                      ''
                                    )

                                  setProdPrecioPersonal(valor)
                                }}
                                placeholder="0"
                                className="
                                  w-full rounded-xl
                                  border border-white/[0.08]
                                  bg-black/25
                                  py-3 pl-9 pr-4
                                  font-mono text-sm font-bold
                                  text-white
                                  outline-none
                                  transition
                                  placeholder:text-white/15
                                  focus:border-[#F5A300]/40
                                  focus:bg-black/35
                                  focus:ring-2
                                  focus:ring-[#F5A300]/10
                                "
                              />
                            </div>

                            <p className="
                              mt-1.5
                              text-[10px]
                              text-white/20
                            ">
                              Déjalo vacío si la pizza solo tiene un precio.
                            </p>
                          </div>
                        )}

                        <div className={
                          categoriaProductoEsPizza
                            ? 'sm:col-span-2'
                            : 'sm:col-span-2'
                        }>
                          <label className="
                            mb-1.5 block
                            text-[10px] font-black
                            uppercase tracking-[0.12em]
                            text-white/30
                          ">
                            Categoría
                          </label>

                          <select
                            value={prodCategoriaId}
                            onChange={(e) => {
                              const nuevaCategoriaId =
                                e.target.value

                              setProdCategoriaId(
                                nuevaCategoriaId
                              )

                              if (
                                !esCategoriaPizzas(
                                  nuevaCategoriaId
                                )
                              ) {
                                setProdPrecioPersonal('')
                              }
                            }}
                            required
                            className="
                              w-full rounded-xl
                              border border-white/[0.08]
                              bg-[#0d0c0b]
                              px-4 py-3
                              text-sm font-medium
                              text-white
                              outline-none
                              transition
                              [color-scheme:dark]
                              focus:border-[#F5A300]/40
                              focus:ring-2
                              focus:ring-[#F5A300]/10
                            "
                          >
                            {categorias.map(
                              (categoria) => (
                                <option
                                  key={categoria.id}
                                  value={categoria.id}
                                  className="
                                    bg-[#11100f]
                                    text-white
                                  "
                                >
                                  {categoria.nombre}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </section>

                    {prodError && (
                      <div className="
                        rounded-xl
                        border border-rose-400/20
                        bg-rose-500/[0.08]
                        px-4 py-3
                        text-sm font-semibold
                        text-rose-300
                      ">
                        {prodError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER FIJO */}
              <div className="
                shrink-0
                border-t border-white/[0.07]
                bg-[#151311]
                px-5 py-4
                sm:px-6
              ">
                <div className="
                  flex flex-col-reverse
                  gap-2
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                ">
                  <p className="
                    hidden
                    text-[10px]
                    text-white/20
                    sm:block
                  ">
                    Los cambios se reflejarán en el catálogo al guardar.
                  </p>

                  <div className="
                    flex flex-col-reverse
                    gap-2
                    sm:flex-row
                  ">
                    <button
                      type="button"
                      onClick={() => setModalProducto(false)}
                      disabled={prodGuardando}
                      className="
                        rounded-xl
                        border border-white/[0.08]
                        px-5 py-2.5
                        text-xs font-bold
                        text-white/35
                        transition
                        hover:border-white/15
                        hover:bg-white/[0.04]
                        hover:text-white/65
                        disabled:opacity-40
                      "
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={prodGuardando}
                      className="
                        inline-flex
                        min-w-[170px]
                        items-center justify-center
                        rounded-xl
                        bg-[#E4002B]
                        px-6 py-2.5
                        text-xs font-black
                        text-white
                        shadow-[0_10px_30px_rgba(228,0,43,0.18)]
                        transition
                        hover:bg-[#ff173e]
                        hover:shadow-[0_14px_34px_rgba(228,0,43,0.26)]
                        disabled:cursor-not-allowed
                        disabled:opacity-45
                      "
                    >
                      {prodGuardando
                        ? 'Guardando...'
                        : productoEditando
                          ? 'Guardar cambios'
                          : 'Crear producto'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}

export default AdminProductos