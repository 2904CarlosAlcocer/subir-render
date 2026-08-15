import { useMemo } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  WalletCards,
} from 'lucide-react'

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

const STATUS_STYLES = {
  pendiente:
    'border-amber-400/15 bg-amber-400/10 text-amber-300',

  confirmado:
    'border-sky-400/15 bg-sky-400/10 text-sky-300',

  en_preparacion:
    'border-orange-400/15 bg-orange-400/10 text-orange-300',

  listo:
    'border-emerald-400/15 bg-emerald-400/10 text-emerald-300',

  entregado:
    'border-white/10 bg-white/5 text-white/45',
}

// ============================================================
// UTILIDADES
// ============================================================

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const isSameDay = (dateA, dateB) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate()

const obtenerFechaSegura = (fecha) => {
  if (!fecha) return null

  const date = new Date(fecha)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

// ============================================================
// TARJETA DE MÉTRICA
// ============================================================

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = 'orange',
  trend,
}) {
  const accents = {
    orange: {
      icon:
        'bg-orange-500/10 text-orange-300 ring-orange-400/15',

      glow:
        'bg-orange-500/10',
    },

    amber: {
      icon:
        'bg-amber-500/10 text-amber-300 ring-amber-400/15',

      glow:
        'bg-amber-500/10',
    },

    emerald: {
      icon:
        'bg-emerald-500/10 text-emerald-300 ring-emerald-400/15',

      glow:
        'bg-emerald-500/10',
    },

    violet: {
      icon:
        'bg-violet-500/10 text-violet-300 ring-violet-400/15',

      glow:
        'bg-violet-500/10',
    },
  }

  const style =
    accents[accent] ||
    accents.orange

  const trendPositive =
    trend?.type === 'positive'

  const trendNegative =
    trend?.type === 'negative'

  return (
    <article
      className="
        group
        relative
        min-h-[145px]
        overflow-hidden
        rounded-[18px]
        border
        border-white/[0.075]
        bg-[#171311]
        p-4
        shadow-[0_16px_45px_rgba(0,0,0,0.19)]
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-orange-400/20
        hover:bg-[#1b1613]
        hover:shadow-[0_22px_60px_rgba(0,0,0,0.28)]
      "
    >
      <div
        className={`
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-32
          w-32
          rounded-full
          blur-3xl
          ${style.glow}
        `}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">

          <div
            className={`
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              ring-1
              ring-inset
              ${style.icon}
            `}
          >
            <Icon
              className="h-[18px] w-[18px]"
              strokeWidth={1.8}
            />
          </div>

          {trend && (
            <span
              className={`
                inline-flex
                items-center
                gap-1
                rounded-full
                px-2
                py-1
                text-[9px]
                font-semibold
                ring-1
                ring-inset

                ${
                  trendPositive
                    ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/15'
                    : trendNegative
                      ? 'bg-rose-500/10 text-rose-300 ring-rose-400/15'
                      : 'bg-white/5 text-white/40 ring-white/10'
                }
              `}
            >
              {trendPositive && (
                <ArrowUpRight className="h-3 w-3" />
              )}

              {trendNegative && (
                <ArrowDownRight className="h-3 w-3" />
              )}

              {trend.label}
            </span>
          )}
        </div>

        <div className="mt-4">
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-white/30
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1.5
              truncate
              text-[25px]
              font-bold
              tracking-[-0.035em]
              text-white
            "
          >
            {value}
          </p>

          <p className="mt-1 text-[11px] text-white/28">
            {detail}
          </p>
        </div>
      </div>
    </article>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

function AdminHome({
  user,
  modules,
  orders = [],
  users = [],
  activeOrders = 0,
  pendingPayments = 0,
  paymentSummary = null,
  lastUpdated,
  onRefresh,
}) {
  const displayName =
    user?.name?.split(' ')[0] ||
    'Administrador'

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================

  const dashboardData = useMemo(() => {
    const now = new Date()

    const yesterday =
      new Date(now)

    yesterday.setDate(
      yesterday.getDate() - 1
    )

    const normalizedOrders =
      Array.isArray(orders)
        ? orders
        : []

    // ----------------------------------------------------------
    // PEDIDOS DE HOY
    // ----------------------------------------------------------

    const todayOrders =
      normalizedOrders.filter(
        (order) => {
          const fecha =
            obtenerFechaSegura(
              order?.created_at
            )

          if (!fecha) return false

          return isSameDay(
            fecha,
            now
          )
        }
      )

    // ----------------------------------------------------------
    // PEDIDOS DE AYER
    // ----------------------------------------------------------

    const yesterdayOrders =
      normalizedOrders.filter(
        (order) => {
          const fecha =
            obtenerFechaSegura(
              order?.created_at
            )

          if (!fecha) return false

          return isSameDay(
            fecha,
            yesterday
          )
        }
      )

    // ----------------------------------------------------------
    // INGRESOS
    // ----------------------------------------------------------

    const todayRevenue =
      todayOrders.reduce(
        (total, order) =>
          total +
          (Number(order.total) || 0),
        0
      )

    const yesterdayRevenue =
      yesterdayOrders.reduce(
        (total, order) =>
          total +
          (Number(order.total) || 0),
        0
      )

    const totalRevenue =
      normalizedOrders.reduce(
        (total, order) =>
          total +
          (Number(order.total) || 0),
        0
      )

    // ----------------------------------------------------------
    // CAMBIO CONTRA AYER
    // ----------------------------------------------------------

    let revenueChange = 0

    if (yesterdayRevenue > 0) {
      revenueChange =
        (
          (
            todayRevenue -
            yesterdayRevenue
          ) /
          yesterdayRevenue
        ) *
        100
    } else if (todayRevenue > 0) {
      revenueChange = 100
    }

    // ----------------------------------------------------------
    // TICKET PROMEDIO
    // ----------------------------------------------------------

    const averageTicket =
      todayOrders.length > 0
        ? todayRevenue /
          todayOrders.length
        : 0

    // ----------------------------------------------------------
    // PEDIDO MÁS ALTO
    // ----------------------------------------------------------

    const highestOrder =
      todayOrders.reduce(
        (highest, order) => {
          const total =
            Number(order.total) || 0

          return total > highest
            ? total
            : highest
        },
        0
      )

    // ----------------------------------------------------------
    // PEDIDOS COMPLETADOS HOY
    // ----------------------------------------------------------

    const completedToday =
      todayOrders.filter(
        (order) =>
          order.estado_pedido ===
          'entregado'
      ).length

    // ----------------------------------------------------------
    // PEDIDOS PENDIENTES
    // ----------------------------------------------------------

    const pendingOrders =
      normalizedOrders.filter(
        (order) =>
          order.estado_pedido ===
          'pendiente'
      ).length

    // ----------------------------------------------------------
    // EN PREPARACIÓN
    // ----------------------------------------------------------

    const preparingOrders =
      normalizedOrders.filter(
        (order) =>
          order.estado_pedido ===
          'en_preparacion'
      ).length

    // ----------------------------------------------------------
    // LISTOS
    // ----------------------------------------------------------

    const readyOrders =
      normalizedOrders.filter(
        (order) =>
          order.estado_pedido ===
          'listo'
      ).length

    // ----------------------------------------------------------
    // GRÁFICO 7 DÍAS
    // ----------------------------------------------------------

    const chart =
      Array.from(
        { length: 7 },
        (_, index) => {
          const date =
            new Date(now)

          date.setHours(
            0,
            0,
            0,
            0
          )

          date.setDate(
            now.getDate() -
              (6 - index)
          )

          const ordersForDay =
            normalizedOrders.filter(
              (order) => {
                const orderDate =
                  obtenerFechaSegura(
                    order?.created_at
                  )

                if (!orderDate) {
                  return false
                }

                return isSameDay(
                  orderDate,
                  date
                )
              }
            )

          const value =
            ordersForDay.reduce(
              (total, order) =>
                total +
                (
                  Number(
                    order.total
                  ) || 0
                ),
              0
            )

          return {
            key:
              date.toISOString(),

            label:
              date
                .toLocaleDateString(
                  'es-CR',
                  {
                    weekday:
                      'short',
                  }
                )
                .replace('.', '')
                .toUpperCase(),

            dateLabel:
              date.toLocaleDateString(
                'es-CR',
                {
                  day: '2-digit',
                  month: 'short',
                }
              ),

            value,

            orders:
              ordersForDay.length,
          }
        }
      )

    const chartMax =
      Math.max(
        ...chart.map(
          (item) =>
            item.value
        ),
        1
      )

    const weekRevenue =
      chart.reduce(
        (total, item) =>
          total + item.value,
        0
      )

    // ----------------------------------------------------------
    // PEDIDOS RECIENTES
    // ----------------------------------------------------------

    const recentOrders =
      [...normalizedOrders]
        .sort(
          (a, b) => {
            const dateA =
              obtenerFechaSegura(
                a.created_at
              )

            const dateB =
              obtenerFechaSegura(
                b.created_at
              )

            return (
              (dateB?.getTime() || 0) -
              (dateA?.getTime() || 0)
            )
          }
        )
        .slice(0, 6)

    return {
      todayOrders,
      yesterdayOrders,
      todayRevenue,
      yesterdayRevenue,
      totalRevenue,
      revenueChange,
      averageTicket,
      highestOrder,
      completedToday,
      pendingOrders,
      preparingOrders,
      readyOrders,
      chart,
      chartMax,
      weekRevenue,
      recentOrders,
    }
  }, [orders])


  // ============================================================
  // VENTAS DE HOY POR MÉTODO DE PAGO
  // ============================================================

  const paymentData = useMemo(() => {
    /*
     * Fuente principal: resumen_hoy enviado por CajaController.
     * Como respaldo, calcula los montos desde los pedidos ya pagados.
     */
    if (paymentSummary && typeof paymentSummary === 'object') {
      const efectivo = Number(paymentSummary.efectivo) || 0
      const sinpe = Number(paymentSummary.sinpe) || 0
      const tarjeta = Number(paymentSummary.tarjeta) || 0

      return {
        efectivo,
        sinpe,
        tarjeta,
        total_ventas:
          Number(paymentSummary.total_ventas) ||
          efectivo + sinpe + tarjeta,
        cantidad_pedidos:
          Number(paymentSummary.cantidad_pedidos) || 0,
      }
    }

    const ahora = new Date()

    const resumen = {
      efectivo: 0,
      sinpe: 0,
      tarjeta: 0,
      total_ventas: 0,
      cantidad_pedidos: 0,
    }

    const pedidosNormalizados =
      Array.isArray(orders)
        ? orders
        : []

    pedidosNormalizados.forEach((order) => {
      const pago = order?.pago

      if (!pago || pago.estado_pago !== 'pagado') {
        return
      }

      const fechaPago =
        obtenerFechaSegura(
          pago.fecha_pago ||
          order.updated_at ||
          order.created_at
        )

      if (!fechaPago || !isSameDay(fechaPago, ahora)) {
        return
      }

      const metodo = pago.metodo_pago

      if (!['efectivo', 'sinpe', 'tarjeta'].includes(metodo)) {
        return
      }

      const monto = Number(order.total) || 0

      resumen[metodo] += monto
      resumen.total_ventas += monto
      resumen.cantidad_pedidos += 1
    })

    return resumen
  }, [paymentSummary, orders])

  // ============================================================
  // PERSONAL
  // ============================================================

  const activeUsers =
    Array.isArray(users)
      ? users.filter(
        (currentUser) =>
          currentUser.estado ===
          'activo'
      ).length
      : 0

  const cambioIngresos =
    dashboardData.revenueChange

  const trendIngresos =
    cambioIngresos > 0
      ? {
        type: 'positive',
        label:
          `+${cambioIngresos.toFixed(0)}%`,
      }
      : cambioIngresos < 0
        ? {
          type: 'negative',
          label:
            `${cambioIngresos.toFixed(0)}%`,
        }
        : {
          type: 'neutral',
          label: 'Sin cambio',
        }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="relative space-y-5 pb-6">

      {/* BRILLOS DE FONDO */}

      <div
        className="
          pointer-events-none
          absolute
          -left-20
          top-10
          h-72
          w-72
          rounded-full
          bg-orange-600/[0.055]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-80
          h-64
          w-64
          rounded-full
          bg-amber-500/[0.035]
          blur-3xl
        "
      />

      {/* ====================================================== */}
      {/* HERO / BIENVENIDA */}
      {/* ====================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-[20px]
          border
          border-white/[0.075]
          bg-[#15110f]
          px-5
          py-5
          shadow-[0_20px_60px_rgba(0,0,0,0.24)]
          sm:px-6
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-30
            [background-image:linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)]
            [background-size:32px_32px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-72
            w-72
            rounded-full
            bg-orange-600/20
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-0
            top-0
            h-full
            w-[35%]
            bg-gradient-to-l
            from-orange-600/[0.10]
            to-transparent
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          <div className="max-w-2xl">

            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-orange-400/15
                bg-orange-500/10
                px-2.5
                py-1
                text-[10px]
                font-semibold
                text-orange-300
              "
            >
              <Sparkles className="h-3 w-3" />

              Centro de administración
            </div>

            <p className="text-xs font-medium text-white/35">
              Bienvenido de nuevo, {displayName}
            </p>

            <h1
              className="
                mt-1.5
                text-2xl
                font-bold
                tracking-[-0.04em]
                text-white
                sm:text-[30px]
              "
            >
              ¿Qué deseas administrar hoy?
            </h1>

            <p
              className="
                mt-2
                max-w-xl
                text-xs
                leading-5
                text-white/35
                sm:text-sm
              "
            >
              Gestiona las operaciones, el menú y el personal
              de Rooster CR desde un solo lugar.
            </p>
          </div>

          <div
            className="
              flex
              flex-col
              items-start
              gap-2.5
              sm:flex-row
              sm:items-center
              xl:flex-col
              xl:items-end
            "
          >

            <div className="flex flex-wrap gap-2">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-white/[0.07]
                  bg-black/15
                  px-3
                  py-2
                  text-[10px]
                  text-white/40
                "
              >
                <Activity
                  className="
                    h-3.5
                    w-3.5
                    text-orange-300
                  "
                />

                <strong className="text-white/80">
                  {activeOrders}
                </strong>

                órdenes activas
              </div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-white/[0.07]
                  bg-black/15
                  px-3
                  py-2
                  text-[10px]
                  text-white/40
                "
              >
                <CreditCard
                  className="
                    h-3.5
                    w-3.5
                    text-orange-300
                  "
                />

                <strong className="text-white/80">
                  {pendingPayments}
                </strong>

                pagos por revisar
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="
                inline-flex
                h-9
                items-center
                gap-2
                rounded-lg
                border
                border-orange-400/20
                bg-orange-500/[0.08]
                px-3
                text-[10px]
                font-semibold
                text-orange-200
                transition
                hover:border-orange-400/35
                hover:bg-orange-500/15
              "
            >
              <RefreshCw className="h-3.5 w-3.5" />

              Actualizar información
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* MÉTRICAS PRINCIPALES */}
      {/* ====================================================== */}

      <section
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <MetricCard
          label="Ingresos de hoy"
          value={
            formatCurrency(
              dashboardData.todayRevenue
            )
          }
          detail={
            `Ayer: ${formatCurrency(
              dashboardData.yesterdayRevenue
            )}`
          }
          icon={DollarSign}
          accent="orange"
          trend={trendIngresos}
        />

        <MetricCard
          label="Pedidos de hoy"
          value={
            dashboardData.todayOrders.length
          }
          detail={
            `${dashboardData.completedToday} completados hoy`
          }
          icon={ShoppingBag}
          accent="amber"
          trend={{
            type: 'neutral',
            label: 'Hoy',
          }}
        />

        <MetricCard
          label="Ticket promedio"
          value={
            formatCurrency(
              dashboardData.averageTicket
            )
          }
          detail="Promedio por pedido de hoy"
          icon={WalletCards}
          accent="emerald"
        />

        <MetricCard
          label="Pedido más alto"
          value={
            formatCurrency(
              dashboardData.highestOrder
            )
          }
          detail="Mayor venta registrada hoy"
          icon={Trophy}
          accent="violet"
        />
      </section>


      {/* ====================================================== */}
      {/* VENTAS DE HOY POR MÉTODO DE PAGO */}
      {/* ====================================================== */}

      <section className="rounded-[20px] border border-white/[0.075] bg-[#15110f] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-300/55">
              Cobros confirmados
            </p>
            <h2 className="mt-1 text-base font-semibold text-white/90">
              Ventas de hoy por método de pago
            </h2>
            <p className="mt-1 text-[11px] text-white/25">
              Solo se contabilizan pedidos con pago confirmado.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20">
              Total cobrado hoy
            </p>
            <p className="mt-0.5 text-lg font-bold text-orange-200">
              {formatCurrency(paymentData.total_ventas)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.045] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/15">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300/45">
                Hoy
              </span>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
              Efectivo
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-white">
              {formatCurrency(paymentData.efectivo)}
            </p>
            <p className="mt-1 text-[10px] text-white/25">
              Cobros recibidos en caja
            </p>
          </article>

          <article className="rounded-2xl border border-sky-400/10 bg-sky-500/[0.045] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-400/15">
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-300/45">
                Hoy
              </span>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
              SINPE Móvil
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-white">
              {formatCurrency(paymentData.sinpe)}
            </p>
            <p className="mt-1 text-[10px] text-white/25">
              Transferencias confirmadas
            </p>
          </article>

          <article className="rounded-2xl border border-violet-400/10 bg-violet-500/[0.045] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-400/15">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-violet-300/45">
                Hoy
              </span>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
              Datáfono
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-white">
              {formatCurrency(paymentData.tarjeta)}
            </p>
            <p className="mt-1 text-[10px] text-white/25">
              Pagos con tarjeta
            </p>
          </article>

          <article className="rounded-2xl border border-orange-400/10 bg-orange-500/[0.045] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-400/15">
                <WalletCards className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-orange-300/45">
                {paymentData.cantidad_pedidos} pagos
              </span>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
              Total cobrado
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-white">
              {formatCurrency(paymentData.total_ventas)}
            </p>
            <p className="mt-1 text-[10px] text-white/25">
              Suma de los tres métodos
            </p>
          </article>
        </div>
      </section>

      {/* ====================================================== */}
      {/* GRÁFICA + ESTADO OPERACIONAL */}
      {/* ====================================================== */}

      <section
        className="
          grid
          grid-cols-1
          gap-4
          xl:grid-cols-[minmax(0,1.75fr)_minmax(285px,0.75fr)]
        "
      >

        {/* GRÁFICA */}

        <article
          className="
            overflow-hidden
            rounded-[20px]
            border
            border-white/[0.075]
            bg-[#171311]
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.20)]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-orange-300/55
                "
              >
                Rendimiento
              </p>

              <h2
                className="
                  mt-1
                  text-base
                  font-semibold
                  text-white/90
                "
              >
                Ingresos de los últimos 7 días
              </h2>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-white/25
                "
              >
                Ventas registradas en Rooster CR.
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-white/[0.06]
                bg-black/15
                px-3
                py-2
                text-right
              "
            >
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white/20
                "
              >
                Últimos 7 días
              </p>

              <p
                className="
                  mt-0.5
                  text-sm
                  font-bold
                  text-orange-200
                "
              >
                {formatCurrency(
                  dashboardData.weekRevenue
                )}
              </p>
            </div>
          </div>

          <div className="relative mt-6 h-[225px]">

            {/* LÍNEAS */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                flex
                flex-col
                justify-between
                pb-7
              "
            >
              {[100, 75, 50, 25, 0].map(
                (line) => (
                  <div
                    key={line}
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <span
                      className="
                        w-7
                        text-right
                        text-[8px]
                        text-white/15
                      "
                    >
                      {line}%
                    </span>

                    <div
                      className="
                        h-px
                        flex-1
                        bg-white/[0.045]
                      "
                    />
                  </div>
                )
              )}
            </div>

            {/* BARRAS */}

            <div
              className="
                absolute
                inset-x-9
                bottom-0
                top-2
                flex
                items-end
                justify-between
                gap-2
                sm:gap-4
              "
            >
              {dashboardData.chart.map(
                (item) => {
                  const height =
                    item.value === 0
                      ? 4
                      : Math.max(
                        (
                          item.value /
                          dashboardData.chartMax
                        ) *
                        82,
                        10
                      )

                  return (
                    <div
                      key={item.key}
                      className="
                        group
                        flex
                        h-full
                        min-w-0
                        flex-1
                        flex-col
                        items-center
                        justify-end
                      "
                    >
                      <div
                        className="
                          relative
                          flex
                          w-full
                          flex-1
                          items-end
                          justify-center
                        "
                      >
                        <div
                          className="
                            relative
                            w-full
                            max-w-11
                            rounded-t-[8px]
                            border
                            border-orange-300/10
                            bg-gradient-to-t
                            from-[#5e2c18]/65
                            via-[#a34e20]/75
                            to-orange-300/90
                            shadow-[0_-8px_25px_rgba(249,115,22,0.10)]
                            transition-all
                            duration-500
                            group-hover:brightness-125
                          "
                          style={{
                            height:
                              `${height}%`,
                          }}
                        >

                          <div
                            className="
                              absolute
                              inset-x-1
                              top-1
                              h-[2px]
                              rounded-full
                              bg-white/25
                            "
                          />

                          <div
                            className="
                              pointer-events-none
                              absolute
                              -top-12
                              left-1/2
                              z-20
                              hidden
                              -translate-x-1/2
                              whitespace-nowrap
                              rounded-lg
                              border
                              border-orange-300/10
                              bg-[#251c17]
                              px-2.5
                              py-1.5
                              text-center
                              shadow-xl
                              group-hover:block
                            "
                          >
                            <p
                              className="
                                text-[9px]
                                font-semibold
                                text-orange-100
                              "
                            >
                              {formatCurrency(
                                item.value
                              )}
                            </p>

                            <p
                              className="
                                text-[8px]
                                text-white/30
                              "
                            >
                              {item.orders} pedidos
                            </p>
                          </div>
                        </div>
                      </div>

                      <span
                        className="
                          mt-2.5
                          text-[8px]
                          font-semibold
                          text-white/25
                        "
                      >
                        {item.label}
                      </span>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </article>

        {/* OPERACIÓN */}

        <article
          className="
            rounded-[20px]
            border
            border-white/[0.075]
            bg-[#171311]
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.20)]
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-orange-300/55
                "
              >
                Operación actual
              </p>

              <h2
                className="
                  mt-1
                  text-base
                  font-semibold
                  text-white/90
                "
              >
                Estado del restaurante
              </h2>
            </div>

            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-emerald-400/10
                bg-emerald-400/[0.08]
                px-2
                py-1
                text-[9px]
                font-semibold
                text-emerald-300
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-emerald-300
                  shadow-[0_0_8px_rgba(110,231,183,0.8)]
                "
              />

              Operativo
            </span>
          </div>

          <div className="mt-5 space-y-2.5">

            {[
              {
                label:
                  'Órdenes activas',

                value:
                  activeOrders,

                icon:
                  Activity,

                iconClass:
                  'bg-orange-500/10 text-orange-300',
              },

              {
                label:
                  'Pendientes',

                value:
                  dashboardData.pendingOrders,

                icon:
                  Clock3,

                iconClass:
                  'bg-amber-500/10 text-amber-300',
              },

              {
                label:
                  'En preparación',

                value:
                  dashboardData.preparingOrders,

                icon:
                  ShoppingBag,

                iconClass:
                  'bg-orange-500/10 text-orange-300',
              },

              {
                label:
                  'Listos',

                value:
                  dashboardData.readyOrders,

                icon:
                  CheckCircle2,

                iconClass:
                  'bg-emerald-500/10 text-emerald-300',
              },

              {
                label:
                  'Pagos por revisar',

                value:
                  pendingPayments,

                icon:
                  ReceiptText,

                iconClass:
                  'bg-violet-500/10 text-violet-300',
              },
            ].map((item) => {
              const Icon =
                item.icon

              return (
                <div
                  key={item.label}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-white/[0.055]
                    bg-black/10
                    px-3
                    py-2.5
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2.5
                    "
                  >
                    <div
                      className={`
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        ${item.iconClass}
                      `}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <span
                      className="
                        text-[11px]
                        font-medium
                        text-white/40
                      "
                    >
                      {item.label}
                    </span>
                  </div>

                  <span
                    className="
                      text-sm
                      font-bold
                      text-white/80
                    "
                  >
                    {item.value}
                  </span>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      {/* ====================================================== */}
      {/* SEGUNDA LÍNEA DE DATOS */}
      {/* ====================================================== */}

      <section
        className="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-3
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            rounded-[16px]
            border
            border-white/[0.065]
            bg-[#171311]
            px-4
            py-3.5
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-orange-500/10
              text-orange-300
            "
          >
            <TrendingUp className="h-4 w-4" />
          </div>

          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white/25
              "
            >
              Ingreso acumulado
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-white/80
              "
            >
              {formatCurrency(
                dashboardData.totalRevenue
              )}
            </p>
          </div>
        </div>

        <div
          className="
            flex
            items-center
            gap-3
            rounded-[16px]
            border
            border-white/[0.065]
            bg-[#171311]
            px-4
            py-3.5
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-emerald-500/10
              text-emerald-300
            "
          >
            <Users className="h-4 w-4" />
          </div>

          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white/25
              "
            >
              Personal activo
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-white/80
              "
            >
              {activeUsers} de {users.length}
            </p>
          </div>
        </div>

        <div
          className="
            flex
            items-center
            gap-3
            rounded-[16px]
            border
            border-white/[0.065]
            bg-[#171311]
            px-4
            py-3.5
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-amber-500/10
              text-amber-300
            "
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white/25
              "
            >
              Entregados hoy
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-white/80
              "
            >
              {dashboardData.completedToday}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* PEDIDOS RECIENTES */}
      {/* ====================================================== */}

      <section
        className="
          overflow-hidden
          rounded-[20px]
          border
          border-white/[0.075]
          bg-[#171311]
          shadow-[0_20px_60px_rgba(0,0,0,0.20)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-white/[0.06]
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.15em]
                text-orange-300/55
              "
            >
              Actividad reciente
            </p>

            <h2
              className="
                mt-1
                text-base
                font-semibold
                text-white/90
              "
            >
              Pedidos recientes
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              modules
                .find(
                  (module) =>
                    module.id ===
                    'ordenes'
                )
                ?.onClick?.()
            }
            className="
              inline-flex
              w-fit
              items-center
              gap-1
              text-[10px]
              font-semibold
              text-orange-300
              transition
              hover:text-orange-200
            "
          >
            Ver todos

            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">

          <table
            className="
              w-full
              min-w-[720px]
              text-left
            "
          >
            <thead>
              <tr
                className="
                  border-b
                  border-white/[0.05]
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white/20
                "
              >
                <th className="px-5 py-3">
                  Pedido
                </th>

                <th className="px-4 py-3">
                  Cliente
                </th>

                <th className="px-4 py-3">
                  Fecha
                </th>

                <th className="px-4 py-3">
                  Estado
                </th>

                <th
                  className="
                    px-5
                    py-3
                    text-right
                  "
                >
                  Total
                </th>
              </tr>
            </thead>

            <tbody>

              {dashboardData
                .recentOrders
                .length > 0 ? (

                dashboardData
                  .recentOrders
                  .map((order) => (

                    <tr
                      key={order.id}
                      className="
                        border-b
                        border-white/[0.045]
                        text-xs
                        transition
                        last:border-b-0
                        hover:bg-white/[0.022]
                      "
                    >
                      <td className="px-5 py-3.5">
                        <div
                          className="
                            flex
                            items-center
                            gap-2.5
                          "
                        >
                          <div
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              bg-orange-500/10
                              text-orange-300
                              ring-1
                              ring-inset
                              ring-orange-400/10
                            "
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                          </div>

                          <div>

                            <p
                              className="
                                font-mono
                                text-[11px]
                                font-semibold
                                text-white/75
                              "
                            >
                              #
                              {
                                order.codigo_tracking ||
                                order.id
                              }
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[9px]
                                text-white/22
                              "
                            >
                              {
                                order.modalidad_entrega ===
                                  'consumo_local'
                                  ? 'Consumo local'
                                  : 'Para retirar'
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td
                        className="
                          px-4
                          py-3.5
                          text-[11px]
                          text-white/42
                        "
                      >
                        {
                          order.cliente?.nombre ||
                          order.cliente_nombre ||
                          'Cliente'
                        }
                      </td>

                      <td
                        className="
                          px-4
                          py-3.5
                          text-[10px]
                          text-white/28
                        "
                      >
                        {
                          order.created_at
                            ? new Date(
                              order.created_at
                            ).toLocaleDateString(
                              'es-CR',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                            : 'Sin fecha'
                        }
                      </td>

                      <td className="px-4 py-3.5">

                        <span
                          className={`
                            inline-flex
                            rounded-full
                            border
                            px-2
                            py-1
                            text-[9px]
                            font-semibold

                            ${
                              STATUS_STYLES[
                                order.estado_pedido
                              ] ||
                              STATUS_STYLES.pendiente
                            }
                          `}
                        >
                          {
                            STATUS_LABELS[
                              order.estado_pedido
                            ] ||
                            order.estado_pedido ||
                            'Pendiente'
                          }
                        </span>
                      </td>

                      <td
                        className="
                          px-5
                          py-3.5
                          text-right
                          font-mono
                          text-[11px]
                          font-semibold
                          text-orange-200
                        "
                      >
                        {formatCurrency(
                          order.total
                        )}
                      </td>
                    </tr>
                  ))
              ) : (

                <tr>
                  <td
                    colSpan="5"
                    className="
                      px-6
                      py-10
                      text-center
                      text-xs
                      text-white/20
                    "
                  >
                    Todavía no hay pedidos
                    para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SEGURIDAD */}
      {/* ====================================================== */}

      <section
        className="
          flex
          flex-col
          gap-3
          rounded-[16px]
          border
          border-white/[0.065]
          bg-[#15110f]
          px-4
          py-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-emerald-500/10
              text-emerald-300
              ring-1
              ring-inset
              ring-emerald-400/10
            "
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>

          <div>

            <p
              className="
                text-[11px]
                font-medium
                text-white/60
              "
            >
              Sesión administrativa protegida
            </p>

            <p
              className="
                text-[9px]
                text-white/22
              "
            >
              Acceso autorizado como administrador
              de Rooster CR.
            </p>
          </div>
        </div>

        <span
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-full
            bg-emerald-500/[0.08]
            px-2.5
            py-1
            text-[9px]
            font-semibold
            text-emerald-300
            ring-1
            ring-inset
            ring-emerald-400/10
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-emerald-300
              shadow-[0_0_8px_rgba(110,231,183,0.8)]
            "
          />

          Sistema operativo
        </span>
      </section>

    </div>
  )
}

export default AdminHome