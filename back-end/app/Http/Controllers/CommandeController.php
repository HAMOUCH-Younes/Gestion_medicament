<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Produit;
use Illuminate\Support\Facades\Validator;

class CommandeController extends Controller
{
    public function indexByClient($clientId): JsonResponse
    {
        $client = Client::findOrFail($clientId);
        $commandes = $client->commandes()->get();
        return response()->json($commandes, 200);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasPermission('commandes')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $commandes = Commande::with(['client', 'produits', 'user'])->get()->map(function ($commande) {
            return [
                'id' => $commande->id,
                'client' => $commande->client ? $commande->client->nom : 'N/A',
                'user' => $commande->user ? $commande->user->name : 'Unknown',
                'date' => $commande->date,
                'total' => (float) $commande->total, // Cast to float
                'status' => $commande->status,
                'paymentStatus' => $commande->payment_status,
                'produits' => $commande->produits->map(function ($produit) {
                    return [
                        'produit_id' => $produit->id,
                        'nomProduit' => $produit->nom, // Use nom (aliased as nomProduit in model)
                        'prix' => (float) $produit->pivot->prix, // Cast to float
                        'quantite' => (int) $produit->pivot->quantite,
                    ];
                }),
            ];
        });

        return response()->json($commandes, 200);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'date' => 'required|date',
            'status' => 'required|in:En cours,Livré,En attente,Annulé',
            'payment_status' => 'required|in:En cours,Payé,Annulé',
            'produits' => 'required|array|min:1',
            'produits.*.produit_id' => 'required|exists:produits,id',
            'produits.*.quantite' => 'required|integer|min:1',
            'produits.*.prix' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $total = collect($request->produits)->sum(function ($produit) {
            return $produit['prix'] * $produit['quantite'];
        });

        $commande = Commande::create([
            'client_id' => $request->client_id,
            'user_id' => $user->id,
            'date' => $request->date,
            'total' => $total,
            'status' => $request->status,
            'payment_status' => $request->payment_status,
        ]);

        foreach ($request->produits as $produit) {
            $commande->produits()->attach($produit['produit_id'], [
                'quantite' => $produit['quantite'],
                'prix' => (float) $produit['prix'],
            ]);
        }

        $commande->load(['client', 'produits', 'user']);
        return response()->json([
            'id' => $commande->id,
            'client' => $commande->client ? $commande->client->nom : 'N/A',
            'user' => $commande->user ? $commande->user->name : 'Unknown',
            'date' => $commande->date,
            'total' => (float) $commande->total,
            'status' => $commande->status,
            'paymentStatus' => $commande->payment_status,
            'produits' => $commande->produits->map(function ($produit) {
                return [
                    'produit_id' => $produit->id,
                    'nomProduit' => $produit->nom,
                    'prix' => (float) $produit->pivot->prix,
                    'quantite' => (int) $produit->pivot->quantite,
                ];
            }),
        ], 201);
    }
    public function update(Request $request, Commande $commande): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'date' => 'required|date',
            'status' => 'required|in:En cours,Livré,En attente,Annulé',
            'payment_status' => 'required|in:En cours,Payé,Annulé',
            'produits' => 'required|array|min:1',
            'produits.*.produit_id' => 'required|exists:produits,id',
            'produits.*.quantite' => 'required|integer|min:1',
            'produits.*.prix' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $total = collect($request->produits)->sum(function ($produit) {
            return $produit['prix'] * $produit['quantite'];
        });

        $commande->update([
            'client_id' => $request->client_id,
            'user_id' => $user->id,
            'date' => $request->date,
            'total' => $total,
            'status' => $request->status,
            'payment_status' => $request->payment_status,
        ]);

        $commande->produits()->detach();
        foreach ($request->produits as $produit) {
            $commande->produits()->attach($produit['produit_id'], [
                'quantite' => $produit['quantite'],
                'prix' => (float) $produit['prix'],
            ]);
        }

        // Load relationships and return normalized response
        $commande->load(['client', 'produits', 'user']);
        return response()->json([
            'id' => $commande->id,
            'client' => $commande->client ? $commande->client->nom : 'N/A',
            'user' => $commande->user ? $commande->user->name : 'Unknown',
            'date' => $commande->date,
            'total' => (float) $commande->total,
            'status' => $commande->status,
            'paymentStatus' => $commande->payment_status,
            'produits' => $commande->produits->map(function ($produit) {
                return [
                    'produit_id' => $produit->id,
                    'nomProduit' => $produit->nom,
                    'prix' => (float) $produit->pivot->prix,
                    'quantite' => (int) $produit->pivot->quantite,
                ];
            }),
        ], 200);
    }
    public function destroy(Commande $commande): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $commande->delete();
        return response()->json(['message' => 'Commande deleted'], 200);
    }
}
