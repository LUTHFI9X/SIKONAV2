<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    private function authorizeAdminLike(Request $request): void
    {
        $user = $request->user();
        $isAdminLike = $user && ($user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin'));

        abort_unless($isAdminLike, 403, 'Unauthorized');
    }

    public function show(Request $request)
    {
        $this->authorizeAdminLike($request);

        $settings = SystemSetting::first();

        if (!$settings) {
            $settings = SystemSetting::create([]);
        }

        return response()->json(['settings' => $settings]);
    }

    public function update(Request $request)
    {
        $this->authorizeAdminLike($request);

        $validated = $request->validate([
            'nama_instansi' => 'required|string|max:255',
            'email_admin' => 'nullable|email|max:255',
            'periode_audit' => 'nullable|string|max:100',
            'max_upload_size_mb' => 'required|integer|min:1|max:1024',
            'allowed_file_types' => 'required|string|max:255',
            'session_timeout_minutes' => 'required|integer|min:1|max:1440',
            'maintenance_mode' => 'required|boolean',
            'email_notification' => 'required|boolean',
            'auto_backup' => 'required|boolean',
            'backup_frequency' => 'required|in:daily,weekly,monthly',
            'max_login_attempts' => 'required|integer|min:1|max:20',
            'password_min_length' => 'required|integer|min:8|max:128',
        ]);

        $settings = SystemSetting::first();

        if (!$settings) {
            $settings = new SystemSetting();
        }

        $settings->fill($validated);
        $settings->updated_by = $request->user()->id;
        $settings->save();

        return response()->json([
            'message' => 'Pengaturan sistem berhasil disimpan.',
            'settings' => $settings,
        ]);
    }
}
