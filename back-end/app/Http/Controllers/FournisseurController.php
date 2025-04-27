<?php
namespace App\Http\Controllers;

use App\Models\Fournisseur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class FournisseurController extends Controller
{
    public function index(): JsonResponse
    {
        $fournisseurs = Fournisseur::all();
        return response()->json($fournisseurs, 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:fournisseurs,email|max:255',
            'telephone' => 'required|string|max:20',
            'adresse' => 'nullable|string|max:500',
            'nom_societe' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fournisseur = Fournisseur::create($request->all());
        return response()->json($fournisseur, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:fournisseurs,email,' . $fournisseur->id,
            'telephone' => 'required|string|max:20',
            'adresse' => 'nullable|string|max:500',
            'nom_societe' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fournisseur->update($request->all());
        return response()->json($fournisseur, 200);
    }

    public function destroy($id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);
        // Optional: Check if supplier has associated products
        if ($fournisseur->produits()->count() > 0) {
            return response()->json(['message' => 'Cannot delete supplier with associated products'], 400);
        }
        $fournisseur->delete();
        return response()->json(['message' => 'Fournisseur deleted successfully'], 200);
    }
}
