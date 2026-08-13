# Krendo - Gestion de planning multi-clients

Architecture multi-tenant (une seule base de données, plusieurs entreprises clientes isolées par entreprise_id).

## Structure
- `backend/` — API Node.js/Express + base SQLite (à migrer vers PostgreSQL sur Railway)
- `web/` — Interface web (admin + employé), à venir
- `mobile/` — Application mobile/desktop (Android, iOS, PC), à venir

## Déploiement Railway
1. Connecter ce repo GitHub à un projet Railway
2. Railway détecte automatiquement `backend/railway.json`
3. Variables d'environnement à définir sur Railway : `JWT_SECRET`, `DATABASE_URL` (si migration PostgreSQL)

## Comptes de démonstration
- Admin : admin@evenementielplus.fr / demo1234
- Employé : sofia.lambert@evenementielplus.fr / demo1234
