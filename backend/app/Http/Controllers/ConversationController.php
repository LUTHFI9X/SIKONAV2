<?php

namespace App\Http\Controllers;

use App\Events\ConversationUpdated;
use App\Models\AuditProcess;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $conversations = Conversation::with([
            'auditee',
            'auditor',
            'latestMessage',
            'firstMessage',
            'auditProcess' => function ($query) {
                $query->withCount([
                    'notes as pesan_spi_count' => function ($q) {
                        $q->where('note_type', 'pesan_spi');
                    },
                    'notes as tindak_lanjut_count' => function ($q) {
                        $q->where('note_type', 'tindak_lanjut');
                    },
                ]);
            },
        ])
            ->where(function ($query) use ($user) {
                $query->where('auditee_id', $user->id)
                    ->orWhere('auditor_id', $user->id);
            })
            ->orderByDesc('last_message_at')
            ->get();

        // Backfill old conversations so status/proses pages share the same realtime source.
        $conversations->each(function (Conversation $conversation) {
            $this->ensureAuditProcessExists($conversation);
        });

        return response()->json(['conversations' => $conversations->load('auditProcess')]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'auditor_id' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'is_anonymous' => 'nullable|boolean',
        ]);

        $user = $request->user();

        if ($user->role === 'auditee' && !$this->withinOperationalHours()) {
            return response()->json([
                'message' => 'Pengajuan konsultasi hanya dapat dilakukan pada jam operasional 07:45 - 16:30.',
            ], 422);
        }

        $conversation = Conversation::create([
            'auditee_id' => $user->id,
            'auditor_id' => $request->auditor_id,
            'subject' => $request->subject,
            'is_anonymous' => $user->role === 'auditee' && $request->boolean('is_anonymous'),
        ]);

        $this->ensureAuditProcessExists($conversation);

        $this->broadcastConversationUpdate($conversation, 'conversation.created', [
            'created_by' => $user->id,
        ]);

        return response()->json([
            'conversation' => $conversation->load([
                'auditee',
                'auditor',
                'firstMessage',
                'auditProcess' => function ($query) {
                    $query->withCount([
                        'notes as pesan_spi_count' => function ($q) {
                            $q->where('note_type', 'pesan_spi');
                        },
                        'notes as tindak_lanjut_count' => function ($q) {
                            $q->where('note_type', 'tindak_lanjut');
                        },
                    ]);
                },
            ]),
        ], 201);
    }

    private function withinOperationalHours(): bool
    {
        $now = Carbon::now(config('app.timezone'));
        $currentMinutes = ($now->hour * 60) + $now->minute;
        $startMinutes = (7 * 60) + 45;
        $endMinutes = (16 * 60) + 30;

        return $currentMinutes >= $startMinutes && $currentMinutes <= $endMinutes;
    }

    private function ensureAuditProcessExists(Conversation $conversation): void
    {
        $auditorBiro = $conversation->auditor?->biro;
        $subjectBiro = $conversation->subject;
        $biro = $auditorBiro ?: $subjectBiro;

        $existing = AuditProcess::query()
            ->where('conversation_id', $conversation->id)
            ->first();

        if ($existing) {
            return;
        }

        $legacy = AuditProcess::query()
            ->whereNull('conversation_id')
            ->where('auditee_id', $conversation->auditee_id)
            ->where('auditor_id', $conversation->auditor_id)
            ->where(function ($q) use ($biro) {
                $q->where('biro', $biro)->orWhereNull('biro');
            })
            ->orderByDesc('id')
            ->first();

        if ($legacy) {
            $legacy->update([
                'conversation_id' => $conversation->id,
                'biro' => $legacy->biro ?: $biro,
            ]);
            return;
        }

        AuditProcess::create([
            'conversation_id' => $conversation->id,
            'auditee_id' => $conversation->auditee_id,
            'auditor_id' => $conversation->auditor_id,
            'biro' => $biro,
            'tahun_audit' => (string) now()->year,
            'status' => 'pending',
        ]);
    }

    public function show(Conversation $conversation, Request $request)
    {
        $user = $request->user();

        if ($conversation->auditee_id !== $user->id && $conversation->auditor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Mark messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'conversation' => $conversation->load([
                'auditee',
                'auditor',
                'messages.sender',
                'firstMessage',
                'auditProcess' => function ($query) {
                    $query->withCount([
                        'notes as pesan_spi_count' => function ($q) {
                            $q->where('note_type', 'pesan_spi');
                        },
                        'notes as tindak_lanjut_count' => function ($q) {
                            $q->where('note_type', 'tindak_lanjut');
                        },
                    ]);
                },
            ]),
        ]);
    }

    public function updateStatus(Conversation $conversation, Request $request)
    {
        $user = $request->user();

        if (
            !($user->role === 'auditor' && $conversation->auditor_id === $user->id) &&
            $user->role !== 'manajemen'
        ) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,closed,archived',
        ]);

        $conversation->update([
            'status' => $validated['status'],
        ]);

        $mappedAuditStatus = match ($validated['status']) {
            'closed' => 'completed',
            'archived' => 'cancelled',
            default => 'in_progress',
        };

        AuditProcess::query()
            ->where('conversation_id', $conversation->id)
            ->update(['status' => $mappedAuditStatus]);

        $this->broadcastConversationUpdate($conversation, 'status.updated', [
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'conversation' => $conversation->load([
                'auditee',
                'auditor',
                'latestMessage',
                'firstMessage',
                'auditProcess' => function ($query) {
                    $query->withCount([
                        'notes as pesan_spi_count' => function ($q) {
                            $q->where('note_type', 'pesan_spi');
                        },
                        'notes as tindak_lanjut_count' => function ($q) {
                            $q->where('note_type', 'tindak_lanjut');
                        },
                    ]);
                },
            ]),
        ]);
    }

    public function getAuditors(Request $request)
    {
        $auditors = User::where('role', 'auditor')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'biro', 'is_online', 'avatar')
            ->get();

        return response()->json(['auditors' => $auditors]);
    }

    public function getAuditees(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'auditee') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditees = User::where('role', 'auditee')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'department', 'is_online', 'avatar')
            ->get();

        return response()->json(['auditees' => $auditees]);
    }

    private function broadcastConversationUpdate(Conversation $conversation, string $eventType, array $meta = []): void
    {
        if (!$this->shouldBroadcastRealtime()) {
            return;
        }

        try {
            broadcast(new ConversationUpdated($conversation->fresh(), $eventType, $meta));
        } catch (\Throwable $exception) {
            Log::warning('Conversation broadcast failed; request will continue.', [
                'conversation_id' => $conversation->id,
                'event_type' => $eventType,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function shouldBroadcastRealtime(): bool
    {
        if ((string) config('broadcasting.default') !== 'reverb') {
            return false;
        }

        $reverbHost = trim((string) config('broadcasting.connections.reverb.options.host', ''));
        if ($reverbHost === '') {
            return false;
        }

        $requestHost = request()->getHost();
        if ($requestHost && strcasecmp($reverbHost, $requestHost) === 0) {
            return false;
        }

        $appHost = parse_url((string) config('app.url', ''), PHP_URL_HOST);
        if ($appHost && strcasecmp($reverbHost, $appHost) === 0) {
            return false;
        }

        return true;
    }
}
