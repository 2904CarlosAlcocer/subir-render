import { Link } from 'react-router-dom'
import {
  MapPin, Clock, Coffee, Phone, Mail, Globe,
  Navigation, Heart,
} from 'lucide-react'
import { useState } from 'react'
import fortunaBg from '../assets/fortuna.jpeg'

export default function Ubicacion() {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    const address = 'Mercadito Arenal, La Fortuna, Alajuela, Costa Rica'
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const ubicacionData = {
    nombre: 'Rooster Pizza & Grill',
    direccion: 'Mercadito Arenal, La Fortuna, Alajuela, Costa Rica',
    horario: '12:00 PM - 10:00 PM',
    telefono: '+506 8888-8888',
    email: 'info@roosterpizza.com',
    sitioWeb: 'www.roosterpizza.com',
    coordenadas: {
      lat: 10.4710,
      lng: -84.6450
    }
  }

  const SPARKS_COUNT = 25

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

  const sparks = generateSparks(SPARKS_COUNT)

  return (
    <div
      className="text-white overflow-hidden relative min-h-screen"
      style={{
        backgroundImage: `url(${fortunaBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#120C08',
      }}
    >
      {/* Overlay global */}
      <div className="fixed inset-0 bg-black/65 z-0 pointer-events-none" />

      {/* CHISPAS DE FUEGO */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
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

      <div className="relative z-10">

        {/* HERO */}
        <section className="relative min-h-[50vh] flex items-center justify-center px-4 sm:px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70 -z-10" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4002B]/30 border border-[#E4002B]/50 rounded-full w-fit mx-auto mb-6 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-[#F5A300]" />
              <span className="text-sm font-semibold text-[#F5A300]">
                Encuéntranos
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6">
              <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">Nuestra</span>
              <span className="block bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-[#F5A300] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                Ubicación
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Te esperamos en el corazón de La Fortuna. Ven a disfrutar de nuestra
              deliciosa pizza 100% hecha a la leña con productos de calidad y carnes premium a la parrila.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a
                href="#mapa"
                className="px-8 py-3 bg-gradient-to-r from-[#E4002B] to-[#F5A300] hover:shadow-2xl hover:shadow-[#E4002B]/50 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg shadow-black/30"
              >
                Ver en mapa
              </a>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=10.4710,-84.6450"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border-2 border-[#F5A300] text-[#F5A300] hover:bg-[#F5A300]/10 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-black/30 flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Cómo llegar
              </a>
            </div>
          </div>
        </section>

        {/* INFORMACIÓN PRINCIPAL */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Mapa */}
              <div id="mapa" className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[500px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.9457500000004!2d-84.647!3d10.471!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0b4b3a0b3b3b3%3A0xb3b3b3b3b3b3b3b3!2sMercadito%20Arenal!5e0!3m2!1ses!2scr!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Rooster Pizza"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                  <p className="text-[#F5A300] text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {ubicacionData.direccion}
                  </p>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-6">
                <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#F5A300]" />
                    Información de contacto
                  </h2>

                  <div className="space-y-4">
                    {/* Dirección */}
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F5A300]/30 transition-all duration-300">
                      <MapPin className="w-5 h-5 text-[#F5A300] flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-white/60 font-light">Dirección</p>
                        <p className="text-white font-medium">{ubicacionData.direccion}</p>
                        <button
                          onClick={copyAddress}
                          className="mt-1 text-xs text-[#F5A300] hover:text-[#E4002B] transition-colors duration-300 flex items-center gap-1"
                        >
                          {copied ? '✅ ¡Copiado!' : '📋 Copiar dirección'}
                        </button>
                      </div>
                    </div>

                    {/* Horario */}
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F5A300]/30 transition-all duration-300">
                      <Clock className="w-5 h-5 text-[#F5A300] flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-white/60 font-light">Horario de atención</p>
                        <p className="text-white font-medium">{ubicacionData.horario}</p>
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F5A300]/30 transition-all duration-300">
                      <Phone className="w-5 h-5 text-[#F5A300] flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-white/60 font-light">Teléfono</p>
                        <a
                          href={`tel:${ubicacionData.telefono}`}
                          className="text-white font-medium hover:text-[#F5A300] transition-colors duration-300"
                        >
                          {ubicacionData.telefono}
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F5A300]/30 transition-all duration-300">
                      <Mail className="w-5 h-5 text-[#F5A300] flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-white/60 font-light">Email</p>
                        <a
                          href={`mailto:${ubicacionData.email}`}
                          className="text-white font-medium hover:text-[#F5A300] transition-colors duration-300"
                        >
                          {ubicacionData.email}
                        </a>
                      </div>
                    </div>

                    {/* Sitio web */}
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F5A300]/30 transition-all duration-300">
                      <Globe className="w-5 h-5 text-[#F5A300] flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-white/60 font-light">Sitio web</p>
                        <a
                          href={`https://${ubicacionData.sitioWeb}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:text-[#F5A300] transition-colors duration-300"
                        >
                          {ubicacionData.sitioWeb}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${ubicacionData.coordenadas.lat},${ubicacionData.coordenadas.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E4002B] to-[#F5A300] rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-2xl hover:shadow-[#E4002B]/50"
                    >
                      <Navigation className="w-4 h-4" />
                      Cómo llegar
                    </a>
                    <Link
                      to="/menu"
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#F5A300] text-[#F5A300] hover:bg-[#F5A300]/10 rounded-xl font-bold text-sm transition-all duration-300"
                    >
                      <Coffee className="w-4 h-4" />
                      Ver menú
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CÓMO LLEGAR - PASOS */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[#E4002B]/10 via-[#F5A300]/10 to-[#E4002B]/10 border border-[#F5A300]/20 rounded-full backdrop-blur-sm mb-6">
                <Navigation className="w-4 h-4 text-[#F5A300]" />
                <span className="text-[#F5A300] font-light text-xs tracking-[0.3em] uppercase">
                  Cómo llegar
                </span>
                <Navigation className="w-4 h-4 text-[#F5A300]" />
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
                Fácil de <span className="text-[#F5A300]">encontrar</span>
              </h2>
              <div className="flex justify-center gap-3 mt-6">
                <span className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E4002B] to-[#F5A300] rounded-full" />
                <span className="w-2 h-2 bg-[#F5A300] rounded-full animate-pulse" />
                <span className="w-16 h-0.5 bg-gradient-to-r from-[#F5A300] via-[#E4002B] to-transparent rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  paso: 1,
                  titulo: 'Llega a La Fortuna',
                  desc: 'Dirígete al centro de La Fortuna, el punto de encuentro para locales y turistas.',
                  icon: MapPin
                },
                {
                  paso: 2,
                  titulo: 'Busca el Mercadito Arenal',
                  desc: 'Encuentra nuestro restaurante dentro del Mercadito Arenal, un espacio vibrante y acogedor.',
                  icon: Navigation
                },
                {
                  paso: 3,
                  titulo: '¡Disfruta!',
                  desc: 'Siéntate, relájate y disfruta de nuestra deliciosa comida en un ambiente único.',
                  icon: Heart
                }
              ].map((item) => (
                <div
                  key={item.paso}
                  className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:border-[#F5A300]/30 transition-all duration-300 group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#E4002B]/20 to-[#F5A300]/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-8 h-8 text-[#F5A300]" />
                  </div>
                  <div className="text-[#F5A300] text-sm font-bold mb-2">Paso {item.paso}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.titulo}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
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
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black">
              <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">¿Listo para </span>
              <span className="bg-gradient-to-r from-[#F5A300] to-[#E4002B] bg-clip-text text-transparent">
                venir?
              </span>
            </h2>

            <p className="text-white/80 text-base sm:text-lg md:text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Te esperamos en el Mercadito Arenal para que disfrutes de la mejor
              experiencia culinaria en La Fortuna.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=10.4710,-84.6450"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#F5A300] to-[#E4002B] hover:shadow-2xl hover:shadow-[#F5A300]/50 text-black font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 text-base sm:text-lg md:text-xl shadow-lg shadow-black/30"
              >
                CÓMO LLEGAR
              </a>
              <Link
                to="/menu"
                className="inline-block px-10 sm:px-12 py-4 sm:py-5 border-2 border-[#F5A300] text-[#F5A300] hover:bg-[#F5A300]/10 font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 text-base sm:text-lg md:text-xl"
              >
                VER MENÚ
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6 bg-black/30 overflow-hidden">
          <div className="max-w-6xl mx-auto text-center text-white/60 text-xs sm:text-sm relative z-10">
            <p>Rooster Pizza & Grill © 2026 | Mercadito Arenal, La Fortuna, Alajuela</p>
          </div>
        </footer>

      </div>

      {/* ESTILOS PARA LAS CHISPAS */}
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