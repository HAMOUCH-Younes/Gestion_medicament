<?php
namespace App\Http\Controllers;

use App\Models\Categorie;
use Illuminate\Http\JsonResponse;

class CategorieController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Categorie::all();
        return response()->json($categories, 200);
    }
}