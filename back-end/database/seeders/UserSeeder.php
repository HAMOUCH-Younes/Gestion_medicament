<?php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        $admin = User::updateOrCreate(
            ['email' => 'admin2@example.com'],
            [
                'username' => 'admin2',
                'password' => bcrypt('password123'),
                'role' => 'Admin',
            ]
        );

        // Assign all permissions to Admin
        $allPermissions = Permission::pluck('id');
        $admin->permissions()->sync($allPermissions);

        // Create User
        $user = User::updateOrCreate(
            ['email' => 'user2@example.com'],
            [
                'username' => 'user2',
                'password' => bcrypt('password123'),
                'role' => 'User',
            ]
        );

        // Assign limited permissions to User
        $userPermissions = Permission::whereIn('name', [
            'dashboard',
            'produits',
            'clients',
            'fournisseurs',
            'commandes'
        ])->pluck('id');
        $user->permissions()->sync($userPermissions);
    }
}
?>