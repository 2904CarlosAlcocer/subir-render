<?php

use App\Http\Controllers\AcompanamientoController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\IngredienteController;
use App\Http\Controllers\HorarioPedidosController;
use App\Http\Controllers\MensajeContactoController;
use App\Http\Controllers\OpcionPastaController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\PerfilClienteController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTENTICACIÓN PÚBLICA
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [PasswordResetController::class, 'enviarEnlace'])
    ->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'restablecer'])
    ->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| CATEGORÍAS Y PRODUCTOS PÚBLICOS
|--------------------------------------------------------------------------
*/

Route::get('/categorias', [CategoriaController::class, 'index']);
Route::get('/productos', [ProductoController::class, 'index']);

/*
|--------------------------------------------------------------------------
| ESTADO PÚBLICO DEL HORARIO DE PEDIDOS
|--------------------------------------------------------------------------
*/

Route::get('/horario-pedidos/estado', [HorarioPedidosController::class, 'estado']);

Route::get('/productos/destacado-home', [ProductoController::class, 'destacadoHome']);

/*
|--------------------------------------------------------------------------
| CLIENTES PÚBLICOS
|--------------------------------------------------------------------------
*/

Route::get('/clientes', [ClienteController::class, 'index']);
Route::get('/clientes/{cliente}', [ClienteController::class, 'show']);

/*
|--------------------------------------------------------------------------
| CREACIÓN PÚBLICA DE PEDIDOS
|--------------------------------------------------------------------------
*/

Route::post('/pedidos', [PedidoController::class, 'store']);

/*
|--------------------------------------------------------------------------
| CONSULTA PÚBLICA DE PEDIDOS
|--------------------------------------------------------------------------
*/

Route::get('/pedidos/tracking/{codigo}', [PedidoController::class, 'buscarPorTracking']);
Route::get('/pedidos/publico/{codigo}', [PedidoController::class, 'pedidoPublico']);
Route::post('/pedidos/{codigo}/comprobante', [PedidoController::class, 'subirComprobante']);

/*
|--------------------------------------------------------------------------
| MENSAJES DE CONTACTO PÚBLICOS
|--------------------------------------------------------------------------
*/

Route::post('/mensajes-contacto', [MensajeContactoController::class, 'store'])
    ->middleware('throttle:5,1');

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS CON SANCTUM
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | SESIÓN
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    /*
    |--------------------------------------------------------------------------
    | PERFIL DEL CLIENTE AUTENTICADO
    |--------------------------------------------------------------------------
    */

    Route::middleware('rol:cliente')->group(function () {
        Route::get('/perfil-cliente', [PerfilClienteController::class, 'mostrar']);
        Route::patch('/perfil-cliente', [PerfilClienteController::class, 'actualizar']);
        Route::get('/perfil-cliente/pedido-activo', [PerfilClienteController::class, 'pedidoActivo']);
        Route::get('/perfil-cliente/historial', [PerfilClienteController::class, 'historial']);
    });

    /*
    |--------------------------------------------------------------------------
    | APERTURA, CENTRO DE DATOS Y CIERRE DE CAJA
    |--------------------------------------------------------------------------
    */

    Route::middleware('rol:admin,caja')->group(function () {
        Route::get('/caja/actual', [CajaController::class, 'actual']);
        Route::post('/caja/abrir', [CajaController::class, 'abrir']);
        Route::post('/caja/arqueo', [CajaController::class, 'arqueo']);
        Route::get('/caja/movimientos', [CajaController::class, 'movimientos']);
        Route::post('/caja/movimientos', [CajaController::class, 'registrarMovimiento']);
        Route::post('/caja/cerrar', [CajaController::class, 'cerrar']);

        // 🔥 NUEVA RUTA: Obtener pedidos pendientes para Caja
        Route::get('/caja/pedidos-pendientes', [PedidoController::class, 'pedidosPendientesCaja']);

        // 🔥 NUEVA RUTA: Cobrar un pedido
        Route::post('/pedidos/{pedido}/cobrar', [PedidoController::class, 'cobrarPedido']);

        Route::post('/clientes', [ClienteController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | GESTIÓN DE PEDIDOS DEL PERSONAL
    |--------------------------------------------------------------------------
    */

    Route::middleware('rol:admin,cocina,caja')->group(function () {
        Route::get('/pedidos', [PedidoController::class, 'index']);
        Route::patch('/pedidos/{pedido}/estado', [PedidoController::class, 'updateEstado']);
    });

    /*
    |--------------------------------------------------------------------------
    | RUTAS EXCLUSIVAS DEL ADMINISTRADOR
    |--------------------------------------------------------------------------
    */

    Route::middleware('es.admin')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | HISTORIAL DE CAJAS
        |--------------------------------------------------------------------------
        */

        Route::get('/admin/caja/historial', [CajaController::class, 'historial']);

        /*
        |--------------------------------------------------------------------------
        | HORARIO Y RECEPCIÓN DE PEDIDOS
        |--------------------------------------------------------------------------
        */

        Route::get('/admin/horario-pedidos', [HorarioPedidosController::class, 'index']);
        Route::put('/admin/horario-pedidos/semanal', [HorarioPedidosController::class, 'actualizarSemanal']);
        Route::post('/admin/horario-pedidos/extender-hoy', [HorarioPedidosController::class, 'extenderHoy']);
        Route::post('/admin/horario-pedidos/pausar', [HorarioPedidosController::class, 'pausar']);
        Route::post('/admin/horario-pedidos/reanudar', [HorarioPedidosController::class, 'reanudar']);
        Route::delete('/admin/horario-pedidos/extension-hoy', [HorarioPedidosController::class, 'cancelarExtension']);

        /*
        |--------------------------------------------------------------------------
        | CENTRO DE MENSAJES
        |--------------------------------------------------------------------------
        */

        Route::get('/admin/mensajes-contacto', [MensajeContactoController::class, 'index']);
        Route::get('/admin/mensajes-contacto/resumen', [MensajeContactoController::class, 'resumen']);
        Route::get('/admin/mensajes-contacto/{mensaje}', [MensajeContactoController::class, 'show']);
        Route::patch('/admin/mensajes-contacto/{mensaje}/estado', [MensajeContactoController::class, 'updateEstado']);
        Route::patch('/admin/mensajes-contacto/{mensaje}/restaurar', [MensajeContactoController::class, 'restaurar']);

        /*
        |--------------------------------------------------------------------------
        | COMPROBANTES SINPE
        |--------------------------------------------------------------------------
        */

        Route::get('/admin/comprobantes', [PedidoController::class, 'listarComprobantes']);
        Route::patch('/admin/comprobantes/{pedidoId}/verificar', [PedidoController::class, 'verificarComprobante']);

        /*
        |--------------------------------------------------------------------------
        | DESCARGA DE COMPROBANTES
        |--------------------------------------------------------------------------
        */

        Route::get('/pagos/comprobante/{pago}', [PedidoController::class, 'descargarComprobante'])
            ->name('api.pagos.comprobante');

        /*
        |--------------------------------------------------------------------------
        | USUARIOS
        |--------------------------------------------------------------------------
        */

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}/toggle-estado', [UserController::class, 'toggleEstado']);

        /*
        |--------------------------------------------------------------------------
        | PRODUCTOS
        |--------------------------------------------------------------------------
        */

        Route::get('/admin/productos', [ProductoController::class, 'indexAdmin']);
        Route::post('/productos', [ProductoController::class, 'store']);
        Route::post('/productos/{producto}', [ProductoController::class, 'update']);
        Route::patch('/productos/{producto}/toggle-estado', [ProductoController::class, 'toggleEstado']);

        /*
        |--------------------------------------------------------------------------
        | INGREDIENTES EXTRAS
        |--------------------------------------------------------------------------
        */

        Route::get('/ingredientes', [IngredienteController::class, 'index']);
        Route::post('/ingredientes', [IngredienteController::class, 'store']);
        Route::put('/ingredientes/{ingrediente}', [IngredienteController::class, 'update']);
        Route::patch('/ingredientes/{ingrediente}/toggle-estado', [IngredienteController::class, 'toggleEstado']);

        /*
        |--------------------------------------------------------------------------
        | OPCIONES DE PASTA
        |--------------------------------------------------------------------------
        */

        Route::get('/opciones-pasta', [OpcionPastaController::class, 'index']);
        Route::post('/opciones-pasta', [OpcionPastaController::class, 'store']);
        Route::put('/opciones-pasta/{opcionPasta}', [OpcionPastaController::class, 'update']);
        Route::patch('/opciones-pasta/{opcionPasta}/toggle-estado', [OpcionPastaController::class, 'toggleEstado']);

        /*
        |--------------------------------------------------------------------------
        | ACOMPAÑAMIENTOS
        |--------------------------------------------------------------------------
        */

        Route::get('/acompanamientos', [AcompanamientoController::class, 'index']);
        Route::post('/acompanamientos', [AcompanamientoController::class, 'store']);
        Route::put('/acompanamientos/{acompanamiento}', [AcompanamientoController::class, 'update']);
        Route::patch('/acompanamientos/{acompanamiento}/toggle-estado', [AcompanamientoController::class, 'toggleEstado']);

        /*
        |--------------------------------------------------------------------------
        | CATEGORÍAS
        |--------------------------------------------------------------------------
        */

        Route::post('/categorias', [CategoriaController::class, 'store']);
        Route::put('/categorias/{categoria}', [CategoriaController::class, 'update']);
        Route::patch('/categorias/{categoria}/toggle-estado', [CategoriaController::class, 'toggleEstado']);

        /*
        |--------------------------------------------------------------------------
        | GESTIÓN DE CLIENTES
        |--------------------------------------------------------------------------
        */

        Route::put('/clientes/{cliente}', [ClienteController::class, 'update']);
    });
});