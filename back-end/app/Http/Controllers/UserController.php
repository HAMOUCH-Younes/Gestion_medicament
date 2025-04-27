<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $permissions = $user->permissions()->pluck('name')->toArray();
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'permissions' => array_fill_keys($permissions, true),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if ($authUser->role !== 'Admin' && !$authUser->hasPermission('utilisateurs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::all()->map(function ($user) {
            $permissions = $user->permissions()->pluck('name')->toArray();
            return [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'permissions' => array_fill_keys($permissions, true),
            ];
        });

        return response()->json($users, 200);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if ($authUser->role !== 'Admin' && !$authUser->hasPermission('utilisateurs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:User,Admin', // Updated to match database
            'password' => 'required|string|min:8|confirmed',
            'permissions' => 'required|array',
            'permissions.*' => 'in:dashboard,produits,clients,fournisseurs,commandes,utilisateurs',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password),
        ]);

        // Attach permissions
        $permissionIds = \DB::table('permissions')
            ->whereIn('name', $request->permissions)
            ->pluck('id');
        $user->permissions()->attach($permissionIds);

        $permissions = $user->permissions()->pluck('name')->toArray();
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'permissions' => array_fill_keys($permissions, true),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();
        if ($authUser->role !== 'Admin' && !$authUser->hasPermission('utilisateurs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:User,Admin', // Updated to match database
            'permissions' => 'required|array',
            'permissions.*' => 'in:dashboard,produits,clients,fournisseurs,commandes,utilisateurs',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'username' => $request->username,
            'email' => $request->email,
            'role' => $request->role,
        ]);

        // Sync permissions
        $permissionIds = \DB::table('permissions')
            ->whereIn('name', $request->permissions)
            ->pluck('id');
        $user->permissions()->sync($permissionIds);

        $permissions = $user->permissions()->pluck('name')->toArray();
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'permissions' => array_fill_keys($permissions, true),
        ], 200);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();
        if ($authUser->role !== 'Admin' && !$authUser->hasPermission('utilisateurs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->id === $authUser->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->permissions()->detach();
        $user->delete();
        return response()->json(['message' => 'User deleted successfully'], 200);
    }

    public function changePassword(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();
        if ($authUser->role !== 'Admin' && !$authUser->hasPermission('utilisateurs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json(['message' => 'Password updated successfully'], 200);
    }
}