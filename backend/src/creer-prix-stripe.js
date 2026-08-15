// Script à exécuter UNE SEULE FOIS (via la Console Railway) pour créer le Produit
// et les Prix Stripe correspondant à l'abonnement Krendo :
// - Mensuel : 3€ / employé actif / mois
// - Annuel : 30€ / employé actif / an (soit 2 mois offerts par rapport au mensuel)
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

  const prixMensuel = await stripe.prices.create({
    product: produit.id,
    currency: 'eur',
    unit_amount: 300, // 3,00 €
    recurring: { interval: 'month' },
    billing_scheme: 'per_unit',
    nickname: 'Mensuel',
  });

  const prixAnnuel = await stripe.prices.create({
    product: produit.id,
    currency: 'eur',
    unit_amount: 3000, // 30,00 € (2 mois offerts par rapport à 3€ x 12)
    recurring: { interval: 'year' },
    billing_scheme: 'per_unit',
    nickname: 'Annuel',
  });

  console.log('Produit Stripe créé :', produit.id);
  console.log('Prix mensuel créé :', prixMensuel.id);
  console.log('Prix annuel créé :', prixAnnuel.id);
  console.log('');
  console.log('==> Ajoutez ces deux variables sur Railway :');
  console.log('STRIPE_PRICE_ID_MENSUEL =', prixMensuel.id);
  console.log('STRIPE_PRICE_ID_ANNUEL =', prixAnnuel.id);
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
