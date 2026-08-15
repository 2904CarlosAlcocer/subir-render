import { Link } from 'react-router-dom'
import {
  Flame, ArrowRight, Sparkles,
  ChefHat, Heart, Users, Target, Eye, Award,
  MapPin, Clock, Coffee, Quote
} from 'lucide-react'
import { useState } from 'react'
import fondoPrincipal from '../assets/nosotros.jpeg'
// Importa tus imágenes locales
import espacioImage from '../assets/mapa.jpeg'
import equipoImage from '../assets/nosotros.jpeg'

export default function Nosotros() {
  const [activeTab, setActiveTab] = useState('mision')

  // Generar chispas
  const generateSparks = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      size: 1.5 + Math.random() * 2.5,
    }))
  }

  const sparks = generateSparks(10)

  // Datos de historia
  const historiaData = {
    titulo: 'Nuestra Historia',
    contenido: `Desde pequeño los animales han estado presentes en mi familia y siempre han sido nuestros mejores amigos. Puntualmente mi mascota era un Gallo que me seguía a todas partes, de aquí nace el nombre Rooster (gallo en inglés) ya que una serie de momentos y eventos me dieron señales de que un amigo de infancia (mi gallo) podría ser el símbolo principal del nombre de mi negocio, en honor a momentos increíbles que viví de niño, combinado con la experiencia maravillosa que quiero que vivan mis clientes aquí, en Rooster Pizza & Grill.`,
    autor: 'Fabian',
  }

  return (
    <div className="bg-[#120C08] text-white overflow-hidden relative">
      {/* ==================== CHISPAS DE FUEGO - FONDO GLOBAL ==================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {sparks.map((spark) => (
          <div
            key={`spark-${spark.id}`}
            className="absolute rounded-full bg-gradient-to-t from-orange-400 to-yellow-300 animate-spark"
            style={{
              left: `${spark.left}%`,
              top: `${spark.top}%`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              animationDelay: `${spark.delay}s`,
              animationDuration: `${spark.duration}s`,
              boxShadow: '0 0 8px 2px rgba(251, 146, 60, 0.4)',
            }}
          />
        ))}
      </div>

      {/* ==================== HERO ==================== */}
      <section className="relative isolate min-h-[540px] sm:min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20 overflow-hidden bg-[#120C08]">
        {/* En móvil la imagen se desplaza normalmente; el fondo fijo queda solo para escritorio */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-[position:52%_center] bg-scroll md:bg-center md:bg-fixed"
          style={{ backgroundImage: `url(${fondoPrincipal})` }}
        />

        {/* Oscurecimiento uniforme para mejorar el contraste */}
        <div className="absolute inset-0 z-[1] bg-black/55 sm:bg-black/40" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/50 via-black/35 to-black/20 sm:from-black/45 sm:via-black/30 sm:to-black/15" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-black/10 to-[#120C08]/85" />

        <div className="absolute top-20 right-10 z-[2] w-64 h-64 sm:w-96 sm:h-96 bg-[#E4002B]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 z-[2] w-52 h-52 sm:w-72 sm:h-72 bg-[#F5A300]/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4002B]/30 border border-[#E4002B]/50 rounded-full w-fit mx-auto mb-4 sm:mb-6 backdrop-blur-md shadow-lg shadow-black/20">
            <Heart className="w-4 h-4 text-[#F5A300]" />
            <span className="text-sm font-semibold text-[#F5A300]">
              Nuestra historia
            </span>
          </div>

          <h1 className="text-[clamp(2.55rem,12vw,3.35rem)] sm:text-6xl md:text-7xl font-black leading-[1.05] sm:leading-tight mb-4 sm:mb-6">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">Conoce</span>
            <span className="block bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-[#F5A300] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              Rooster Pizza
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed px-1 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            Rooster Pizza nace en el corazón de La Fortuna, en el Mercadito Arenal,
            con la pasión de ofrecer comida de calidad, ingredientes frescos y un
            ambiente único para compartir momentos inolvidables.
          </p>

          <div className="grid grid-cols-2 sm:flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 max-w-md mx-auto">
            <Link
              to="/menu"
              className="w-full sm:w-auto px-5 sm:px-8 py-3 bg-gradient-to-r from-[#E4002B] to-[#F5A300] hover:shadow-2xl hover:shadow-[#E4002B]/50 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg shadow-black/30"
            >
              Ver menú
            </Link>
            <Link
              to="/ubicacion"
              className="w-full sm:w-auto px-5 sm:px-8 py-3 border-2 border-[#F5A300] text-[#F5A300] hover:bg-[#F5A300]/10 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-black/30"
            >
              Visítanos
            </Link>
          </div>
        </div>

        <svg
          className="absolute bottom-0 left-0 w-full -mb-1"
          viewBox="0 0 1200 35"
          preserveAspectRatio="none"
          style={{ zIndex: 5 }}
        >
          <path
            d="M0,40 Q300,0 600,40 T1200,40 L1200,120 L0,120 Z"
            fill="#120C08"
          />
          <path
            d="M0,50 Q300,20 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="#120C08"
            opacity="0.8"
          />
        </svg>
      </section>

      {/* ==================== HISTORIA COMPLETA ==================== */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#120C08] via-[#120C08] to-[#0a0604]">
        <div className="max-w-6xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 border border-[#F5A300]/20 rounded-full backdrop-blur-sm mb-6">
              <Quote className="w-4 h-4 text-[#F5A300]" />
              <span className="text-[#F5A300] font-light text-xs tracking-[0.3em] uppercase">
                Nuestra historia
              </span>
              <Quote className="w-4 h-4 text-[#F5A300]" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
              El origen de <span className="text-[#F5A300]">Rooster</span>
            </h2>
            <div className="flex justify-center gap-3 mt-6">
              <span className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
              <span className="w-2 h-2 bg-[#F5A300] rounded-full animate-pulse" />
              <span className="w-16 h-0.5 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
            </div>
          </div>

          {/* Tarjeta de historia */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-[#F5A300]/5 rounded-3xl blur-2xl -z-10" />

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="inline-flex p-3 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl flex-shrink-0">
                  <Heart className="w-8 h-8 text-[#F5A300]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Nuestra Historia</h3>
                  <p className="text-[#F5A300] text-sm font-light">Por {historiaData.autor}</p>
                </div>
              </div>

              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                {historiaData.contenido}
              </p>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 text-[#F5A300]">
                  <span className="text-sm font-light"></span>
                  <span className="text-sm font-light italic">
                    "En honor a momentos increíbles que viví de niño"
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== TARJETAS ADICIONALES: EXPERIENCIA + PERSONALIDAD ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
            {/* Experiencia */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#F5A300]/30 transition-all duration-300">
              <div className="inline-flex p-3 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl mb-4">
                <Flame className="w-6 h-6 text-[#F5A300]" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Rooster Pizza & Grill</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Rooster Pizza & Grill es una <span className="text-[#F5A300] font-semibold">experiencia gastronómica</span> única,
                donde combinamos la emoción de saborear una pizza en familia con la
                tradición de comer deliciosa carne y todo hecho al mejor calor de la
                leña y el fuego.
              </p>
            </div>

            {/* Personalidad */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#F5A300]/30 transition-all duration-300">
              <div className="inline-flex p-3 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl mb-4">
                <Sparkles className="w-6 h-6 text-[#F5A300]" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Personalidad Rooster</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Rooster Pizza & Grill es una marca que busca <span className="text-[#F5A300] font-semibold">conexiones genuinas con las personas</span>
                por medio de una experiencia única, combinando el fuego con pizza y carne,
                sabores inigualables desde <span className="text-[#F5A300] font-semibold">la pasión de hacer algo diferente</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MISIÓN, VISIÓN, VALORES ==================== */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#120C08] via-[#120C08] to-[#0a0604] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 border border-[#F5A300]/20 rounded-full backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-[#F5A300]" />
              <span className="text-[#F5A300] font-light text-xs tracking-[0.3em] uppercase">
                Nuestros pilares
              </span>
              <Sparkles className="w-4 h-4 text-[#F5A300]" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
              Lo que nos <span className="text-[#F5A300]">impulsa</span>
            </h2>
            <div className="flex justify-center gap-3 mt-6">
              <span className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
              <span className="w-2 h-2 bg-[#F5A300] rounded-full animate-pulse" />
              <span className="w-16 h-0.5 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
            {[
              { id: 'mision', label: 'Misión', icon: Target },
              { id: 'vision', label: 'Visión', icon: Eye },
              { id: 'valores', label: 'Valores', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 sm:px-8 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#E4002B] to-[#F5A300] text-white shadow-lg shadow-[#E4002B]/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido de tabs - SIN ESPACIO EXTRA */}
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
              {activeTab === 'mision' && (
                <div className="text-center space-y-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl">
                    <Target className="w-12 h-12 text-[#F5A300]" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Nuestra Misión</h3>
                  <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
                    Brindar experiencias gastronómicas únicas con ingredientes frescos,
                    recetas auténticas y un servicio excepcional que haga sentir a cada
                    comensal como en casa.
                  </p>
                </div>
              )}

              {activeTab === 'vision' && (
                <div className="text-center space-y-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl">
                    <Eye className="w-12 h-12 text-[#F5A300]" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Nuestra Visión</h3>
                  <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
                    Ser el restaurante favorito de locales y turistas en La Fortuna,
                    reconocido por la calidad de sus platillos, la calidez de su servicio
                    y el ambiente único que ofrecemos.
                  </p>
                </div>
              )}

              {activeTab === 'valores' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex p-4 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl mb-4">
                      <Award className="w-12 h-12 text-[#F5A300]" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">Nuestros Valores</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {[
                      { label: 'Calidad', desc: 'Excelencia en cada detalle' },
                      { label: 'Pasión', desc: 'Amor por lo que hacemos' },
                      { label: 'Honestidad', desc: 'Transparencia y confianza' },
                      { label: 'Respeto', desc: 'Por nuestros clientes y equipo' },
                    ].map((valor, idx) => (
                      <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <h4 className="font-bold text-[#F5A300]">{valor.label}</h4>
                        <p className="text-white/60 text-sm">{valor.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== NUESTRO ESPACIO ==================== */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0604] via-[#120C08] to-[#0a0604] -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 border border-[#F5A300]/20 rounded-full backdrop-blur-sm mb-6">
              <MapPin className="w-4 h-4 text-[#F5A300]" />
              <span className="text-[#F5A300] font-light text-xs tracking-[0.3em] uppercase">
                Nuestro espacio
              </span>
              <MapPin className="w-4 h-4 text-[#F5A300]" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
              Un lugar para <span className="text-[#F5A300]">disfrutar</span>
            </h2>
            <div className="flex justify-center gap-3 mt-6">
              <span className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
              <span className="w-2 h-2 bg-[#F5A300] rounded-full animate-pulse" />
              <span className="w-16 h-0.5 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={espacioImage}
                alt="Nuestro espacio"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120C08] via-transparent to-transparent" />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">El corazón de La Fortuna</h3>
              <p className="text-white/70 leading-relaxed">
                Ubicados en el Mercadito Arenal, nuestro espacio está diseñado para
                ofrecer una experiencia acogedora y vibrante. Disfruta de nuestra
                terraza al aire libre o del ambiente cálido de nuestro interior,
                siempre rodeados de la esencia de La Fortuna.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                  <Clock className="w-6 h-6 text-[#F5A300] mx-auto mb-2" />
                  <p className="text-sm font-bold">Horario</p>
                  <p className="text-white/60 text-xs">12 pm - 10:00 PM</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                  <Coffee className="w-6 h-6 text-[#F5A300] mx-auto mb-2" />
                  <p className="text-sm font-bold">Ambiente</p>
                  <p className="text-white/60 text-xs">Familiar y acogedor</p>
                </div>
              </div>
              <Link
                to="/ubicacion"
                className="inline-flex items-center gap-2 text-[#F5A300] hover:gap-4 transition-all duration-300"
              >
                <span>Visítanos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== NUESTRO EQUIPO ==================== */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden border-t border-white/10 bg-gradient-to-r from-[#E4002B]/5 via-[#F5A300]/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 border border-[#F5A300]/20 rounded-full backdrop-blur-sm mb-6">
              <Users className="w-4 h-4 text-[#F5A300]" />
              <span className="text-[#F5A300] font-light text-xs tracking-[0.3em] uppercase">
                Nuestro equipo
              </span>
              <Users className="w-4 h-4 text-[#F5A300]" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
              Hecho con <span className="text-[#F5A300]">pasión</span>
            </h2>
            <div className="flex justify-center gap-3 mt-6">
              <span className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
              <span className="w-2 h-2 bg-[#F5A300] rounded-full animate-pulse" />
              <span className="w-16 h-0.5 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <h3 className="text-2xl font-bold text-white">Detrás de cada plato</h3>
              <p className="text-white/70 leading-relaxed">
                Nuestro equipo está conformado por profesionales apasionados por la
                gastronomía, comprometidos con ofrecer la mejor experiencia culinaria.
                Cada plato es preparado con esmero y dedicación.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { rol: 'Chef Ejecutivo', icon: ChefHat },
                  { rol: 'Sous Chef', icon: ChefHat },
                  { rol: 'Parrillero', icon: Flame },
                  { rol: 'Servicio al Cliente', icon: Users },
                ].map((miembro, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 text-center hover:bg-white/10 hover:border-[#F5A300]/30 transition-all duration-300">
                    <miembro.icon className="w-6 h-6 text-[#F5A300] mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">{miembro.rol}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 relative rounded-2xl overflow-hidden">
              <img
                src={equipoImage}
                alt="Nuestro equipo"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120C08] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 border-t border-white/10 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`cta-spark-${i}`}
              className="absolute rounded-full bg-orange-400 animate-float-spark"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${15 + Math.random() * 70}%`,
                width: `${1.5 + Math.random() * 2}px`,
                height: `${1.5 + Math.random() * 2}px`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
                boxShadow: '0 0 8px 2px rgba(251, 146, 60, 0.3)',
              }}
            />
          ))}
        </div>

        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 relative z-10">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">¿Listo para </span>
            <span className="bg-gradient-to-r from-[#F5A300] to-[#E4002B] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              visitarnos?
            </span>
          </h2>

          <p className="text-white/80 text-base sm:text-lg md:text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Ven a conocernos y descubre por qué Rooster Pizza es el lugar favorito
            de locales y turistas en La Fortuna.
          </p>

          <Link
            to="/menu"
            className="inline-block px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#F5A300] to-[#E4002B] hover:shadow-2xl hover:shadow-[#F5A300]/50 text-black font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 text-base sm:text-lg md:text-xl shadow-lg shadow-black/30"
          >
            VER MENÚ
          </Link>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6 bg-black/30 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center text-white/60 text-xs sm:text-sm relative z-10">
          <p>Rooster Pizza & Grill © 2026 | Mercadito Arenal, La Fortuna, Alajuela</p>
        </div>
      </footer>

      {/* ==================== ESTILOS PARA LAS CHISPAS ==================== */}
      <style>{`
        @keyframes spark {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1.5) rotate(45deg) translateY(-10px);
          }
          70% {
            opacity: 0.8;
            transform: scale(1) rotate(90deg) translateY(-20px);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(180deg) translateY(-40px);
          }
        }

        @keyframes float-spark {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0);
          }
          20% {
            opacity: 1;
            transform: translate(10px, -15px) scale(1.2);
          }
          50% {
            opacity: 0.9;
            transform: translate(-8px, -35px) scale(1);
          }
          80% {
            opacity: 0.6;
            transform: translate(15px, -50px) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(-5px, -70px) scale(0);
          }
        }

        .animate-spark {
          animation: spark linear infinite;
        }

        .animate-float-spark {
          animation: float-spark ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}