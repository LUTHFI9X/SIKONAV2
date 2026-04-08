<?php

namespace App\Http\Controllers;

use App\Models\RolePermission;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    private function authorizeAdminLike(Request $request): void
    {
        $user = $request->user();
        $isAdminLike = $user && ($user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin'));

        abort_unless($isAdminLike, 403, 'Unauthorized');
    }

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

    public function index(Request $request)
    {
        $this->authorizeAdminLike($request);

        foreach (self::DEFAULT_PERMISSIONS as $roleKey => $permissions) {
            RolePermission::firstOrCreate(
                ['role_key' => $roleKey],
                ['permissions' => $permissions]
            );
        }

        $items = RolePermission::query()
            ->orderBy('role_key')
            ->get(['role_key', 'permissions', 'updated_at']);

        return response()->json([
            'permissions' => $items->mapWithKeys(function (RolePermission $item) {
                return [$item->role_key => $item->permissions ?? []];
            }),
            'meta' => [
                'updated_at' => optional($items->max('updated_at'))->toIso8601String(),
            ],
        ]);
    }

    public function upsert(Request $request)
    {
        $this->authorizeAdminLike($request);

        $validated = $request->validate([
            'role_key' => 'required|string|max:50',
            'permissions' => 'required|array',
        ]);

        $record = RolePermission::updateOrCreate(
            ['role_key' => $validated['role_key']],
            [
                'permissions' => $validated['permissions'],
                'updated_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Hak akses berhasil disimpan.',
            'role_key' => $record->role_key,
            'permissions' => $record->permissions,
        ]);
    }
}
