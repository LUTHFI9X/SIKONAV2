<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class BackupController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        $isAdmin = $user && ($user->role === 'admin' || ($user->role === 'manajemen' && $user->sub_role === 'admin'));

        abort_unless($isAdmin, 403, 'Hanya admin yang dapat mengelola backup.');
    }

    private function backupDir(): string
    {
        $dir = storage_path('app/backups');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return $dir;
    }

    private function sanitizeFilename(string $filename): string
    {
        return basename($filename);
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $dir = $this->backupDir();
        $files = collect(File::files($dir))
            ->sortByDesc(fn ($file) => $file->getMTime())
            ->values()
            ->map(function ($file, $idx) {
                $name = $file->getFilename();
                $isAuto = str_contains($name, '_auto.');

                return [
                    'id' => $idx + 1,
                    'filename' => $name,
                    'size' => $file->getSize(),
                    'size_readable' => $this->formatBytes($file->getSize()),
                    'date' => date('Y-m-d H:i:s', $file->getMTime()),
                    'type' => $isAuto ? 'auto' : 'manual',
                    'status' => 'success',
                ];
            });

        return response()->json(['backups' => $files]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $dir = $this->backupDir();
        $timestamp = now()->format('Ymd_His');
        $dbDefault = config('database.default');
        $connection = config("database.connections.{$dbDefault}");

        if ($dbDefault === 'mysql') {
            $filename = "sikona_backup_{$timestamp}_manual.sql";
            $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;
            $host = $connection['host'] ?? '127.0.0.1';
            $port = $connection['port'] ?? 3306;
            $database = $connection['database'] ?? '';
            $username = $connection['username'] ?? '';
            $password = $connection['password'] ?? '';

            $passwordArg = $password !== '' ? '--password=' . escapeshellarg($password) : '';
            $command = sprintf(
                'mysqldump --host=%s --port=%s --user=%s %s %s > %s 2>&1',
                escapeshellarg((string) $host),
                escapeshellarg((string) $port),
                escapeshellarg((string) $username),
                $passwordArg,
                escapeshellarg((string) $database),
                escapeshellarg($fullPath)
            );

            $output = shell_exec($command);

            if (!File::exists($fullPath) || File::size($fullPath) === 0) {
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }

                return response()->json([
                    'message' => 'Gagal membuat backup MySQL. Pastikan mysqldump tersedia di server.',
                    'error' => trim((string) $output),
                ], 500);
            }
        } elseif ($dbDefault === 'sqlite') {
            $filename = "sikona_backup_{$timestamp}_manual.sqlite";
            $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;
            $sqlitePath = $connection['database'] ?? '';

            if (!File::exists($sqlitePath)) {
                return response()->json(['message' => 'File database SQLite tidak ditemukan.'], 500);
            }

            File::copy($sqlitePath, $fullPath);
        } else {
            return response()->json(['message' => 'Tipe database belum didukung untuk backup otomatis.'], 400);
        }

        ActivityLog::record(
            'backup_created',
            "Backup database dibuat: {$filename}",
            $request,
            $request->user(),
            'Backup',
            null,
            ['filename' => $filename]
        );

        return response()->json([
            'message' => 'Backup berhasil dibuat.',
            'filename' => $filename,
        ], 201);
    }

    public function download(Request $request, string $filename)
    {
        $this->authorizeAdmin($request);

        $safeFilename = $this->sanitizeFilename($filename);
        $path = $this->backupDir() . DIRECTORY_SEPARATOR . $safeFilename;

        abort_unless(File::exists($path), 404, 'File backup tidak ditemukan.');

        return response()->download($path, $safeFilename);
    }

    public function destroy(Request $request, string $filename)
    {
        $this->authorizeAdmin($request);

        $safeFilename = $this->sanitizeFilename($filename);
        $path = $this->backupDir() . DIRECTORY_SEPARATOR . $safeFilename;

        abort_unless(File::exists($path), 404, 'File backup tidak ditemukan.');

        File::delete($path);

        ActivityLog::record(
            'backup_deleted',
            "Backup database dihapus: {$safeFilename}",
            $request,
            $request->user(),
            'Backup',
            null,
            ['filename' => $safeFilename]
        );

        return response()->json(['message' => 'Backup berhasil dihapus.']);
    }

    public function restore(Request $request, string $filename)
    {
        $this->authorizeAdmin($request);

        $safeFilename = $this->sanitizeFilename($filename);
        $backupPath = $this->backupDir() . DIRECTORY_SEPARATOR . $safeFilename;
        abort_unless(File::exists($backupPath), 404, 'File backup tidak ditemukan.');

        $dbDefault = config('database.default');
        $connection = config("database.connections.{$dbDefault}");

        if ($dbDefault === 'mysql') {
            if (!str_ends_with(strtolower($safeFilename), '.sql')) {
                return response()->json(['message' => 'Restore MySQL hanya menerima file .sql.'], 422);
            }

            $host = $connection['host'] ?? '127.0.0.1';
            $port = $connection['port'] ?? 3306;
            $database = $connection['database'] ?? '';
            $username = $connection['username'] ?? '';
            $password = $connection['password'] ?? '';

            $passwordArg = $password !== '' ? '--password=' . escapeshellarg($password) : '';
            $command = sprintf(
                'mysql --host=%s --port=%s --user=%s %s %s < %s 2>&1',
                escapeshellarg((string) $host),
                escapeshellarg((string) $port),
                escapeshellarg((string) $username),
                $passwordArg,
                escapeshellarg((string) $database),
                escapeshellarg($backupPath)
            );

            $outputLines = [];
            $exitCode = 0;
            exec($command, $outputLines, $exitCode);
            if ($exitCode !== 0) {
                return response()->json([
                    'message' => 'Restore MySQL gagal. Periksa file backup dan utilitas mysql di server.',
                    'error' => trim(implode("\n", $outputLines)),
                ], 500);
            }
        } elseif ($dbDefault === 'sqlite') {
            if (!str_ends_with(strtolower($safeFilename), '.sqlite')) {
                return response()->json(['message' => 'Restore SQLite hanya menerima file .sqlite.'], 422);
            }

            $sqlitePath = $connection['database'] ?? '';
            if ($sqlitePath === '') {
                return response()->json(['message' => 'Path database SQLite tidak valid.'], 500);
            }

            File::copy($backupPath, $sqlitePath);
        } else {
            return response()->json(['message' => 'Tipe database belum didukung untuk restore otomatis.'], 400);
        }

        ActivityLog::record(
            'backup_restored',
            "Database direstore dari backup: {$safeFilename}",
            $request,
            $request->user(),
            'Backup',
            null,
            ['filename' => $safeFilename]
        );

        return response()->json([
            'message' => 'Restore database berhasil dijalankan.',
            'filename' => $safeFilename,
        ]);
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $bytes;
        $idx = 0;

        while ($size >= 1024 && $idx < count($units) - 1) {
            $size /= 1024;
            $idx++;
        }

        return number_format($size, $idx === 0 ? 0 : 1) . ' ' . $units[$idx];
    }
}
