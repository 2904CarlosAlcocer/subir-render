import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const userRaw = localStorage.getItem('rooster_user')
  const user = userRaw ? JSON.parse(userRaw) : null

  const handleLogout = () => {
    localStorage.removeItem('rooster_token')
    localStorage.removeItem('rooster_user')
    navigate('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No hay sesión activa. Vuelve al login.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-black text-[#0A0A0A] mb-2">
          ROOSTER <span className="text-[#E80000]">CR</span> — Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Bienvenido, <strong>{user.name}</strong> ({user.rol})
        </p>
        <button
          onClick={handleLogout}
          className="bg-[#E80000] hover:bg-[#0A0A0A] text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default Dashboard