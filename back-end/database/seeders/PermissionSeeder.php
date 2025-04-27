<?php
namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'dashboard', 'description' => 'Accès au Tableau de Bord'],
            ['name' => 'produits', 'description' => 'Accès aux Produits'],
            ['name' => 'clients', 'description' => 'Accès aux Clients'],
            ['name' => 'fournisseurs', 'description' => 'Accès aux Fournisseurs'],
            ['name' => 'commandes', 'description' => 'Accès aux Commandes'],
            ['name' => 'utilisateurs', 'description' => 'Accès aux Utilisateurs'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                ['description' => $permission['description']]
            );
        }
    }
}
?>