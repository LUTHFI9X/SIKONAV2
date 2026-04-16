<?php

namespace App\Http\Controllers;

use App\Models\AuditProcess;
use App\Models\AuditNote;
use App\Models\AuditProcessDocument;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AuditProcessController extends Controller
{
    private const MAX_TAHAP_KONSULTASI = 13;

    private function canManageAudit(User $user): bool
    {
        if ($user->role === 'auditor') {
            return true;
        }

        if ($user->role === 'manajemen' && $user->sub_role !== 'kspi') {
            return true;
        }

        return false;
    }

    private function isAdminLike(User $user): bool
    {
        return $user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin');
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = AuditProcess::with([
            'auditee',
            'auditor',
            'documents',
            'conversation.firstMessage',
            'conversation.latestMessage',
        ])
            ->withCount([
                'notes as pesan_spi_count' => function ($q) {
                    $q->where('note_type', 'pesan_spi');
                },
                'notes as tindak_lanjut_count' => function ($q) {
                    $q->where('note_type', 'tindak_lanjut');
                },
            ]);

        if ($user->isAuditee()) {
            $query->where('auditee_id', $user->id);
        } elseif ($user->isAuditor()) {
            $query->where(function ($q) use ($user) {
                $q->where('auditor_id', $user->id)
                    ->orWhere(function ($byBiro) use ($user) {
                        $byBiro->whereNull('auditor_id')
                            ->where('biro', $user->biro);
                    });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('biro')) {
            $query->where('biro', $request->biro);
        }

        if ($request->has('tahun')) {
            $query->where('tahun_audit', $request->tahun);
        }

        $processes = $query->orderByDesc('created_at')->get();

        return response()->json(['audit_processes' => $processes]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$this->canManageAudit($user) && !$this->isAdminLike($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'auditee_id' => 'required|exists:users,id',
            'auditor_id' => 'nullable|exists:users,id',
            'biro' => 'nullable|string|max:255',
            'tahun_audit' => 'required|digits:4',
        ]);

        $payload = $request->only(['auditee_id', 'auditor_id', 'biro', 'tahun_audit']);

        if (empty($payload['auditor_id']) && !empty($payload['biro'])) {
            $matchedAuditor = User::query()
                ->where('role', 'auditor')
                ->where('is_active', true)
                ->where('biro', $payload['biro'])
                ->first();

            if ($matchedAuditor) {
                $payload['auditor_id'] = $matchedAuditor->id;
            }
        }

        $process = AuditProcess::create($payload);

        return response()->json(['audit_process' => $process->load(['auditee', 'auditor'])], 201);
    }

    public function show(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'audit_process' => $auditProcess->load(['auditee', 'auditor']),
        ]);
    }

    public function updateTahap(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$this->canManageAudit($request->user())) {
            return response()->json(['message' => 'Anda tidak memiliki izin memperbarui tahapan audit.'], 403);
        }

        if ($auditProcess->status !== 'in_progress') {
            return response()->json([
                'message' => 'Tahapan hanya dapat diperbarui ketika status audit adalah Dalam Proses.',
            ], 422);
        }

        $request->validate([
            'tahap' => 'required|integer|min:1|max:' . self::MAX_TAHAP_KONSULTASI,
            'status' => 'required|in:belum,proses,selesai',
        ]);

        if (!$this->canUploadTahap($request->user(), (int) $request->tahap)) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin memperbarui tahapan ini.',
            ], 403);
        }

        $tahapField = 'tahap_' . $request->tahap . '_' . $this->getTahapName($request->tahap);
        if (!$tahapField || !in_array($tahapField, $auditProcess->getFillable(), true)) {
            return response()->json([
                'message' => 'Perubahan status manual untuk tahap ini belum tersedia. Gunakan upload dokumen untuk menandai progres.',
            ], 422);
        }

        $auditProcess->update([$tahapField => $request->status]);

        return response()->json(['audit_process' => $auditProcess->fresh()]);
    }

    private function getTahapName(int $tahap): string
    {
        $names = [
            1 => 'permintaan', 2 => 'telaah', 3 => 'surat_tugas',
            4 => 'entry_meeting', 5 => 'permintaan_dokumen', 6 => 'pemenuhan_dokumen',
            7 => 'analisa', 8 => 'exit_meeting', 9 => 'draft_lhk', 10 => 'finalisasi',
        ];
        return $names[$tahap] ?? '';
    }

    public function uploadDokumen(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'tahap_no' => 'required|integer|min:1|max:' . self::MAX_TAHAP_KONSULTASI,
            'dokumen' => 'required|file|max:51200', // 50MB max
        ]);

        $tahapNo = (int) $request->tahap_no;

        if (!$this->canUploadTahap($request->user(), $tahapNo)) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin mengunggah dokumen pada tahap ini.',
            ], 403);
        }

        if ($auditProcess->status === 'pending') {
            $auditProcess->update(['status' => 'in_progress']);
        }

        $path = $request->file('dokumen')->store('audit_documents', 'public');
        $file = $request->file('dokumen');

        $document = AuditProcessDocument::updateOrCreate(
            [
                'audit_process_id' => $auditProcess->id,
                'tahap_no' => $tahapNo,
            ],
            [
                'uploaded_by' => $request->user()->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]
        );

        $auditProcess->update(['dokumen_path' => $path]);

        $tahapField = 'tahap_' . $tahapNo . '_' . $this->getTahapName($tahapNo);
        if ($tahapField && in_array($tahapField, $auditProcess->getFillable(), true)) {
            $auditProcess->update([$tahapField => 'selesai']);
        }

        return response()->json([
            'message' => 'Document uploaded successfully',
            'dokumen_path' => $path,
            'document' => $document,
        ]);
    }

    public function getDocuments(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'documents' => $auditProcess->documents()
                ->orderBy('tahap_no')
                ->get(),
        ]);
    }

    public function deleteDocument(Request $request, AuditProcess $auditProcess, int $tahapNo)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $doc = $auditProcess->documents()->where('tahap_no', $tahapNo)->first();

        if (!$doc) {
            return response()->json(['message' => 'Dokumen tidak ditemukan.'], 404);
        }

        if (!$this->canUploadTahap($request->user(), $tahapNo)) {
            return response()->json(['message' => 'Anda tidak memiliki izin menghapus dokumen tahap ini.'], 403);
        }

        Storage::disk('public')->delete($doc->file_path);
        $doc->delete();

        $tahapField = 'tahap_' . $tahapNo . '_' . $this->getTahapName($tahapNo);
        if ($tahapField && in_array($tahapField, $auditProcess->getFillable(), true)) {
            $auditProcess->update([$tahapField => 'belum']);
        }

        return response()->json(['message' => 'Dokumen berhasil dihapus.']);
    }

    public function downloadDocument(Request $request, AuditProcess $auditProcess, int $tahapNo)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke dokumen ini.'], 403);
        }

        $doc = $auditProcess->documents()->where('tahap_no', $tahapNo)->first();
        if (!$doc) {
            return response()->json(['message' => 'Dokumen tidak ditemukan.'], 404);
        }

        if (!Storage::disk('public')->exists($doc->file_path)) {
            return response()->json(['message' => 'File dokumen tidak ditemukan di storage.'], 404);
        }

        return Storage::disk('public')->download($doc->file_path, $doc->file_name);
    }

    public function updateCatatan(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$this->canManageAudit($request->user())) {
            return response()->json(['message' => 'Anda tidak memiliki izin memperbarui catatan auditor.'], 403);
        }

        if ($auditProcess->status !== 'in_progress') {
            return response()->json([
                'message' => 'Catatan hanya dapat diperbarui ketika status audit adalah Dalam Proses.',
            ], 422);
        }

        $request->validate([
            'catatan_auditor' => 'required|string',
        ]);

        $auditProcess->update(['catatan_auditor' => $request->catatan_auditor]);

        return response()->json(['audit_process' => $auditProcess]);
    }

    public function updateStatus(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$this->canManageAudit($request->user())) {
            return response()->json(['message' => 'Anda tidak memiliki izin memperbarui status audit.'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $auditProcess->update(['status' => $request->status]);

        $mappedConversationStatus = match ($request->status) {
            'completed' => 'closed',
            'cancelled' => 'archived',
            default => 'active',
        };

        if ($auditProcess->conversation_id) {
            Conversation::query()
                ->where('id', $auditProcess->conversation_id)
                ->update(['status' => $mappedConversationStatus]);
        }

        return response()->json(['audit_process' => $auditProcess]);
    }

    public function notes(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'type' => 'required|in:pesan_spi,tindak_lanjut',
        ]);

        $items = $auditProcess->notes()
            ->with('user:id,name,role')
            ->where('note_type', $validated['type'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['notes' => $items]);
    }

    public function addNote(Request $request, AuditProcess $auditProcess)
    {
        if (!$this->canAccessAuditProcess($request->user(), $auditProcess)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'type' => 'required|in:pesan_spi,tindak_lanjut',
            'message' => 'required|string|max:5000',
        ]);

        $note = AuditNote::create([
            'audit_process_id' => $auditProcess->id,
            'user_id' => $request->user()->id,
            'note_type' => $validated['type'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Catatan berhasil dikirim.',
            'note' => $note->load('user:id,name,role'),
        ], 201);
    }

    private function canUploadTahap(User $user, int $tahapNo): bool
    {
        if ($user->role === 'manajemen' && $user->sub_role === 'kspi') {
            return false;
        }

        if ($user->role === 'manajemen') {
            return true;
        }

        if ($user->role === 'auditee') {
            return in_array($tahapNo, [1, 6], true);
        }

        if ($user->role === 'auditor') {
            return $tahapNo >= 1 && $tahapNo <= self::MAX_TAHAP_KONSULTASI && !in_array($tahapNo, [1, 6], true);
        }

        return false;
    }

    private function canAccessAuditProcess(User $user, AuditProcess $auditProcess): bool
    {
        if ($user->role === 'manajemen') {
            return true;
        }

        if ($user->role === 'auditee') {
            return (int) $auditProcess->auditee_id === (int) $user->id;
        }

        if ($user->role === 'auditor') {
            if ((int) $auditProcess->auditor_id === (int) $user->id) {
                return true;
            }

            return empty($auditProcess->auditor_id) && !empty($user->biro) && $auditProcess->biro === $user->biro;
        }

        return false;
    }

    // Dashboard statistics
    public function statistics(Request $request)
    {
        $user = $request->user();
        $baseQuery = AuditProcess::query();

        if ($user->isAuditee()) {
            $baseQuery->where('auditee_id', $user->id);
        } elseif ($user->isAuditor()) {
            $baseQuery->where(function ($q) use ($user) {
                $q->where('auditor_id', $user->id)
                    ->orWhere(function ($byBiro) use ($user) {
                        $byBiro->whereNull('auditor_id')
                            ->where('biro', $user->biro);
                    });
            });
        }

        return response()->json([
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->where('status', 'pending')->count(),
            'in_progress' => (clone $baseQuery)->where('status', 'in_progress')->count(),
            'completed' => (clone $baseQuery)->where('status', 'completed')->count(),
            'cancelled' => (clone $baseQuery)->where('status', 'cancelled')->count(),
        ]);
    }
}
