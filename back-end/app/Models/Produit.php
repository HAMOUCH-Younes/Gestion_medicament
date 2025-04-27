<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produit extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'categorie_id',
        'fournisseur_id',
        'prix_achat',
        'prix_vente',
        'stock',
        'alerte_stock',
        'date_expiration',
        'image',
        'description',
    ];

    // Alias nom as nomProduit
    public function getNomProduitAttribute()
    {
        return $this->nom;
    }

    public function categorie()
    {
        return $this->belongsTo(Categorie::class);
    }

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function commandes()
    {
        return $this->belongsToMany(Commande::class)
                    ->withPivot('quantite', 'prix')
                    ->withTimestamps();
    }
}