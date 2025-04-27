<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\FournisseurController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\PermissionController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('/user', [UserController::class, 'me']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

Route::get('/produits', [ProduitController::class, 'index']);
Route::post('/produits', [ProduitController::class, 'store'])->middleware('auth:sanctum');
Route::put('/produits/{id}', [ProduitController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/produits/{id}', [ProduitController::class, 'destroy'])->middleware('auth:sanctum');

Route::get('/categories', [CategorieController::class, 'index']);

Route::get('/fournisseurs', [FournisseurController::class, 'index']);
Route::post('/fournisseurs', [FournisseurController::class, 'store'])->middleware('auth:sanctum');
Route::put('/fournisseurs/{id}', [FournisseurController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/fournisseurs/{id}', [FournisseurController::class, 'destroy'])->middleware('auth:sanctum');

Route::get('/clients', [ClientController::class, 'index']);
Route::post('/clients', [ClientController::class, 'store'])->middleware('auth:sanctum');
Route::put('/clients/{id}', [ClientController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/clients/{id}', [ClientController::class, 'destroy'])->middleware('auth:sanctum');

Route::get('/clients/{clientId}/commandes', [CommandeController::class, 'indexByClient']);

Route::middleware('auth:sanctum')->group(function () {
    // User Management Routes
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/password', [UserController::class, 'changePassword']);

    // Permission Routes
    Route::put('/users/{user}/permissions', [PermissionController::class, 'updateUserPermissions']);
    Route::get('/permissions', [PermissionController::class, 'getPermissions']);

    // Commande Routes
    Route::apiResource('commandes', CommandeController::class);
});