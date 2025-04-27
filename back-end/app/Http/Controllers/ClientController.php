<?php
namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    public function index(): JsonResponse
    {
        $clients = Client::all();
        return response()->json($clients, 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email|max:255',
            'telephone' => 'required|string|max:20',
            'adresse' => 'nullable|string|max:500',
            'nom_societe' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client = Client::create($request->all());
        return response()->json($client, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $client = Client::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:clients,email,' . $client->id,
            'telephone' => 'required|string|max:20',
            'adresse' => 'nullable|string|max:500',
            'nom_societe' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client->update($request->all());
        return response()->json($client, 200);
    }

    public function destroy($id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $client->delete(); // Cascades to delete commandes
        return response()->json(['message' => 'Client deleted successfully'], 200);
    }
}