<?php

namespace App\Console\Commands;

use App\Models\Pedido;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ActualizarMetadataComprobantes extends Command
{
    protected $signature = 'metadata:actualizar';
    protected $description = 'Actualiza la metadata de comprobantes con el nombre del cliente';

    public function handle()
    {
        $ruta = storage_path('app/pedidos_metadata.json');
        
        if (!file_exists($ruta)) {
            $this->error('No existe el archivo de metadata');
            return 1;
        }

        $data = json_decode(file_get_contents($ruta), true) ?? [];
        $actualizados = 0;

        foreach ($data as $index => $item) {
            if (isset($item['pedido_id']) && !isset($item['cliente_nombre'])) {
                $pedido = Pedido::with('cliente')->find($item['pedido_id']);
                if ($pedido && $pedido->cliente) {
                    $data[$index]['cliente_nombre'] = $pedido->cliente->nombre;
                    $actualizados++;
                }
            }
        }

        file_put_contents($ruta, json_encode($data, JSON_PRETTY_PRINT));
        
        $this->info("✅ $actualizados comprobantes actualizados con el nombre del cliente");
        return 0;
    }
}