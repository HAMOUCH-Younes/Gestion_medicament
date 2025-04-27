<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    public function updateUserPermissions(Request $request, $userId): JsonResponse
    {
        // Ensure only Admins can manage permissions
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($userId);
        $permissions = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ])['permissions'];

        $user->permissions()->sync(
            Permission::whereIn('name', $permissions)->pluck('id')
        );

        return response()->json(['message' => 'Permissions updated successfully'], 200);
    }

    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::all(['id', 'name', 'description']);
        return response()->json($permissions, 200);
    }
}

