<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $reactIndex = public_path('react/index.html');

    if (!file_exists($reactIndex)) {
        return response()->json([
            'message' => 'Frontend belum dibuild. Jalankan `npm run build:backend` di folder frontend.',
        ], 503);
    }

    return response()->file($reactIndex, [
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma' => 'no-cache',
        'Expires' => '0',
        'X-SiKONA-Build' => (string) @filemtime($reactIndex),
    ]);
})->where('any', '^(?!api).*$');
