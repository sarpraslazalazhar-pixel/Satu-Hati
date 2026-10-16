<?php

namespace App\Http\Controllers;

use App\Models\ActivitySlide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ActivitySlideController extends Controller
{
    /**
     * List all active slides for kiosk display and admin management.
     */
    public function index()
    {
        $slides = ActivitySlide::orderBy('order', 'asc')->latest()->get();

        return response()->json([
            'success' => true,
            'slides' => $slides,
        ]);
    }

    /**
     * Admin: Upload and create a new activity slide.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'badge_text' => ['nullable', 'string', 'max:50'],
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
        ], [
            'title.required' => 'Judul kegiatan wajib diisi.',
            'image.required' => 'Foto dokumentasi kegiatan wajib diunggah.',
            'image.image' => 'File harus berupa gambar (JPG, PNG, atau WebP).',
        ]);

        $imageFile = $request->file('image');
        $filename = 'slide_'.time().'_'.uniqid().'.'.$imageFile->getClientOriginalExtension();

        $destinationPath = public_path('uploads/slides');
        if (! File::isDirectory($destinationPath)) {
            File::makeDirectory($destinationPath, 0755, true, true);
        }

        $imageFile->move($destinationPath, $filename);
        $imagePath = '/uploads/slides/'.$filename;

        $slide = ActivitySlide::create([
            'title' => trim($validated['title']),
            'description' => ! empty($validated['description']) ? trim($validated['description']) : null,
            'badge_text' => ! empty($validated['badge_text']) ? trim($validated['badge_text']) : 'DOKUMENTASI KEGIATAN',
            'image_path' => $imagePath,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Slide kegiatan berhasil ditambahkan.',
            'slide' => $slide,
        ], 201);
    }

    /**
     * Admin: Delete an activity slide.
     */
    public function destroy($id)
    {
        $slide = ActivitySlide::findOrFail($id);

        if ($slide->image_path && str_starts_with($slide->image_path, '/uploads/slides/')) {
            $fullPath = public_path(ltrim($slide->image_path, '/'));
            if (File::exists($fullPath)) {
                File::delete($fullPath);
            }
        }

        $slide->delete();

        return response()->json([
            'success' => true,
            'message' => 'Slide kegiatan berhasil dihapus.',
        ]);
    }
}
