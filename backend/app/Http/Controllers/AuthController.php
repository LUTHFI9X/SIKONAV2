<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Models\PasswordHistory;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Password complexity regex:
     * min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
     */
    private const PASSWORD_REGEX = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/';

    /**
     * Common/weak passwords blacklist (filter password mudah ditebak)
     */
    private const WEAK_PASSWORDS = [
        'password', 'Password1!', '12345678', 'qwerty123', 'admin123',
        'letmein1', 'welcome1', 'monkey123', 'dragon12', 'master12',
        'sikona123', 'Sikona123!', 'auditor1', 'Auditor1!', 'auditee1',
    ];

    private function isAdminLike(User $user): bool
    {
        return $user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin');
    }

    private function realtimeConfigPayload(): array
    {
        $key = (string) config('broadcasting.connections.reverb.key', '');
        $host = (string) config('broadcasting.connections.reverb.options.host', '');
        $port = (int) config('broadcasting.connections.reverb.options.port', 443);
        $scheme = (string) config('broadcasting.connections.reverb.options.scheme', 'https');

        return [
            'enabled' => $key !== '' && $host !== '',
            'key' => $key !== '' ? $key : null,
            'host' => $host !== '' ? $host : null,
            'port' => $port > 0 ? $port : 443,
            'scheme' => $scheme === 'http' ? 'http' : 'https',
        ];
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:' . self::PASSWORD_REGEX],
            'role' => 'required|in:auditee,auditor,manajemen',
            'sub_role' => 'nullable|in:admin,kspi,komite',
            'department' => 'nullable|string|max:255',
            'biro' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ], [
            'password.regex' => 'Password harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus.',
        ]);

        // Filter password mudah ditebak
        if (in_array(strtolower($request->password), array_map('strtolower', self::WEAK_PASSWORDS))) {
            throw ValidationException::withMessages([
                'password' => ['Password terlalu mudah ditebak. Gunakan password yang lebih kompleks.'],
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'sub_role' => $request->sub_role,
            'department' => $request->department,
            'biro' => $request->biro,
            'phone' => $request->phone,
            'must_change_password' => true,
            'password_changed_at' => now(),
        ]);

        // Store initial password in history
        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $user->password,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::record('user_registered', "User '{$user->name}' registered", $request, $user, 'User', $user->id);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function loginOptions()
    {
        $users = User::query()
            ->where('is_active', true)
            ->whereIn('role', ['admin', 'auditor', 'manajemen'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'sub_role', 'biro']);

        $admins = $users
            ->where('role', 'admin')
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        $auditors = $users
            ->where('role', 'auditor')
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'biro' => $user->biro,
            ])
            ->values();

        $managements = $users
            ->where('role', 'manajemen')
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'sub_role' => $user->sub_role,
            ])
            ->values();

        return response()->json([
            'admins' => $admins,
            'auditors' => $auditors,
            'managements' => $managements,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'nullable|string|email',
            'password' => 'required|string',
            'role' => 'nullable|in:admin,auditee,auditor,manajemen',
            'sub_role' => 'nullable|in:kspi,komite',
            'biro' => 'nullable|string|max:255',
        ]);

        $email = $request->input('email');
        $role = $request->input('role');
        $subRole = $request->input('sub_role');
        $biro = $request->input('biro');

        $user = null;

        if ($email) {
            $user = User::where('email', $email)->first();
        } elseif ($role === 'auditor' && $biro) {
            $user = User::where('role', 'auditor')
                ->where('biro', $biro)
                ->first();
        } elseif ($role === 'manajemen' && $subRole) {
            $user = User::where('role', 'manajemen')
                ->where('sub_role', $subRole)
                ->first();
        }

        // Generic error — do NOT reveal whether email exists or password is wrong
        $genericError = 'Kredensial yang diberikan tidak valid.';

        if (!$email && in_array($role, ['admin', 'auditee'], true)) {
            throw ValidationException::withMessages([
                'credentials' => ['Email wajib diisi untuk role ini.'],
            ]);
        }

        if (!$email && $role === 'auditor' && !$biro) {
            throw ValidationException::withMessages([
                'credentials' => ['Silakan pilih Biro Auditor.'],
            ]);
        }

        if (!$email && $role === 'manajemen' && !$subRole) {
            throw ValidationException::withMessages([
                'credentials' => ['Silakan pilih Tipe Manajemen.'],
            ]);
        }

        if (!$user) {
            ActivityLog::record('login_failed', "Login failed — unknown credential attempted", $request, null, null, null, [
                'email' => $email,
                'role' => $role,
                'sub_role' => $subRole,
                'biro' => $biro,
            ]);
            throw ValidationException::withMessages([
                'credentials' => [$genericError],
            ]);
        }

        // Check if account is locked (3x wrong password)
        if ($user->isLocked()) {
            $minutesLeft = now()->diffInMinutes($user->locked_until, false);
            ActivityLog::record('login_blocked', "Login blocked — account locked for user '{$user->name}'", $request, $user, 'User', $user->id);
            throw ValidationException::withMessages([
                'credentials' => ["Akun Anda telah dikunci karena 3 kali percobaan gagal. Silakan coba lagi dalam {$minutesLeft} menit atau hubungi Administrator."],
            ]);
        }

        // Check password
        if (!Hash::check($request->password, $user->password)) {
            $user->incrementFailedAttempts();
            $attemptsLeft = max(0, 3 - $user->failed_login_attempts);
            ActivityLog::record('login_failed', "Login failed — wrong password for user '{$user->name}' (attempt #{$user->failed_login_attempts})", $request, $user, 'User', $user->id);

            if ($attemptsLeft === 0) {
                throw ValidationException::withMessages([
                    'credentials' => ['Akun Anda telah dikunci karena 3 kali percobaan gagal. Hubungi Administrator untuk mengaktifkan kembali.'],
                ]);
            }

            throw ValidationException::withMessages([
                'credentials' => [$genericError . " Sisa percobaan: {$attemptsLeft}."],
            ]);
        }

        // Check if account is active
        if (!$user->is_active) {
            ActivityLog::record('login_failed', "Login failed — inactive account '{$user->name}'", $request, $user, 'User', $user->id);
            throw ValidationException::withMessages([
                'credentials' => ['Akun Anda tidak aktif. Hubungi Administrator untuk aktivasi.'],
            ]);
        }

        $maintenanceMode = (bool) optional(SystemSetting::first())->maintenance_mode;
        if ($maintenanceMode && !$this->isAdminLike($user)) {
            ActivityLog::record('login_blocked', "Login blocked — maintenance mode for user '{$user->name}'", $request, $user, 'User', $user->id);
            throw ValidationException::withMessages([
                'credentials' => ['Sistem sedang dalam mode maintenance. Hanya admin yang dapat login sementara waktu.'],
            ]);
        }

        // Reset failed attempts on successful login
        $user->resetFailedAttempts();

        // Check password expiry (90 days)
        $passwordExpired = $user->isPasswordExpired();

        // Update online status
        $user->update([
            'is_online' => true,
            'last_seen_at' => now(),
        ]);

        // Limit concurrent sessions: revoke all previous tokens
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::record('login_success', "User '{$user->name}' logged in successfully", $request, $user, 'User', $user->id);

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
            'must_change_password' => $user->must_change_password,
            'password_expired' => $passwordExpired,
            'realtime' => $this->realtimeConfigPayload(),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $user->update([
            'is_online' => false,
            'last_seen_at' => now(),
        ]);

        ActivityLog::record('logout', "User '{$user->name}' logged out", $request, $user, 'User', $user->id);

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => $user,
            'must_change_password' => $user->must_change_password,
            'password_expired' => $user->isPasswordExpired(),
            'realtime' => $this->realtimeConfigPayload(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:255',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();
        $oldData = $user->only(['name', 'phone', 'department']);

        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $avatarPath;
        }

        $user->fill($request->only(['name', 'phone', 'department']));
        $user->save();

        ActivityLog::record('profile_updated', "User '{$user->name}' updated profile", $request, $user, 'User', $user->id, [
            'old' => $oldData,
            'new' => $user->only(['name', 'phone', 'department']),
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:' . self::PASSWORD_REGEX],
        ], [
            'password.regex' => 'Password harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password lama tidak sesuai.'],
            ]);
        }

        // Filter password mudah ditebak
        if (in_array(strtolower($request->password), array_map('strtolower', self::WEAK_PASSWORDS))) {
            throw ValidationException::withMessages([
                'password' => ['Password terlalu mudah ditebak. Gunakan password yang lebih kompleks.'],
            ]);
        }

        // Check password history (cannot reuse last 3 passwords)
        $recentPasswords = PasswordHistory::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();

        foreach ($recentPasswords as $history) {
            if (Hash::check($request->password, $history->password_hash)) {
                throw ValidationException::withMessages([
                    'password' => ['Password ini sudah pernah digunakan. Gunakan password baru yang berbeda dari 3 password terakhir.'],
                ]);
            }
        }

        $newHash = Hash::make($request->password);

        $user->update([
            'password' => $newHash,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        // Store in password history
        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $newHash,
        ]);

        ActivityLog::record('password_changed', "User '{$user->name}' changed password", $request, $user, 'User', $user->id);

        return response()->json([
            'message' => 'Password berhasil diubah.',
        ]);
    }

    public function toggleOnlineStatus(Request $request)
    {
        $user = $request->user();
        $user->update([
            'is_online' => !$user->is_online,
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'message' => 'Status updated',
            'is_online' => $user->is_online,
        ]);
    }
}
