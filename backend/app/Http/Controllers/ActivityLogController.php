<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    private function authorizeAdminLike(Request $request): void
    {
        $user = $request->user();
        $isAdminLike = $user && ($user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin'));

        abort_unless($isAdminLike, 403, 'Unauthorized');
    }

    public function index(Request $request)
    {
        $this->authorizeAdminLike($request);

        $query = ActivityLog::query()->orderBy('created_at', 'desc');

        if ($request->has('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('event_type', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }

    public function stats(Request $request)
    {
        $this->authorizeAdminLike($request);

        return response()->json([
            'total' => ActivityLog::count(),
            'today' => ActivityLog::whereDate('created_at', today())->count(),
            'logins_today' => ActivityLog::whereDate('created_at', today())->where('event_type', 'login_success')->count(),
            'failed_logins_today' => ActivityLog::whereDate('created_at', today())->where('event_type', 'login_failed')->count(),
        ]);
    }
}
