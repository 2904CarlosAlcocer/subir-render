<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'rol',
        'estado',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Convierte cualquier variante del rol al nombre interno.
     */
    public static function normalizarRol(?string $rol): string
    {
        $rol = strtolower(trim((string) $rol));

        return match ($rol) {
            'admin', 'administrador' => 'admin',
            'cocina', 'cocinero', 'chef' => 'cocina',
            'caja', 'cajero' => 'caja',
            'cliente' => 'cliente',
            default => $rol,
        };
    }

    public function rolNormalizado(): string
    {
        return self::normalizarRol($this->rol);
    }

    public function cliente()
    {
        return $this->hasOne(Cliente::class, 'user_id');
    }

    public function esCliente(): bool
    {
        return $this->rolNormalizado() === 'cliente';
    }

    public function esPersonal(): bool
    {
        return in_array($this->rolNormalizado(), ['admin', 'cocina', 'caja'], true);
    }

    public function esAdmin(): bool
    {
        return $this->rolNormalizado() === 'admin';
    }

    /**
     * |--------------------------------------------------------------------------
     * | RELACIONES DE CAJA
     * |--------------------------------------------------------------------------
     */

    /**
     * Sesiones de caja que este usuario ha abierto.
     */
    public function cajasAbiertas()
    {
        return $this->hasMany(CajaSesion::class, 'usuario_apertura_id');
    }

    /**
     * Sesiones de caja que este usuario ha cerrado.
     */
    public function cajasCerradas()
    {
        return $this->hasMany(CajaSesion::class, 'usuario_cierre_id');
    }

    /**
     * Sesiones de caja que este usuario tiene asignadas para trabajar.
     */
    public function cajasAsignadas()
    {
        return $this->hasMany(CajaSesion::class, 'usuario_asignado_id');
    }

    /**
     * Caja actualmente abierta y asignada a este usuario.
     */
    public function cajaActiva()
    {
        return $this->hasOne(CajaSesion::class, 'usuario_asignado_id')
            ->where('estado', 'abierta');
    }

    /**
     * Verifica si el usuario tiene una caja asignada actualmente.
     */
    public function tieneCajaAsignada(): bool
    {
        return $this->cajaActiva()->exists();
    }

    /**
     * Movimientos de caja registrados por este usuario.
     */
    public function movimientosCaja()
    {
        return $this->hasMany(CajaMovimiento::class, 'usuario_id');
    }
}