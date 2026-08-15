<?php

use App\Http\Middleware\RolMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(
    basePath: dirname(__DIR__)
)
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(
        function (Middleware $middleware): void {
            /*
             * Middleware actual.
             *
             * Ejemplos:
             * rol:admin
             * rol:admin,cocina,caja
             */
            $middleware->alias([
                'rol' => RolMiddleware::class,

                /*
                 * Compatibilidad con rutas antiguas
                 * que todavía utilizan estos nombres.
                 */
                'es.admin' => RolMiddleware::class,
                'es.cocina' => RolMiddleware::class,
                'es.caja' => RolMiddleware::class,
                'es.cliente' => RolMiddleware::class,
            ]);
        }
    )
    ->withExceptions(
        function (Exceptions $exceptions): void {
            //
        }
    )
    ->create();