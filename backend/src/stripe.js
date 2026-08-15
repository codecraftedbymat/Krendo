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
// plan = 'mensuel' (3€/employé/mois) ou 'annuel' (30€/employé/an, soit 2 mois offerts)
// priceIdPerso : si fourni, remplace le prix par défaut du plan (tarif négocié pour cette entreprise)
export async function creerSessionCheckout({ entrepriseId, nomEntreprise, emailAdmin, quantite, urlBase, plan = 'mensuel', priceIdPerso, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe non configuré (STRIPE_SECRET_KEY manquante).');

  const priceId = priceIdPerso || (plan === 'annuel' ? process.env.STRIPE_PRICE_ID_ANNUEL : process.env.STRIPE_PRICE_ID_MENSUEL);
  if (!priceId) throw new Error(`Prix Stripe manquant pour le plan ${plan}.`);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: Math.max(quantite, 1) }],
    customer_email: emailAdmin || undefined,
    success_url: successUrl || `${urlBase}/backoffice?paiement=succes`,
    cancel_url: cancelUrl || `${urlBase}/backoffice?paiement=annule`,
    metadata: { entreprise_id: String(entrepriseId), entreprise_nom: nomEntreprise, plan },
    subscription_data: {
      metadata: { entreprise_id: String(entrepriseId), entreprise_nom: nomEntreprise, plan },
    },
  });
  return session;
}

// Retrouve l'ID du Produit Stripe "Abonnement Krendo" à partir du prix mensuel par défaut,
// pour pouvoir y rattacher des prix personnalisés sans configuration supplémentaire.
async function idProduitKrendo() {
  if (!process.env.STRIPE_PRICE_ID_MENSUEL) throw new Error('STRIPE_PRICE_ID_MENSUEL manquant (nécessaire pour retrouver le produit).');
  const prixDefaut = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_MENSUEL);
  return typeof prixDefaut.product === 'string' ? prixDefaut.product : prixDefaut.product.id;
}

// Crée un prix Stripe personnalisé (mensuel) pour une entreprise, ex: 2€/employé au lieu de 3€.
export async function creerPrixPersonnalise(montantCentimes) {
  if (!stripe) throw new Error('Stripe non configuré (STRIPE_SECRET_KEY manquante).');
  const produitId = await idProduitKrendo();
  const prix = await stripe.prices.create({
    product: produitId,
    currency: 'eur',
    unit_amount: montantCentimes,
    recurring: { interval: 'month' },
    billing_scheme: 'per_unit',
  });
  return prix.id;
}

// Met en place la bascule automatique vers un second prix après N mois, via un
// "Subscription Schedule" Stripe : Stripe change le prix tout seul à la date prévue,
// sans tâche ni serveur à surveiller de notre côté.
export async function programmerBasculePrix({ subscriptionId, priceIdSuite, dureeMois, quantite }) {
  if (!stripe) return;
  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId });

  const phaseActuelle = schedule.phases[0];
  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      {
        items: phaseActuelle.items.map((it) => ({ price: it.price, quantity: it.quantity })),
        iterations: dureeMois,
      },
      {
        items: [{ price: priceIdSuite, quantity: Math.max(quantite, 1) }],
      },
    ],
  });
}

// Met à jour la quantité facturée sur l'abonnement Stripe existant d'une entreprise,
// pour qu'elle suive le nombre réel d'employés actifs. Ne fait rien si pas d'abonnement Stripe.
// Mensuel : aucun ajustement immédiat, le changement ne prend effet qu'à la prochaine facture.
// Annuel : un crédit (ou une charge) au prorata est généré, appliqué sur le renouvellement suivant.
export async function synchroniserQuantiteStripe(pool, entrepriseId) {
  if (!stripe) return;
  try {
    const { rows: [entreprise] } = await pool.query(
      'SELECT stripe_subscription_id, plan_abonnement FROM entreprises WHERE id = $1', [entrepriseId]
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

    const prorationBehavior = entreprise.plan_abonnement === 'annuel' ? 'create_prorations' : 'none';

    await stripe.subscriptionItems.update(itemId, {
      quantity: Math.max(Number(count), 1),
      proration_behavior: prorationBehavior,
    });
  } catch (err) {
    console.error('Erreur synchronisation quantité Stripe:', err.message);
  }
}
