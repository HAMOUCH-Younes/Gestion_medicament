<?php
namespace App\Http\Controllers;

use App\Models\Produit;
use App\Models\Client;
use App\Models\Commande;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasPermission('dashboard')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Total stock: Sum of all product stocks
        $totalStock = Produit::sum('stock');

        // Total sales: Sum of (quantity * price) for delivered orders
        $totalSales = Commande::where('status', 'Livré')
            ->with('produits')
            ->get()
            ->sum(function ($commande) {
                return $commande->produits->sum(function ($produit) {
                    return $produit->pivot->quantite * $produit->pivot->prix;
                });
            });

        // Low stock: Count of products where stock <= alerte_stock
        $lowStock = Produit::whereColumn('stock', '<=', 'alerte_stock')->count();

        // Active clients: Count of clients with at least one order in the last 6 months
        $activeClients = Client::whereHas('commandes', function ($query) {
            $query->where('created_at', '>=', now()->subMonths(6));
        })->count();

        // Pending orders: Count of orders with status 'En cours'
        $pendingOrders = Commande::where('status', 'En cours')->count();

        // Stock availability: Example calculation (adjust as needed)
        $maxStockCapacity = 1000; // Define based on your business logic
        $stockAvailability = $totalStock > 0 ? round(($totalStock / $maxStockCapacity) * 100, 2) : 0;

        return response()->json([
            'totalStock' => $totalStock,
            'totalSales' => round($totalSales, 2),
            'lowStock' => $lowStock,
            'activeClients' => $activeClients,
            'pendingOrders' => $pendingOrders,
            'stockAvailability' => $stockAvailability > 100 ? 100 : $stockAvailability,
        ], 200);
    }
}