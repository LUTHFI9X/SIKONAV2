<?php

namespace App\Http\Controllers;

use App\Events\ConversationUpdated;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    private function canReadConversation($user, Conversation $conversation): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->role === 'manajemen' || $user->role === 'admin') {
            return true;
        }

        return $conversation->auditee_id === $user->id || $conversation->auditor_id === $user->id;
    }

    public function store(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if ($conversation->auditee_id !== $user->id && $conversation->auditor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'nullable|string|required_without:attachment',
            'attachment' => 'nullable|file|max:10240', // 10MB max
            'is_anonymous' => 'nullable|boolean',
        ]);

        $data = [
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $request->content ?? '',
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('attachments', 'public');
            $data['attachment_path'] = $path;
            $data['attachment_name'] = $file->getClientOriginalName();
            $data['attachment_type'] = $file->getMimeType();
        }

        $message = Message::create($data);

        // Update conversation last_message_at
        $payload = ['last_message_at' => now()];
        if ($user->role === 'auditee' && $request->boolean('is_anonymous')) {
            $payload['is_anonymous'] = true;
        }
        $conversation->update($payload);

        $this->broadcastConversationUpdate($conversation, 'message.created', [
            'message_id' => $message->id,
            'sender_id' => $user->id,
        ]);

        return response()->json(['message' => $message->load('sender')], 201);
    }

    public function index(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$this->canReadConversation($user, $conversation)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['messages' => $messages]);
    }

    public function downloadAttachment(Message $message, Request $request)
    {
        $user = $request->user();
        $conversation = $message->conversation;

        if (!$this->canReadConversation($user, $conversation)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$message->attachment_path) {
            return response()->json(['message' => 'No attachment found'], 404);
        }

        try {
            $disk = Storage::disk('public');

            if (!$disk->exists($message->attachment_path)) {
                return response()->json(['message' => 'Attachment file not found on server'], 404);
            }

            return $disk->download(
                $message->attachment_path,
                $message->attachment_name
            );
        } catch (\Throwable $exception) {
            Log::warning('Attachment download failed.', [
                'message_id' => $message->id,
                'path' => $message->attachment_path,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Attachment file not available'], 404);
        }
    }

    private function broadcastConversationUpdate(Conversation $conversation, string $eventType, array $meta = []): void
    {
        try {
            broadcast(new ConversationUpdated($conversation->fresh(), $eventType, $meta));
        } catch (\Throwable $exception) {
            Log::warning('Message broadcast failed; request will continue.', [
                'conversation_id' => $conversation->id,
                'event_type' => $eventType,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
