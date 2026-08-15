// Script à exécuter UNE SEULE FOIS (via la Console Railway) pour créer le Produit
// et le Prix Stripe correspondant à l'abonnement Krendo (3€ / employé actif / mois).
// Usage : node src/creer-prix-stripe.js
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY manquante. Ajoutez-la dans les variables Railway avant de lancer ce script.');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  const produit = await stripe.products.create({
    name: 'Abonnement Krendo',
    description: 'Gestion de planning et de personnel — facturé par employé actif.',
  });

  const prix = await stripe.prices.create({
    product: produit.id,
    currency: 'eur',
    unit_amount: 300,
    recurring: { interval: 'month' },
    billing_scheme: 'per_unit',
  });

  console.log('Produit Stripe créé :', produit.id);
  console.log('Prix Stripe créé :', prix.id);
  console.log('');
  console.log('==> Ajoutez cette variable sur Railway : STRIPE_PRICE_ID =', prix.id);
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
