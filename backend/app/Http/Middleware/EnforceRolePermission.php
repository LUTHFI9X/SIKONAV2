<?php

namespace App\Http\Middleware;

use App\Models\RolePermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceRolePermission
{
    private const DEFAULT_PERMISSIONS = [
        'auditee' => [
            'dashboard' => ['view'],
            'konsultasi' => ['view', 'create'],
            'status_audit' => ['view'],
            'proses_audit' => ['view', 'create'],
            'profil_spi' => ['view'],
            'kelola_user' => [],
            'pengaturan' => [],
            'log_aktivitas' => [],
            'backup' => [],
        ],
        'auditor' => [
            'dashboard' => ['view'],
            'konsultasi' => ['view', 'create'],
            'status_audit' => ['view', 'edit'],
            'proses_audit' => ['view', 'create', 'edit', 'delete'],
            'profil_spi' => ['view'],
            'kelola_user' => [],
            'pengaturan' => [],
            'log_aktivitas' => [],
            'backup' => [],
        ],
        'kspi' => [
            'dashboard' => ['view'],
            'konsultasi' => ['view'],
            'status_audit' => ['view'],
            'proses_audit' => ['view'],
            'profil_spi' => ['view'],
            'kelola_user' => [],
            'pengaturan' => [],
            'log_aktivitas' => [],
            'backup' => [],
        ],
        'admin' => [
            'dashboard' => ['view'],
            'konsultasi' => [],
            'status_audit' => [],
            'proses_audit' => [],
            'profil_spi' => [],
            'kelola_user' => ['view', 'create', 'edit', 'delete'],
            'pengaturan' => ['view', 'edit'],
            'log_aktivitas' => ['view'],
            'backup' => ['view', 'create'],
        ],
        'komiteaudit' => [
            'dashboard' => ['view'],
            'konsultasi' => ['view'],
            'status_audit' => ['view'],
            'proses_audit' => ['view'],
            'profil_spi' => ['view'],
            'kelola_user' => [],
            'pengaturan' => [],
            'log_aktivitas' => [],
            'backup' => [],
        ],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $module = $this->resolveModule($request);
        if (!$module) {
            return $next($request);
        }

        $action = $this->resolveAction($request);
        $roleKey = $this->resolveRoleKey($user->role, $user->sub_role);

        $permissions = RolePermission::query()
            ->where('role_key', $roleKey)
            ->value('permissions');

        if (!is_array($permissions)) {
            $permissions = self::DEFAULT_PERMISSIONS[$roleKey] ?? [];
        }

        $allowedActions = $permissions[$module] ?? [];
        if (in_array($action, $allowedActions, true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Akses ditolak: hak akses role tidak mengizinkan aksi ini.',
            'module' => $module,
            'action' => $action,
        ], 403);
    }

    private function resolveRoleKey(string $role, ?string $subRole): string
    {
        if ($role === 'admin') {
            return 'admin';
        }

        if ($role !== 'manajemen') {
            return $role;
        }

        return match ($subRole) {
            'admin' => 'admin',
            'kspi' => 'kspi',
            'komite' => 'komiteaudit',
            default => 'kspi',
        };
    }

    private function resolveAction(Request $request): string
    {
        return match (strtoupper($request->method())) {
            'GET', 'HEAD' => 'view',
            'POST' => 'create',
            'PUT', 'PATCH' => 'edit',
            'DELETE' => 'delete',
            default => 'view',
        };
    }

    private function resolveModule(Request $request): ?string
    {
        $path = trim($request->path(), '/');
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }

        if (in_array($path, ['logout', 'me', 'profile', 'password', 'toggle-online'], true)) {
            return null;
        }

        if ($path === 'users-stats' || str_starts_with($path, 'users')) {
            return 'kelola_user';
        }

        if (in_array($path, ['auditors', 'auditees', 'available-auditors', 'available-auditees'], true)) {
            return 'konsultasi';
        }

        // Status updates from chat should follow status_audit edit permissions.
        if (preg_match('#^conversations/[^/]+/status$#', $path)) {
            return 'status_audit';
        }

        // Attachment downloads from Status Audit detail should follow status_audit view permissions.
        if (preg_match('#^messages/[^/]+/download$#', $path)) {
            return 'status_audit';
        }

        if (str_starts_with($path, 'activity-logs')) {
            return 'log_aktivitas';
        }

        if (str_starts_with($path, 'conversations') || str_starts_with($path, 'messages')) {
            return 'konsultasi';
        }

        if (str_starts_with($path, 'audit-processes') || $path === 'audit-stats') {
            return 'proses_audit';
        }

        if (str_starts_with($path, 'spi-profile')) {
            return 'profil_spi';
        }

        if (str_starts_with($path, 'backups')) {
            return 'backup';
        }

        if ($path === 'system-settings' || $path === 'role-permissions') {
            return 'pengaturan';
        }

        return null;
    }
}
