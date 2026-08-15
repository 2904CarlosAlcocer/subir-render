import { spawn } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const archivoActual = fileURLToPath(import.meta.url)
const carpetaScripts = dirname(archivoActual)
const carpetaFrontend = dirname(carpetaScripts)

const esWindows = process.platform === 'win32'
const procesos = []
let cerrando = false

// Recibe "dev" o "preview".
const modo = process.argv[2] || 'dev'

if (!['dev', 'preview'].includes(modo)) {
  console.error(
    'Modo no válido. Usa "dev" o "preview".'
  )

  process.exit(1)
}

function iniciarComando(
  nombre,
  comandoWindows,
  comandoUnix
) {
  const proceso = esWindows
    ? spawn(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', comandoWindows],
        {
          cwd: carpetaFrontend,
          stdio: 'inherit',
          windowsHide: false,
        }
      )
    : spawn(
        '/bin/sh',
        ['-c', comandoUnix],
        {
          cwd: carpetaFrontend,
          stdio: 'inherit',
        }
      )

  proceso.on('error', (error) => {
    console.error(
      `[${nombre}] No se pudo iniciar: ${error.message}`
    )

    cerrarTodo(1)
  })

  proceso.on('exit', (codigo, senal) => {
    if (cerrando) {
      return
    }

    console.error(
      `[${nombre}] terminó.`,
      {
        codigo,
        senal,
      }
    )

    cerrarTodo(
      typeof codigo === 'number'
        ? codigo
        : 1
    )
  })

  procesos.push(proceso)

  return proceso
}

function detenerProceso(proceso) {
  if (
    !proceso ||
    !proceso.pid ||
    proceso.killed
  ) {
    return
  }

  if (esWindows) {
    spawn(
      process.env.ComSpec || 'cmd.exe',
      [
        '/d',
        '/s',
        '/c',
        `taskkill /PID ${proceso.pid} /T /F >NUL 2>&1`,
      ],
      {
        stdio: 'ignore',
        windowsHide: true,
      }
    )

    return
  }

  proceso.kill('SIGTERM')
}

function cerrarTodo(codigo = 0) {
  if (cerrando) {
    return
  }

  cerrando = true

  for (const proceso of procesos) {
    detenerProceso(proceso)
  }

  setTimeout(
    () => process.exit(codigo),
    300
  )
}

const comandoFrontend =
  modo === 'preview'
    ? 'npm run preview:frontend'
    : 'npm run dev:frontend'

console.log('Iniciando Rooster CR...')
console.log(
  `FRONTEND: Vite ${modo}`
)
console.log('QUEUE: Laravel queue:work')

iniciarComando(
  'FRONTEND',
  comandoFrontend,
  comandoFrontend
)

iniciarComando(
  'QUEUE',
  'npm run queue',
  'npm run queue'
)

process.on(
  'SIGINT',
  () => cerrarTodo(0)
)

process.on(
  'SIGTERM',
  () => cerrarTodo(0)
)