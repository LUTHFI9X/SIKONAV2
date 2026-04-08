<?php

namespace App\Http\Controllers;

use App\Models\SpiProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SpiProfileController extends Controller
{
    public function index()
    {
        $profile = SpiProfile::first();
        return response()->json(['profile' => $profile]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_instansi' => 'required|string|max:255',
            'visi' => 'nullable|string',
            'misi' => 'nullable|string',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'website' => 'nullable|url',
            'struktur_organisasi' => 'nullable|array',
        ]);

        $profile = SpiProfile::first();

        if ($profile) {
            $profile->update($request->all());
        } else {
            $profile = SpiProfile::create($request->all());
        }

        return response()->json(['profile' => $profile]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $profile = SpiProfile::first();

        if (!$profile) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        // Delete old logo if exists
        if ($profile->logo_path) {
            Storage::disk('public')->delete($profile->logo_path);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $profile->update(['logo_path' => $path]);

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_path' => $path,
        ]);
    }
}
