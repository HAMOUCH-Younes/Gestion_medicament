<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use App\Models\Categorie;
use App\Models\Fournisseur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProduitController extends Controller
{
    public function index(): JsonResponse
    {
        $produits = Produit::with(['categorie', 'fournisseur'])->get()->map(function ($produit) {
            return [
                'id' => $produit->id,
                'nomProduit' => $produit->nom, // Alias nom as nomProduit
                'prix' => (float) $produit->prix_vente, // Use prix_vente as prix, cast to float
                'prix_achat' => (float) $produit->prix_achat,
                'stock' => (int) $produit->stock,
                'alerte_stock' => $produit->alerte_stock,
                'date_expiration' => $produit->date_expiration,
                'image' => $produit->image,
                'description' => $produit->description,
                'categorie_id' => $produit->categorie_id,
                'fournisseur_id' => $produit->fournisseur_id,
                'categorie' => $produit->categorie ? ['id' => $produit->categorie->id, 'nom' => $produit->categorie->nom] : null,
                'fournisseur' => $produit->fournisseur ? ['id' => $produit->fournisseur->id, 'nom' => $produit->fournisseur->nom] : null,
            ];
        });
        return response()->json($produits, 200);
    }
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'categorie_id' => 'nullable|exists:categories,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'prix_achat' => 'required|numeric|min:0',
            'prix_vente' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'alerte_stock' => 'nullable|integer|min:0',
            'date_expiration' => 'nullable|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('produits', 'public');
            $data['image'] = $path;
        }

        $produit = Produit::create($data);
        $produit->load(['categorie', 'fournisseur']);

        return response()->json($produit, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $produit = Produit::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'categorie_id' => 'nullable|exists:categories,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'prix_achat' => 'required|numeric|min:0',
            'prix_vente' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'alerte_stock' => 'nullable|integer|min:0',
            'date_expiration' => 'nullable|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if ($request->hasFile('image')) {
            if ($produit->image) {
                Storage::disk('public')->delete($produit->image);
            }
            $path = $request->file('image')->store('produits', 'public');
            $data['image'] = $path;
        }

        $produit->update($data);
        $produit->load(['categorie', 'fournisseur']);

        return response()->json($produit, 200);
    }

    public function destroy($id): JsonResponse
    {
        $produit = Produit::findOrFail($id);
        if ($produit->image) {
            Storage::disk('public')->delete($produit->image);
        }
        $produit->delete();

        return response()->json(['message' => 'Produit deleted successfully'], 200);
    }
}
