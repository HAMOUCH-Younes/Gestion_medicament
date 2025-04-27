<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fournisseur extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'nom_societe', 'email', 'telephone', 'adresse'];

    public function produits()
    {
        return $this->hasMany(Produit::class);
    }
}
