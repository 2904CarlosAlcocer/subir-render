<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Throwable;

class OptimizarImagenesProductos extends Command
{
    /**
     * Nombre y opciones del comando.
     *
     * --force vuelve a generar archivos aunque ya estén actualizados.
     */
    protected $signature = 'imagenes:optimizar-productos
                            {--force : Regenerar todas las imágenes optimizadas}';

    /**
     * Descripción visible en php artisan list.
     */
    protected $description = 'Genera miniaturas WebP 4:3 de 240 px, 480 px y 640 px para las imágenes de productos';

    /**
     * Tamaños utilizados por las tarjetas del menú.
     *
     * @var array<int, array{ancho:int, alto:int, calidad:int}>
     */
    private const TAMANOS = [
        [
            'ancho' => 240,
            'alto' => 180,
            'calidad' => 70,
        ],
        [
            'ancho' => 480,
            'alto' => 360,
            'calidad' => 72,
        ],
        [
            'ancho' => 640,
            'alto' => 480,
            'calidad' => 75,
        ],
    ];

    public function handle(): int
    {
        if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
            $this->error(
                'GD y el soporte WebP deben estar activos antes de ejecutar este comando.'
            );

            return self::FAILURE;
        }

        $directorioOrigen = public_path(
            'storage/productos'
        );

        $directorioDestino = $directorioOrigen
            . DIRECTORY_SEPARATOR
            . 'optimizadas';

        if (! File::isDirectory($directorioOrigen)) {
            $this->error(
                "No existe el directorio de productos: {$directorioOrigen}"
            );

            return self::FAILURE;
        }

        File::ensureDirectoryExists(
            $directorioDestino
        );

        $archivos = collect(
            File::files($directorioOrigen)
        )->filter(function ($archivo): bool {
            return in_array(
                strtolower($archivo->getExtension()),
                [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                ],
                true
            );
        })->values();

        if ($archivos->isEmpty()) {
            $this->warn(
                'No se encontraron imágenes compatibles para optimizar.'
            );

            return self::SUCCESS;
        }

        $forzar = (bool) $this->option(
            'force'
        );

        $procesadas = 0;
        $omitidas = 0;
        $errores = 0;
        $bytesOriginales = 0;
        $bytesOptimizados = 0;

        $this->info(
            "Procesando {$archivos->count()} imágenes de productos..."
        );

        foreach ($archivos as $archivo) {
            $rutaOrigen = $archivo->getPathname();
            $nombreBase = pathinfo(
                $archivo->getFilename(),
                PATHINFO_FILENAME
            );

            $bytesOriginales += (int) $archivo->getSize();

            try {
                $destinos = collect(
                    self::TAMANOS
                )->map(function (array $tamano) use (
                    $directorioDestino,
                    $nombreBase
                ): string {
                    return $directorioDestino
                        . DIRECTORY_SEPARATOR
                        . $nombreBase
                        . '-'
                        . $tamano['ancho']
                        . '.webp';
                });

                $todosActualizados = ! $forzar
                    && $destinos->every(
                        fn (string $destino): bool =>
                            File::exists($destino)
                            && File::lastModified($destino)
                                >= File::lastModified($rutaOrigen)
                    );

                if ($todosActualizados) {
                    $omitidas++;

                    foreach ($destinos as $destino) {
                        $bytesOptimizados += (int) File::size(
                            $destino
                        );
                    }

                    $this->line(
                        "OMITIDA  {$archivo->getFilename()}"
                    );

                    continue;
                }

                $imagenOrigen = $this->cargarImagen(
                    $rutaOrigen,
                    strtolower($archivo->getExtension())
                );

                $imagenOrigen = $this->corregirOrientacionExif(
                    $imagenOrigen,
                    $rutaOrigen,
                    strtolower($archivo->getExtension())
                );

                foreach (self::TAMANOS as $tamano) {
                    $rutaDestino = $directorioDestino
                        . DIRECTORY_SEPARATOR
                        . $nombreBase
                        . '-'
                        . $tamano['ancho']
                        . '.webp';

                    $this->crearMiniaturaCuatroTres(
                        $imagenOrigen,
                        $rutaDestino,
                        $tamano['ancho'],
                        $tamano['alto'],
                        $tamano['calidad']
                    );

                    $bytesOptimizados += (int) File::size(
                        $rutaDestino
                    );
                }

                imagedestroy($imagenOrigen);

                $procesadas++;

                $this->info(
                    "OK       {$archivo->getFilename()}"
                );
            } catch (Throwable $error) {
                $errores++;

                $this->error(
                    "ERROR    {$archivo->getFilename()}: {$error->getMessage()}"
                );
            }
        }

        $this->newLine();
        $this->table(
            [
                'Indicador',
                'Resultado',
            ],
            [
                [
                    'Imágenes procesadas',
                    $procesadas,
                ],
                [
                    'Imágenes omitidas',
                    $omitidas,
                ],
                [
                    'Errores',
                    $errores,
                ],
                [
                    'Peso de originales',
                    $this->formatearBytes(
                        $bytesOriginales
                    ),
                ],
                [
                    'Peso total 240 + 480 + 640',
                    $this->formatearBytes(
                        $bytesOptimizados
                    ),
                ],
            ]
        );

        if ($errores > 0) {
            $this->warn(
                'El proceso terminó, pero algunas imágenes no pudieron convertirse.'
            );

            return self::FAILURE;
        }

        $this->info(
            'Las imágenes optimizadas fueron generadas correctamente.'
        );

        return self::SUCCESS;
    }

    /**
     * Carga una imagen mediante GD según su extensión.
     *
     * @return \GdImage
     */
    private function cargarImagen(
        string $ruta,
        string $extension
    ): \GdImage {
        $imagen = match ($extension) {
            'jpg', 'jpeg' => imagecreatefromjpeg(
                $ruta
            ),
            'png' => imagecreatefrompng(
                $ruta
            ),
            'webp' => imagecreatefromwebp(
                $ruta
            ),
            default => false,
        };

        if (! $imagen instanceof \GdImage) {
            throw new RuntimeException(
                'GD no pudo abrir el archivo.'
            );
        }

        return $imagen;
    }

    /**
     * Corrige fotografías JPEG que dependen de la orientación EXIF.
     *
     * @param \GdImage $imagen
     * @return \GdImage
     */
    private function corregirOrientacionExif(
        \GdImage $imagen,
        string $ruta,
        string $extension
    ): \GdImage {
        if (
            ! in_array(
                $extension,
                [
                    'jpg',
                    'jpeg',
                ],
                true
            )
            || ! function_exists('exif_read_data')
        ) {
            return $imagen;
        }

        $exif = @exif_read_data(
            $ruta
        );

        $orientacion = (int) (
            $exif['Orientation'] ?? 1
        );

        $angulo = match ($orientacion) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angulo === 0) {
            return $imagen;
        }

        $rotada = imagerotate(
            $imagen,
            $angulo,
            0
        );

        if (! $rotada instanceof \GdImage) {
            return $imagen;
        }

        imagedestroy($imagen);

        return $rotada;
    }

    /**
     * Recorta desde el centro en proporción 4:3 y redimensiona.
     */
    private function crearMiniaturaCuatroTres(
        \GdImage $origen,
        string $rutaDestino,
        int $anchoDestino,
        int $altoDestino,
        int $calidad
    ): void {
        $anchoOrigen = imagesx(
            $origen
        );

        $altoOrigen = imagesy(
            $origen
        );

        if (
            $anchoOrigen <= 0
            || $altoOrigen <= 0
        ) {
            throw new RuntimeException(
                'La imagen tiene dimensiones inválidas.'
            );
        }

        $proporcionDestino =
            $anchoDestino / $altoDestino;

        $proporcionOrigen =
            $anchoOrigen / $altoOrigen;

        $origenX = 0;
        $origenY = 0;
        $anchoRecorte = $anchoOrigen;
        $altoRecorte = $altoOrigen;

        if (
            $proporcionOrigen
            > $proporcionDestino
        ) {
            $anchoRecorte = (int) round(
                $altoOrigen
                * $proporcionDestino
            );

            $origenX = (int) floor(
                ($anchoOrigen - $anchoRecorte)
                / 2
            );
        } else {
            $altoRecorte = (int) round(
                $anchoOrigen
                / $proporcionDestino
            );

            $origenY = (int) floor(
                ($altoOrigen - $altoRecorte)
                / 2
            );
        }

        $destino = imagecreatetruecolor(
            $anchoDestino,
            $altoDestino
        );

        if (! $destino instanceof \GdImage) {
            throw new RuntimeException(
                'No se pudo crear el lienzo de destino.'
            );
        }

        imagealphablending(
            $destino,
            false
        );

        imagesavealpha(
            $destino,
            true
        );

        $transparente = imagecolorallocatealpha(
            $destino,
            0,
            0,
            0,
            127
        );

        imagefilledrectangle(
            $destino,
            0,
            0,
            $anchoDestino,
            $altoDestino,
            $transparente
        );

        $copiada = imagecopyresampled(
            $destino,
            $origen,
            0,
            0,
            $origenX,
            $origenY,
            $anchoDestino,
            $altoDestino,
            $anchoRecorte,
            $altoRecorte
        );

        if (! $copiada) {
            imagedestroy($destino);

            throw new RuntimeException(
                'No se pudo redimensionar la imagen.'
            );
        }

        $guardada = imagewebp(
            $destino,
            $rutaDestino,
            $calidad
        );

        imagedestroy($destino);

        if (! $guardada) {
            throw new RuntimeException(
                'No se pudo guardar el archivo WebP.'
            );
        }
    }

    private function formatearBytes(
        int $bytes
    ): string {
        if ($bytes < 1024) {
            return "{$bytes} B";
        }

        if ($bytes < 1024 * 1024) {
            return number_format(
                $bytes / 1024,
                2,
                ',',
                '.'
            ) . ' KiB';
        }

        return number_format(
            $bytes / (1024 * 1024),
            2,
            ',',
            '.'
        ) . ' MiB';
    }
}
