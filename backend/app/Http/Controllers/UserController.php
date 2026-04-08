<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Models\PasswordHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private const PASSWORD_REGEX = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/';

    private function authorizeAdminLike(Request $request): void
    {
        $user = $request->user();
        $isAdminLike = $user && ($user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin'));

        abort_unless($isAdminLike, 403, 'Unauthorized');
    }

    private function authorizeNonAuditee(Request $request): void
    {
        $user = $request->user();
        abort_unless($user && $user->role !== 'auditee', 403, 'Unauthorized');
    }

    public function index(Request $request)
    {
        $this->authorizeAdminLike($request);

        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('biro')) {
            $query->where('biro', $request->biro);
        }

        if ($request->has('department')) {
            $query->where('department', 'like', '%' . $request->department . '%');
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->get();

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdminLike($request);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', 'min:8', 'regex:' . self::PASSWORD_REGEX],
            'role' => 'required|in:auditee,auditor,manajemen',
            'sub_role' => 'nullable|in:admin,kspi,komite',
            'department' => 'nullable|string|max:255',
            'biro' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ], [
            'password.regex' => 'Password harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus.',
        ]);

        $hashedPassword = Hash::make($request->password);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $hashedPassword,
            'role' => $request->role,
            'sub_role' => $request->sub_role,
            'department' => $request->department,
            'biro' => $request->biro,
            'phone' => $request->phone,
            'is_active' => true,
            'must_change_password' => true,
            'password_changed_at' => now(),
        ]);

        // Store initial password in history
        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $hashedPassword,
        ]);

        ActivityLog::record('user_created', "Admin created user '{$user->name}' with role '{$user->role}'", $request, $request->user(), 'User', $user->id, [
            'new_user_email' => $user->email,
            'new_user_role' => $user->role,
        ]);

        return response()->json(['user' => $user], 201);
    }

    public function show(Request $request, User $user)
    {
        $this->authorizeAdminLike($request);

        return response()->json(['user' => $user]);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAdminLike($request);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:auditee,auditor,manajemen',
            'sub_role' => 'nullable|in:admin,kspi,komite',
            'department' => 'nullable|string|max:255',
            'biro' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $oldData = $user->only(['name', 'email', 'role', 'sub_role', 'department', 'biro', 'is_active']);

        $user->update($request->only([
            'name', 'email', 'role', 'sub_role', 'department', 'biro', 'phone', 'is_active'
        ]));

        ActivityLog::record('user_updated', "Admin updated user '{$user->name}'", $request, $request->user(), 'User', $user->id, [
            'old' => $oldData,
            'new' => $user->only(['name', 'email', 'role', 'sub_role', 'department', 'biro', 'is_active']),
        ]);

        return response()->json(['user' => $user]);
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeAdminLike($request);

        ActivityLog::record('user_deleted', "Admin deleted user '{$user->name}' (email: {$user->email})", $request, $request->user(), 'User', $user->id, [
            'deleted_user' => $user->only(['name', 'email', 'role']),
        ]);

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function toggleActive(Request $request, User $user)
    {
        $this->authorizeAdminLike($request);

        $user->update(['is_active' => !$user->is_active]);

        $action = $user->is_active ? 'activated' : 'deactivated';
        ActivityLog::record("user_{$action}", "Admin {$action} user '{$user->name}'", $request, $request->user(), 'User', $user->id);

        return response()->json([
            'message' => 'User status updated',
            'is_active' => $user->is_active,
        ]);
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->authorizeAdminLike($request);

        $request->validate([
            'password' => ['required', 'string', 'min:8', 'regex:' . self::PASSWORD_REGEX],
        ], [
            'password.regex' => 'Password harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus.',
        ]);

        $hashedPassword = Hash::make($request->password);

        $user->update([
            'password' => $hashedPassword,
            'must_change_password' => true,
            'password_changed_at' => now(),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $hashedPassword,
        ]);

        ActivityLog::record('password_reset', "Admin reset password for user '{$user->name}'", $request, $request->user(), 'User', $user->id);

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function unlockAccount(Request $request, User $user)
    {
        $this->authorizeAdminLike($request);

        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        ActivityLog::record('account_unlocked', "Admin unlocked account for user '{$user->name}'", $request, $request->user(), 'User', $user->id);

        return response()->json(['message' => 'Account unlocked successfully']);
    }

    // Get users by role for assignment
    public function auditors(Request $request)
    {
        $auditors = User::where('role', 'auditor')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'biro', 'is_online')
            ->get();

        return response()->json(['auditors' => $auditors]);
    }

    public function auditees(Request $request)
    {
        $this->authorizeNonAuditee($request);

        $auditees = User::where('role', 'auditee')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'department', 'is_online')
            ->get();

        return response()->json(['auditees' => $auditees]);
    }

    // Statistics for dashboard
    public function statistics(Request $request)
    {
        $this->authorizeAdminLike($request);

        return response()->json([
            'total' => User::count(),
            'auditees' => User::where('role', 'auditee')->count(),
            'auditors' => User::where('role', 'auditor')->count(),
            'manajemen' => User::where('role', 'manajemen')->count(),
            'active' => User::where('is_active', true)->count(),
            'online' => User::where('is_online', true)->count(),
            'locked' => User::whereNotNull('locked_until')->where('locked_until', '>', now())->count(),
        ]);
    }
}
