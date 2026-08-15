import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function stripeActif() {
  return !!stripe;
}

export { stripe };

// Crée une session de paiement Stripe (abonnement) pour une entreprise.
// La quantité facturée = nombre d'employés actifs au moment de la création.
export async function creerSessionCheckout({ entrepriseId, nomEntreprise, emailAdmin, quantite, urlBase }) {
  if (!stripe) throw new Error('Stripe non configuré (STRIPE_SECRET_KEY manquante).');
  if (!process.env.STRIPE_PRICE_ID) throw new Error('STRIPE_PRICE_ID manquant.');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: Math.max(quantite, 1) }],
    customer_email: emailAdmin || undefined,
    success_url: `${urlBase}/backoffice?paiement=succes`,
    cancel_url: `${urlBase}/backoffice?paiement=annule`,
    metadata: { entreprise_id: String(entrepriseId), entreprise_nom: nomEntreprise },
    subscription_data: {
      metadata: { entreprise_id: String(entrepriseId), entreprise_nom: nomEntreprise },
    },
  });
  return session;
}

// Met à jour la quantité facturée sur l'abonnement Stripe existant d'une entreprise,
// pour qu'elle suive le nombre réel d'employés actifs. Ne fait rien si pas d'abonnement Stripe.
export async function synchroniserQuantiteStripe(pool, entrepriseId) {
  if (!stripe) return;
  try {
    const { rows: [entreprise] } = await pool.query(
      'SELECT stripe_subscription_id FROM entreprises WHERE id = $1', [entrepriseId]
    );
    if (!entreprise?.stripe_subscription_id) return;

    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM utilisateurs u JOIN roles r ON u.role_id = r.id
       WHERE u.entreprise_id = $1 AND r.nom = 'Employé' AND u.actif = TRUE`,
      [entrepriseId]
    );

    const subscription = await stripe.subscriptions.retrieve(entreprise.stripe_subscription_id);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) return;

    await stripe.subscriptionItems.update(itemId, { quantity: Math.max(Number(count), 1) });
  } catch (err) {
    console.error('Erreur synchronisation quantité Stripe:', err.message);
  }
}
