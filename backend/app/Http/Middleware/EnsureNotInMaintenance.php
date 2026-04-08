<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotInMaintenance
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $isAdminLike = $user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin');
        if ($isAdminLike) {
            return $next($request);
        }

        $maintenanceMode = (bool) optional(SystemSetting::first())->maintenance_mode;
        if (!$maintenanceMode) {
            return $next($request);
        }

        if ($request->is('api/logout')) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Sistem sedang dalam mode maintenance. Silakan coba kembali setelah maintenance selesai.',
        ], 503);
    }
}
