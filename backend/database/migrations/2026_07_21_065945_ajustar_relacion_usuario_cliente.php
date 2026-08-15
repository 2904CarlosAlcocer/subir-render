<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | VERIFICAR USER_ID DUPLICADOS
        |--------------------------------------------------------------------------
        */

        $userIdsDuplicados = DB::table('clientes')
            ->select('user_id')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($userIdsDuplicados) {
            throw new \RuntimeException(
                'Existen varios clientes relacionados con el mismo user_id.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR USER_ID SIN USUARIO
        |--------------------------------------------------------------------------
        |
        | Evita crear la llave foránea si existen clientes relacionados con
        | usuarios que ya no existen.
        |
        */

        $usuariosInexistentes = DB::table('clientes')
            ->leftJoin(
                'users',
                'clientes.user_id',
                '=',
                'users.id'
            )
            ->whereNotNull('clientes.user_id')
            ->whereNull('users.id')
            ->exists();

        if ($usuariosInexistentes) {
            throw new \RuntimeException(
                'Existen clientes con un user_id que no pertenece a ningún usuario.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VERIFICAR CORREOS DUPLICADOS
        |--------------------------------------------------------------------------
        */

        $correosDuplicados = DB::table('clientes')
            ->selectRaw(
                'LOWER(TRIM(correo)) AS correo_normalizado'
            )
            ->whereNotNull('correo')
            ->whereRaw("TRIM(correo) <> ''")
            ->groupByRaw('LOWER(TRIM(correo))')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($correosDuplicados) {
            throw new \RuntimeException(
                'Existen clientes con correos electrónicos duplicados.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR CORREOS
        |--------------------------------------------------------------------------
        */

        DB::table('clientes')
            ->whereNotNull('correo')
            ->whereRaw("TRIM(correo) = ''")
            ->update([
                'correo' => null,
            ]);

        DB::table('clientes')
            ->whereNotNull('correo')
            ->update([
                'correo' => DB::raw(
                    'LOWER(TRIM(correo))'
                ),
            ]);

        /*
        |--------------------------------------------------------------------------
        | ELIMINAR LLAVE FORÁNEA ANTERIOR, SI EXISTE
        |--------------------------------------------------------------------------
        |
        | Se consulta el nombre real de la llave en MySQL. Así no se intenta
        | eliminar clientes_user_id_foreign cuando esa llave no existe.
        |
        */

        $foreignKeyActual = $this->foreignKeyDeColumna(
            'clientes',
            'user_id'
        );

        if ($foreignKeyActual !== null) {
            Schema::table(
                'clientes',
                function (Blueprint $table) use ($foreignKeyActual) {
                    $table->dropForeign(
                        $foreignKeyActual
                    );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | USER_ID ÚNICO
        |--------------------------------------------------------------------------
        */

        if (
            !$this->tieneIndiceUnicoDeUnaColumna(
                'clientes',
                'user_id'
            )
        ) {
            Schema::table(
                'clientes',
                function (Blueprint $table) {
                    $table->unique(
                        'user_id',
                        'clientes_user_id_unique'
                    );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CORREO ÚNICO
        |--------------------------------------------------------------------------
        |
        | MySQL permite varios valores NULL en un índice único, por lo que los
        | clientes de mostrador pueden continuar sin correo.
        |
        */

        if (
            !$this->tieneIndiceUnicoDeUnaColumna(
                'clientes',
                'correo'
            )
        ) {
            Schema::table(
                'clientes',
                function (Blueprint $table) {
                    $table->unique(
                        'correo',
                        'clientes_correo_unique'
                    );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREAR LLAVE FORÁNEA
        |--------------------------------------------------------------------------
        |
        | Si se elimina la cuenta, el cliente y sus pedidos se conservan.
        | Únicamente clientes.user_id queda en NULL.
        |
        */

        if (
            $this->foreignKeyDeColumna(
                'clientes',
                'user_id'
            ) === null
        ) {
            Schema::table(
                'clientes',
                function (Blueprint $table) {
                    $table->foreign(
                        'user_id',
                        'clientes_user_id_foreign'
                    )
                        ->references('id')
                        ->on('users')
                        ->nullOnDelete();
                }
            );
        }
    }

    public function down(): void
    {
        $foreignKeyActual = $this->foreignKeyDeColumna(
            'clientes',
            'user_id'
        );

        if ($foreignKeyActual !== null) {
            Schema::table(
                'clientes',
                function (Blueprint $table) use ($foreignKeyActual) {
                    $table->dropForeign(
                        $foreignKeyActual
                    );
                }
            );
        }

        Schema::table(
            'clientes',
            function (Blueprint $table) {
                if (
                    $this->existeIndice(
                        'clientes',
                        'clientes_user_id_unique'
                    )
                ) {
                    $table->dropUnique(
                        'clientes_user_id_unique'
                    );
                }

                if (
                    $this->existeIndice(
                        'clientes',
                        'clientes_correo_unique'
                    )
                ) {
                    $table->dropUnique(
                        'clientes_correo_unique'
                    );
                }
            }
        );

        if (
            $this->foreignKeyDeColumna(
                'clientes',
                'user_id'
            ) === null
        ) {
            Schema::table(
                'clientes',
                function (Blueprint $table) {
                    $table->foreign(
                        'user_id',
                        'clientes_user_id_foreign'
                    )
                        ->references('id')
                        ->on('users')
                        ->cascadeOnDelete();
                }
            );
        }
    }

    /**
     * Obtiene el nombre real de la llave foránea de una columna.
     */
    private function foreignKeyDeColumna(
        string $tabla,
        string $columna
    ): ?string {
        $resultado = DB::selectOne(
            '
                SELECT CONSTRAINT_NAME AS nombre
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ?
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1
            ',
            [
                DB::getDatabaseName(),
                $tabla,
                $columna,
            ]
        );

        return $resultado?->nombre;
    }

    /**
     * Comprueba si existe un índice con un nombre específico.
     */
    private function existeIndice(
        string $tabla,
        string $indice
    ): bool {
        $resultado = DB::selectOne(
            '
                SELECT COUNT(*) AS total
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = ?
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
            ',
            [
                DB::getDatabaseName(),
                $tabla,
                $indice,
            ]
        );

        return (int) ($resultado->total ?? 0) > 0;
    }

    /**
     * Comprueba si la columna ya tiene un índice único individual.
     */
    private function tieneIndiceUnicoDeUnaColumna(
        string $tabla,
        string $columna
    ): bool {
        $resultado = DB::selectOne(
            '
                SELECT s.INDEX_NAME AS nombre
                FROM information_schema.STATISTICS s
                WHERE s.TABLE_SCHEMA = ?
                  AND s.TABLE_NAME = ?
                  AND s.COLUMN_NAME = ?
                  AND s.NON_UNIQUE = 0
                  AND s.INDEX_NAME <> "PRIMARY"
                  AND (
                      SELECT COUNT(*)
                      FROM information_schema.STATISTICS x
                      WHERE x.TABLE_SCHEMA = s.TABLE_SCHEMA
                        AND x.TABLE_NAME = s.TABLE_NAME
                        AND x.INDEX_NAME = s.INDEX_NAME
                  ) = 1
                LIMIT 1
            ',
            [
                DB::getDatabaseName(),
                $tabla,
                $columna,
            ]
        );

        return $resultado !== null;
    }
};