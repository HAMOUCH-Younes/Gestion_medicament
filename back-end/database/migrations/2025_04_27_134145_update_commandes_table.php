<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateCommandesTable extends Migration
{
    public function up()
    {
        Schema::table('commandes', function (Blueprint $table) {
            // Add user_id if it doesn't exist
            if (!Schema::hasColumn('commandes', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('client_id');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            }

            // Add payment_status if it doesn't exist
            if (!Schema::hasColumn('commandes', 'payment_status')) {
                $table->enum('payment_status', ['En cours', 'Payé', 'Annulé'])->default('En cours')->after('status');
            }

            // Update status enum to include 'En cours'
            $table->enum('status', ['En cours', 'Livré', 'En attente', 'Annulé'])->default('En cours')->change();
        });
    }

    public function down()
    {
        Schema::table('commandes', function (Blueprint $table) {
            // Revert status enum
            $table->enum('status', ['Livré', 'En attente', 'Annulé'])->default('En attente')->change();

            // Drop payment_status and user_id
            $table->dropColumn('payment_status');
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
}