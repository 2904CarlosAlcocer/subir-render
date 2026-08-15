<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_pedidos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pedido_id')
                ->unique()
                ->constrained('pedidos')
                ->cascadeOnDelete();

            $table->string('metodo_pago', 20)->nullable();

            $table->string('estado_pago', 40)->default('pendiente');

            $table->decimal('monto_recibido', 12, 2)->nullable();
            $table->decimal('cambio', 12, 2)->nullable();

            $table->foreignId('cobrado_por_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('fecha_pago')->nullable();

            $table->longText('comprobante_binario')
                ->charset('binary')
                ->nullable();

            $table->string('comprobante_nombre', 255)->nullable();
            $table->string('comprobante_mime', 100)->nullable();
            $table->unsignedBigInteger('comprobante_tamano')->nullable();
            $table->timestamp('fecha_comprobante')->nullable();
            $table->timestamp('fecha_verificacion')->nullable();

            $table->timestamps();

            $table->index('metodo_pago');
            $table->index('estado_pago');
            $table->index('fecha_comprobante');
            $table->index('fecha_pago', 'pagos_pedidos_fecha_pago_index');
            $table->index(['estado_pago', 'fecha_pago'], 'pagos_pedidos_estado_fecha_index');
        });

        $this->importarMetadataExistente();
    }

    private function importarMetadataExistente(): void
    {
        $rutaMetadata = storage_path('app/pedidos_metadata.json');

        if (!file_exists($rutaMetadata)) {
            return;
        }

        $contenido = file_get_contents($rutaMetadata);

        if ($contenido === false) {
            return;
        }

        $registros = json_decode($contenido, true);

        if (!is_array($registros)) {
            return;
        }

        foreach ($registros as $registro) {
            $pedidoId = isset($registro['pedido_id']) ? (int) $registro['pedido_id'] : 0;

            if ($pedidoId <= 0) {
                continue;
            }

            $pedidoExiste = DB::table('pedidos')->where('id', $pedidoId)->exists();

            if (!$pedidoExiste) {
                continue;
            }

            $metodoPago = strtolower(trim((string) ($registro['metodo_pago'] ?? 'efectivo')));

            if (!in_array($metodoPago, ['sinpe', 'efectivo', 'tarjeta'], true)) {
                $metodoPago = 'efectivo';
            }

            $estadoPago = trim((string) ($registro['estado_pago'] ?? ($metodoPago === 'sinpe' ? 'pendiente_comprobante' : 'no_requiere')));

            $datosComprobante = $this->obtenerComprobante($registro);

            $fechaRegistro = $registro['fecha'] ?? now();

            DB::table('pagos_pedidos')->updateOrInsert(
                ['pedido_id' => $pedidoId],
                [
                    'metodo_pago' => $metodoPago,
                    'estado_pago' => $estadoPago,
                    'comprobante_binario' => $datosComprobante['contenido'],
                    'comprobante_nombre' => $datosComprobante['nombre'],
                    'comprobante_mime' => $datosComprobante['mime'],
                    'comprobante_tamano' => $datosComprobante['tamano'],
                    'fecha_comprobante' => $registro['fecha_comprobante'] ?? null,
                    'fecha_verificacion' => $registro['fecha_verificacion'] ?? null,
                    'created_at' => $fechaRegistro,
                    'updated_at' => now(),
                ]
            );
        }
    }

    private function obtenerComprobante(array $registro): array
    {
        $resultado = [
            'contenido' => null,
            'nombre' => null,
            'mime' => null,
            'tamano' => null,
        ];

        $rutaRelativa = trim((string) ($registro['comprobante'] ?? ''));

        if ($rutaRelativa === '') {
            return $resultado;
        }

        $rutaCompleta = storage_path('app/public/' . ltrim(str_replace('\\', '/', $rutaRelativa), '/'));

        if (!file_exists($rutaCompleta) || !is_file($rutaCompleta)) {
            return $resultado;
        }

        $contenido = file_get_contents($rutaCompleta);

        if ($contenido === false) {
            return $resultado;
        }

        $mime = mime_content_type($rutaCompleta);

        return [
            'contenido' => $contenido,
            'nombre' => basename($rutaCompleta),
            'mime' => is_string($mime) ? $mime : 'application/octet-stream',
            'tamano' => filesize($rutaCompleta) ?: strlen($contenido),
        ];
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_pedidos');
    }
};