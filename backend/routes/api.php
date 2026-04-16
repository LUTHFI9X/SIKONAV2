<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuditProcessController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\SpiProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\RolePermissionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for SiKONA
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/login-options', [AuthController::class, 'loginOptions']);

// Protected routes
Route::middleware([
    'auth:sanctum',
    \App\Http\Middleware\EnsureNotInMaintenance::class,
    \App\Http\Middleware\EnforceRolePermission::class,
])->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'updatePassword']);
    Route::post('/toggle-online', [AuthController::class, 'toggleOnlineStatus']);

    // Users (Kelola User)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('/users/{user}/unlock', [UserController::class, 'unlockAccount']);
    Route::get('/users-stats', [UserController::class, 'statistics']);
    Route::get('/auditors', [UserController::class, 'auditors']);
    Route::get('/auditees', [UserController::class, 'auditees']);

    // Activity Logs (read-only for admin)
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/stats', [ActivityLogController::class, 'stats']);

    // Conversations (Konsultasi Chat)
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
    Route::put('/conversations/{conversation}/status', [ConversationController::class, 'updateStatus']);
    Route::get('/available-auditors', [ConversationController::class, 'getAuditors']);
    Route::get('/available-auditees', [ConversationController::class, 'getAuditees']);

    // Messages
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);
    Route::get('/messages/{message}/download', [MessageController::class, 'downloadAttachment']);

    // Audit Processes (Proses Audit - 10 Tahapan)
    Route::get('/audit-processes', [AuditProcessController::class, 'index']);
    Route::post('/audit-processes', [AuditProcessController::class, 'store']);
    Route::get('/audit-processes/{auditProcess}', [AuditProcessController::class, 'show']);
    Route::put('/audit-processes/{auditProcess}/tahap', [AuditProcessController::class, 'updateTahap']);
    Route::post('/audit-processes/{auditProcess}/dokumen', [AuditProcessController::class, 'uploadDokumen']);
    Route::get('/audit-processes/{auditProcess}/dokumen', [AuditProcessController::class, 'getDocuments']);
    Route::get('/audit-processes/{auditProcess}/dokumen/{tahapNo}/download', [AuditProcessController::class, 'downloadDocument']);
    Route::delete('/audit-processes/{auditProcess}/dokumen/{tahapNo}', [AuditProcessController::class, 'deleteDocument']);
    Route::put('/audit-processes/{auditProcess}/catatan', [AuditProcessController::class, 'updateCatatan']);
    Route::put('/audit-processes/{auditProcess}/lhk-stage', [AuditProcessController::class, 'updateLhkStage']);
    Route::put('/audit-processes/{auditProcess}/lhk-review', [AuditProcessController::class, 'updateLhkReview']);
    Route::put('/audit-processes/{auditProcess}/status', [AuditProcessController::class, 'updateStatus']);
    Route::get('/audit-processes/{auditProcess}/notes', [AuditProcessController::class, 'notes']);
    Route::post('/audit-processes/{auditProcess}/notes', [AuditProcessController::class, 'addNote']);
    Route::get('/audit-stats', [AuditProcessController::class, 'statistics']);

    // SPI Profile
    Route::get('/spi-profile', [SpiProfileController::class, 'index']);
    Route::post('/spi-profile', [SpiProfileController::class, 'store']);
    Route::post('/spi-profile/logo', [SpiProfileController::class, 'uploadLogo']);

    // Backup Management (admin only)
    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups', [BackupController::class, 'store']);
    Route::post('/backups/{filename}/restore', [BackupController::class, 'restore']);
    Route::get('/backups/{filename}/download', [BackupController::class, 'download']);
    Route::delete('/backups/{filename}', [BackupController::class, 'destroy']);

    // System settings
    Route::get('/system-settings', [SystemSettingController::class, 'show']);
    Route::put('/system-settings', [SystemSettingController::class, 'update']);

    // Role permissions
    Route::get('/role-permissions', [RolePermissionController::class, 'index']);
    Route::put('/role-permissions', [RolePermissionController::class, 'upsert']);
});
