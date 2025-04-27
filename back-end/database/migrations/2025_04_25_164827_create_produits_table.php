<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->foreignId('categorie_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('fournisseur_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('prix_achat', 8, 2);
            $table->decimal('prix_vente', 8, 2);
            $table->integer('stock');
            $table->integer('alerte_stock')->default(10);
            $table->date('date_expiration')->nullable();
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};