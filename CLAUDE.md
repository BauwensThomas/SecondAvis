@AGENTS.md
# CLAUDE.md - Avisbox
# Fichier de memoire permanente pour Claude Code
# Place ce fichier a la racine de ton projet Next.js
# Claude le lit automatiquement a chaque session

# ============================================================
# SECTION 1 - INSTRUCTIONS PERMANENTES POUR CLAUDE
# ============================================================

Tu es le developpeur principal du projet Avisbox.
Tu te souviens de tout ce fichier a chaque nouvelle session.
Tu ne demandes jamais ce qui a deja ete explique ici.

Regles absolues :
- Ne jamais supprimer du code existant sans demander confirmation
- Toujours ajouter des commentaires simples en francais sur chaque fonction
- Toujours separer clairement HTML, CSS, JavaScript, et logique metier
- Ne jamais melanger la logique de base de donnees avec les composants UI
- Toujours signaler si une dependance externe est necessaire avant de l ecrire
- Toujours expliquer ce que tu vas faire avant de l ecrire
- Si tu n es pas sur de quelque chose, dis-le clairement
- Privilege la simplicite a la complexite - ce projet est fait par un developpeur solo junior
- Toujours guider l utilisateur etape par etape : dire exactement quoi faire, dans quel fichier,
  dans quel ordre, et ou aller dans l interface (Supabase, Vercel, Stripe, etc.)
  Exemple : "1. Ouvre Supabase → va dans Table Editor → clique sur New Table
             2. Copie ce SQL dans l editeur SQL → clique Run
             3. Retourne dans ton terminal et tape : npm run dev"


# ============================================================
# SECTION 2 - PRESENTATION DU PROJET
# ============================================================

Nom du projet : Avisbox
Type : Application web - marketplace de second avis professionnels
Tagline : "Obtenez un avis professionnel verifie sur votre situation en moins de 24h pour 9 euros"

Concept :
Un utilisateur a un doute sur un devis, un diagnostic, ou un document juridique.
Il decrit sa situation sur la plateforme, paie 9 euros, et un professionnel
verifie lui repond dans les 24 heures.
Si personne ne repond dans le delai imparti, il est automatiquement rembourse.

Regles de delai :
- Du lundi au jeudi : expiration 24h apres la creation de la demande
- Le vendredi : expiration le lundi suivant a la meme heure (le weekend ne compte pas)
- Exemple : poste vendredi a 15h30 → expire lundi a 15h30

Note marketing : on affiche toujours "reponse garantie sous 24h" au public.
La regle vendredi est un detail technique interne, pas communique aux utilisateurs.

Modele economique :
- Utilisateur paie : 9 euros
- Expert recoit : 2 euros en cash + visibilite sur son profil + potentiels clients
- Plateforme (nous) garde : 7 euros brut / environ 6.37 euros net apres frais Stripe

Pourquoi l expert accepte 2 euros :
- Son profil public est visible apres chaque reponse
- L utilisateur satisfait peut le contacter directement
- Un client reel vaut 200 a 800 euros de chiffre d affaires
- Les experts a la retraite le font pour rester actifs + revenu supplementaire


# ============================================================
# SECTION 3 - CATEGORIES DE LA PLATEFORME
# ============================================================

# 6 categories au total, lancees progressivement.
# Ne jamais ouvrir une nouvelle categorie avant que la precedente soit stable.
# Chaque categorie a sa propre valeur dans la colonne "category" en base de donnees.

Phase 1 - Mecanique automobile (ACTIVE - lancer en premier)
  Valeur BDD : 'mecanique'
  Prix : 9 euros
  Exemples : devis trop cher, panne incomprise, diagnostic douteux, kilometrage douteux
  Pourquoi en premier : presque tout le monde a eu une voiture et un doute sur un devis de garage.
                        Pas besoin d expliquer le besoin - les gens comprennent immediatement.
                        Montants en jeu clairs (200 a 2000 euros de reparation).
                        Experts retraites faciles a recruter en Belgique.

Phase 2 - Agences immobilieres (lancer au mois 3)
  Valeur BDD : 'immo'
  Prix : 9 euros
  Exemples : honoraires d agence excessifs, mandat de vente abusif, estimation biaisee,
             etat des lieux conteste, clause compromis de vente douteuse
  Pourquoi : transactions a 150 000 - 500 000 euros, payer 9 euros pour verifier = evidence absolue,
             aucun concurrent serieux sur ce segment en Belgique

Phase 3 - Devis travaux (lancer au mois 5)
  Valeur BDD : 'travaux'
  Prix : 9 euros
  Exemples : plombier, electricien, maconnerie, renovation, devis gonfle, arnaque artisan
  Pourquoi : marche enorme post-COVID, tres forte demande, arnaques frequentes et documentees

Phase 4 - Assurances (lancer au mois 7)
  Valeur BDD : 'assurance'
  Prix : 9 euros
  Exemples : refus de remboursement injustifie, clause cachee dans contrat, sinistre mal evalue,
             resiliation abusive, garantie non appliquee
  Pourquoi : millions de litiges chaque annee, les gens ne savent pas si le refus est legal

Phase 5 - Droit du travail (lancer au mois 9)
  Valeur BDD : 'travail'
  Prix : 9 euros
  Exemples : licenciement abusif, rupture conventionnelle, heures sup non payees,
             clause de non-concurrence, preavis conteste
  Pourquoi : anxiete tres elevee, avocats a 300 euros de l heure, marche non adresse

Phase 6 - Comptabilite independants (lancer au mois 12)
  Valeur BDD : 'comptabilite'
  Prix : 9 euros
  Exemples : declaration INASTI incorrecte, TVA independant, cotisations sociales ONSS,
             optimisation fiscale de base, erreur de facturation
  Note : INASTI = Institut National d Assurances Sociales pour Travailleurs Independants (Belgique)
         ONSS = Office National de Securite Sociale (Belgique)
         Ne jamais utiliser "URSSAF" qui est une institution francaise uniquement.
  Pourquoi : des centaines de milliers d independants et freelances en Belgique,
             la plupart font leurs comptes seuls sans aide professionnelle

# CATEGORIES ECARTEES ET POURQUOI :
# Medical : risque juridique trop eleve (responsabilite medicale), a ne jamais lancer sans avocat specialise
# Informatique/reparation : montants trop faibles (50-150 euros), ratio valeur/prix de 9 euros pas evident
# Finance/placements : necessite un agriment AMF, hors de portee pour un lancement solo


# ============================================================
# SECTION 4 - REGLES METIER IMPORTANTES
# ============================================================

Regle 1 - Delai de reponse :
  En semaine (lundi au jeudi) : expiration = created_at + 24 heures exactement.
  Le vendredi : expiration = lundi suivant a la meme heure que l heure de creation + 24h.
  Logique : on calcule d abord created_at + 24h pour obtenir l heure cible.
            Si ce resultat tombe un samedi ou un dimanche, on le deplace au lundi
            suivant en conservant exactement la meme heure.

  Exemples concrets :
    Poste vendredi a 09h00 → expire lundi a 09h00
    Poste vendredi a 15h30 → expire lundi a 15h30
    Poste vendredi a 22h00 → expire lundi a 22h00
    Poste mercredi a 14h00 → expire jeudi a 14h00 (regle normale)
    Poste lundi a 08h00    → expire mardi a 08h00 (regle normale)

  Cette logique est calculee a la creation de la demande et stockee dans expires_at.
  Le cron job ne fait que comparer expires_at avec NOW() - il n a pas besoin
  de connaitre cette logique, elle est deja appliquee a la creation.

  Le marketing affiche "reponse garantie sous 24h" - le cas vendredi est
  un detail technique invisible pour l utilisateur.

  Un cron job tourne toutes les heures pour verifier les demandes expirees.
  Si une demande est expiree sans reponse → remboursement Stripe automatique.

Regle 2 - Protection contre les mauvaises reponses (4 mecanismes combines)

  Flux complet apres qu un expert repond :

    Jour 0    → Reponse livree a l utilisateur
    Jour 0-2  → Fenetre de 48h : l utilisateur peut signaler un probleme
    Jour 5    → Si aucun signalement : paiement automatique de 2 euros a l expert
    Apres 48h → Plus possible de signaler (bouton desactive)

  --- Solution 1 : Bouton "Signaler cette reponse" (48h pour agir) ---

  Pendant les 48 premieres heures apres reception, l utilisateur voit un bouton
  "Cette reponse ne me convient pas".
  Il choisit une raison dans une liste :
    - Reponse vague ou inutile
    - Informations incorrectes ou douteuses
    - Solicitation commerciale inappropriee (ex: "viens chez moi")
    - Conseil de travail au noir ou non declare
    - Contenu offensant ou abusif
    - Autre (champ texte libre)

  Ce que le signalement declenche immediatement et dans l ordre :

    1. Le statut de la demande passe de 'answered' a 'contested'
       → La demande disparait de l interface client et expert
       → Seul l admin peut y acceder depuis /admin/signalements/[id]

    2. Tout paiement et tout remboursement sont bloques indefiniment
       → Aucun virement automatique ne partira tant que l admin n a pas tranche
       → Le cron job ignore les demandes avec statut 'contested'

    3. L expert est temporairement bloque (is_active = false)
       → Il ne voit plus les demandes disponibles dans son dashboard
       → Il ne peut plus soumettre de nouvelle reponse
       → Cela evite qu il cumule des problemes pendant l analyse
       → Son compte sera reactivise automatiquement si la reponse est validee

    4. Email automatique envoye au CLIENT :
       "Votre signalement a ete enregistre. Cette demande est maintenant en cours
        d analyse par notre equipe. Tout remboursement ou paiement est suspendu
        jusqu a notre decision. Nous traitons votre dossier dans les meilleurs
        delais et vous informerons des que possible."

    5. Email automatique envoye a l EXPERT :
       "Un signalement a ete declare sur votre reponse a la demande [titre].
        Cette demande est maintenant en cours d analyse par notre equipe.
        Tout paiement vous concernant est suspendu jusqu a notre decision.
        Vous serez informe du resultat dans les meilleurs delais."

    6. Alerte email envoyee a l ADMIN avec :
       - Le contenu complet de la demande originale
       - Le contenu complet de la reponse de l expert
       - La raison du signalement choisie par le client
       - Un lien direct vers /admin/signalements/[id]

  L admin prend sa decision depuis /admin/signalements/[id] :

    Decision A - Reponse validee (expert avait raison) :
      → Statut de la demande repasse a 'answered'
      → is_paid = false, payment_eligible_at = NOW() + 5 jours
      → Email au CLIENT : "Apres analyse, votre signalement n a pas ete retenu.
         La reponse de l expert a ete validee. Aucun remboursement ne sera effectue."
      → Email a l EXPERT : "Votre reponse a ete validee par notre equipe.
         Votre paiement de 2 euros sera effectue dans un delai de 5 jours."

    Decision B - Signalement valide (client avait raison) :
      → Remboursement Stripe de 9 euros au client dans un delai de 5 jours
      → is_paid reste false, l expert ne recoit rien
      → Score de fiabilite de l expert baisse
      → Email au CLIENT : "Votre signalement a ete retenu. Vous serez rembourse
         de 9 euros dans un delai de 5 jours. Vous pouvez soumettre une nouvelle
         demande quand vous le souhaitez."
      → Email a l EXPERT : "Suite a l analyse de votre reponse, votre signalement
         a ete confirme. Aucun paiement ne vous sera verse pour cette reponse."

  Apres 48h sans signalement : le bouton disparait, plus possible de contester.

  --- Solution 2 : Paiement automatique apres 5 jours (si aucun signalement) ---

  L expert NE recoit PAS ses 2 euros immediatement apres avoir repondu.
  Le paiement part automatiquement 5 jours apres la livraison,
  uniquement si aucun signalement n a ete fait et que le statut est 'answered'.

  Calcul de payment_eligible_at = delivered_at + 5 jours calendaires
  (5 x 24 heures, pas de jours ouvrables)

  Exemples concrets :
    Reponse livree lundi   14h → paiement vendredi   14h
    Reponse livree mardi   09h → paiement dimanche   09h (Stripe fonctionne le weekend)
    Reponse livree vendredi 18h → paiement mercredi suivant 18h

  Le cron job verifie toutes les heures :
    WHERE status = 'answered'             -- PAS 'contested'
    AND is_paid = false
    AND is_contested = false
    AND contest_window_ends < NOW()       -- 48h depasse, plus contestable
    AND payment_eligible_at < NOW()      -- 5 jours ecoules
    → declenche le virement de 2 euros a l expert via Stripe Connect
    → is_paid = true

  Il n y a PAS de systeme de portefeuille ni de retrait manuel.
  Chaque reponse est payee automatiquement apres 5 jours.
  L expert voit dans son espace l historique de ses paiements recus et en attente.

  En base de donnees, la table answers stocke :
    - delivered_at          : quand la reponse a ete livree a l utilisateur
    - contest_window_ends   : delivered_at + 48 heures (fin de la fenetre de signalement)
    - payment_eligible_at   : delivered_at + 5 jours (quand le paiement peut partir)
    - is_contested          : true si l utilisateur a clique "Signaler" dans les 48h
    - contest_reason        : raison choisie par l utilisateur
    - contest_resolved      : true quand l admin a tranche
    - contest_decision      : 'validate' | 'refund' (decision de l admin)
    - is_paid               : true quand les 2 euros ont ete vires



  --- Solution 3 : Charte expert obligatoire ---

  Avant activation de son compte, chaque expert doit lire et signer numeriquement
  une charte de bonne conduite. Sans signature, le compte reste inactif.

  La charte interdit explicitement :
    - Toute solicitation commerciale dans la reponse (ex: "viens chez moi, je te fais ca moins cher")
    - Tout conseil de travail non declare, au noir, ou illegal
    - Toute fausse information deliberee destinee a tromper l utilisateur
    - Tout contenu offensant, discriminatoire, sexiste, ou inapproprie
    - Tout conflit d interet non declare (ex: repondre sur un produit qu on vend soi-meme)

  La violation de la charte entraine :
    - Suspension immediate et definitive du compte expert
    - Perte de tous les paiements en attente non encore vires (les reponses des 5 derniers jours)
    - Conservation du signalement dans les logs admin a des fins de preuve

  La signature est enregistree en base de donnees avec la date, l heure, et l IP.
  C est ta protection juridique si un expert cause un prejudice sur ta plateforme.

  --- Solution 4 : Suspension automatique par notation ---

  Si un expert recoit 3 notes de 1 etoile consecutives :
    - Son compte est automatiquement suspendu (is_active = false)
    - Toi (admin) tu recois une alerte email avec les 3 reponses concernees
    - Tu examines et tu decides : reactivation ou suppression definitive

  Si la note moyenne passe sous 4.2 apres au moins 10 avis recus :
    - Meme logique : suspension automatique + alerte admin

  Les bons experts restent, les mauvais s eliminent naturellement.
  Ce mecanisme ne necessite aucune intervention manuelle de ta part au quotidien.



Regle 3 - Notation :
  Voir Regle 2 Solution 4 pour le detail complet.
  Resume : l utilisateur note l expert de 1 a 5 apres avoir recu sa reponse.
  Sous 4.2 de moyenne apres 10 avis → suspension automatique + alerte admin.
  3 notes de 1 etoile consecutives → meme consequence.

Regle 4 - Verification des experts :
  Chaque expert doit soumettre un justificatif de son expertise lors de la candidature.
  Documents acceptes (un seul suffit) :
    - Diplome ou certificat professionnel
    - Numero BCE belge verifiable sur le site officiel bce.fgov.be
    - Carte professionnelle (ex: ordre des architectes, barreau, etc.)
    - Extrait de registre de commerce
    - Tout document prouvant l experience professionnelle dans le domaine
  La validation est manuelle par l admin avant activation du profil.
  Un test sur un cas fictif est envoye a l expert avant validation definitive.
  Duree indicative du processus : 24 a 48 heures apres reception du dossier.

Regle 5 - Protection legale et non-responsabilite :
  Les reponses sont des avis professionnels, pas des consultations formelles.
  Avisbox est une plateforme d entraide entre particuliers et professionnels.
  Nous ne sommes pas responsables des decisions prises sur la base des avis recus.
  Cela doit etre clairement indique :
    - Dans les CGU (Conditions Generales d Utilisation)
    - Sur chaque page de reponse recue (bandeau visible)
    - Sur la page d accueil dans la section "Comment ca marche"
    - Dans l email de livraison de la reponse

  Formulation exacte a utiliser sur le site et dans les emails :
    "Avisbox est une plateforme d entraide. Les avis fournis par nos professionnels
     sont des opinions basees sur les informations communiquees. Ils ne constituent
     pas une consultation professionnelle formelle engageant la responsabilite de
     Avisbox ou du professionnel. Avisbox decline toute responsabilite quant
     aux decisions prises sur la base de ces avis."

  Modele juridique valide par JustAnswer (USA) depuis 2003.
  Ce positionnement "avis d entraide" est la cle de ta protection legale.

Regle 6 - Protection contre la double soumission (concurrence) :
  Un seul expert peut repondre a une demande donnee.
  Si deux experts consultent la meme demande en meme temps et que l un repond,
  l autre doit recevoir un message d erreur clair : "Cette demande vient d etre
  prise en charge par un autre expert."
  Implementation technique : transaction PostgreSQL avec SELECT ... FOR UPDATE
  sur la table requests au moment de soumettre la reponse (voir section BDD).
  Cette protection est critique - sans elle, on pourrait devoir payer deux experts
  pour une seule demande de 9 euros.




# ============================================================
# SECTION 5 - STACK TECHNIQUE
# ============================================================

--- FRONTEND ---

Framework principal : Next.js 14 avec App Router
  Pourquoi : SSR natif, API routes integrees, deploiement simple sur Vercel
  Documentation : https://nextjs.org/docs

Styles : Tailwind CSS
  Pourquoi : Pas de fichiers CSS separes, classes directement dans le JSX
  Documentation : https://tailwindcss.com/docs

Composants UI : shadcn/ui
  Pourquoi : Composants predefinis (modales, formulaires, alertes, toasts)
  Installation : npx shadcn@latest init
  Documentation : https://ui.shadcn.com

Gestion des formulaires : react-hook-form + zod
  Pourquoi : Validation robuste cote client avec messages d erreur
  Installation : npm install react-hook-form zod @hookform/resolvers

Upload de fichiers : react-dropzone
  Pourquoi : Drag and drop pour photos de devis et PDF
  Installation : npm install react-dropzone

--- BACKEND ---

Base de donnees : PostgreSQL via Supabase
  Pourquoi : BDD + Auth + Storage dans un seul service gratuit
  Inscription : https://supabase.com
  Le client JavaScript s installe avec : npm install @supabase/supabase-js

Authentification : Supabase Auth (inclus dans Supabase)
  Methodes supportees : email/password et Google OAuth
  Pas de bibliotheque supplementaire necessaire

Stockage des fichiers : Supabase Storage (inclus dans Supabase)
  Usage : photos de devis, justificatifs des experts
  Bucket a creer : "documents"

API Routes : Next.js API Routes (dans /app/api/)
  Aucun serveur Express separe - tout est dans le meme projet Next.js

Fichier de configuration centrale : /lib/config.ts
  Principe : toutes les variables d environnement sont lues une seule fois ici.
  Le reste du code importe depuis config.ts, pas depuis process.env directement.
  Cela evite les erreurs de frappe sur les noms de variables.
  Exemple de contenu :
    export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME!
    export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
    export const REQUEST_PRICE_CENTS = Number(process.env.NEXT_PUBLIC_REQUEST_PRICE_CENTS!) || 900
    export const EXPERT_PAYMENT_CENTS = Number(process.env.NEXT_PUBLIC_EXPERT_PAYMENT_CENTS!) || 200
    export const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB!) || 10
    export const EMAIL_ADMIN = process.env.EMAIL_ADMIN!
    export const EMAIL_FROM = process.env.EMAIL_FROM!

Cron job : Vercel Cron Jobs
  Fichier de config : vercel.json
  Frequence : toutes les heures
  Route appelee : POST /api/cron/check-expired

--- PAIEMENTS ---

Paiements utilisateurs : Stripe Checkout
  Installation : npm install stripe @stripe/stripe-js
  Documentation : https://stripe.com/docs/payments/quickstart

Paiements experts : Stripe Connect Express
  Permet de virer automatiquement 2 euros a chaque expert apres reponse
  Documentation : https://stripe.com/docs/connect/express-accounts

--- EMAILS ---

Service email : Resend
  Pourquoi : 3000 emails gratuits par mois, tres simple a integrer
  Installation : npm install resend
  Inscription : https://resend.com

Templates email : react-email
  Pourquoi : Ecrire les emails en composants React
  Installation : npm install @react-email/components react-email

--- DEPLOIEMENT ---

Hebergement : Vercel
  Lien avec GitHub : chaque push sur main deploie automatiquement
  URL gratuite incluse (format : Avisbox.vercel.app)
  Variables d environnement a configurer dans le dashboard Vercel

--- RESUME DES COUTS AU DEMARRAGE ---

Supabase : 0 euro (gratuit jusqu a 500MB et 50 000 utilisateurs)
Vercel : 0 euro (plan hobby gratuit)
Resend : 0 euro (3000 emails/mois gratuits)
Stripe : 0 euro fixe (1.4% + 0.25 euro par transaction uniquement)
Total fixe mensuel au lancement : 0 euro


# ============================================================
# SECTION 6 - STRUCTURE DES FICHIERS DU PROJET
# ============================================================

Avisbox/
│
├── CLAUDE.md                          <- ce fichier (memoire de Claude)
│
├── app/                               <- toutes les pages (Next.js App Router)
│   │
│   ├── layout.tsx                     <- layout global (header, footer, cookie banner)
│   ├── page.tsx                       <- page d accueil / avec compteur public
│   ├── sitemap.ts                     <- sitemap XML genere automatiquement (SEO)
│   ├── robots.txt                     <- regles pour les robots Google (SEO)
│   │
│   ├── (auth)/                        <- groupe de routes authentification
│   │   ├── login/page.tsx             <- /login
│   │   ├── register/page.tsx          <- /register (avec Google OAuth)
│   │   ├── confirm/page.tsx           <- /auth/confirm (attente confirmation email)
│   │   ├── forgot-password/page.tsx   <- /auth/forgot-password
│   │   └── reset-password/page.tsx    <- /auth/reset-password
│   │
│   ├── (user)/                        <- espace client connecte
│   │   ├── mes-demandes/
│   │   │   ├── page.tsx               <- /mes-demandes (liste avec tous les statuts)
│   │   │   └── [id]/page.tsx          <- /mes-demandes/[id] (detail + signalement + recu)
│   │   ├── nouvelle-demande/
│   │   │   └── page.tsx               <- /nouvelle-demande (3 etapes)
│   │   └── mon-compte/page.tsx        <- /mon-compte (profil + securite + RGPD)
│   │
│   ├── (expert)/                      <- espace expert connecte
│   │   └── expert/
│   │       ├── dashboard/page.tsx     <- /expert/dashboard
│   │       ├── demandes/[id]/page.tsx <- /expert/demandes/[id]
│   │       ├── mes-reponses/page.tsx  <- /expert/mes-reponses
│   │       ├── gains/page.tsx         <- /expert/gains (+ telechargement fiscal)
│   │       └── profil/page.tsx        <- /expert/profil (infos + categories + securite)
│   │
│   ├── (public)/                      <- pages publiques sans auth
│   │   ├── experts/
│   │   │   ├── page.tsx               <- /experts (liste publique)
│   │   │   └── [id]/page.tsx          <- /experts/[id] (profil public)
│   │   ├── comment-ca-marche/page.tsx
│   │   ├── comment-poser-ma-question/page.tsx
│   │   ├── devenir-expert/page.tsx
│   │   ├── a-propos/page.tsx
│   │   ├── cgu/page.tsx
│   │   ├── politique-confidentialite/page.tsx
│   │   └── mentions-legales/page.tsx
│   │
│   ├── admin/                         <- espace admin (protege par middleware)
│   │   ├── page.tsx                   <- /admin (dashboard general)
│   │   ├── signalements/
│   │   │   ├── page.tsx               <- /admin/signalements (liste)
│   │   │   └── [id]/page.tsx          <- /admin/signalements/[id] (arbitrage)
│   │   ├── experts/
│   │   │   ├── page.tsx               <- /admin/experts (liste + recherche)
│   │   │   └── [id]/page.tsx          <- /admin/experts/[id] (profil complet)
│   │   ├── candidatures/
│   │   │   └── page.tsx               <- /admin/candidatures
│   │   ├── demandes/
│   │   │   ├── page.tsx               <- /admin/demandes (liste + recherche + filtre statut)
│   │   │   └── [id]/page.tsx          <- /admin/demandes/[id] (detail + reponse + rating + remboursement)
│   │   ├── avis/
│   │   │   └── page.tsx               <- /admin/avis (liste avis clients + filtres rated/unrated)
│   │   ├── utilisateurs/
│   │   │   └── page.tsx               <- /admin/utilisateurs (liste + recherche)
│   │   ├── finances/
│   │   │   └── page.tsx               <- /admin/finances
│   │   ├── paiements/
│   │   │   └── page.tsx               <- /admin/paiements (historique paiements + remboursements + virements)
│   │   ├── rgpd/
│   │   │   └── page.tsx               <- /admin/rgpd
│   │   ├── audit/
│   │   │   └── page.tsx               <- /admin/audit (journal, recherche par email)
│   │   └── marketing/
│   │       └── page.tsx               <- /admin/marketing (abonnes emails + export JSON)
│   │
│   └── api/                           <- toutes les routes API (backend)
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── me/route.ts
│       │   ├── forgot-password/route.ts
│       │   ├── reset-password/route.ts
│       │   └── resend-confirmation/route.ts <- POST renvoi email de confirmation
│       ├── user/
│       │   ├── profile/route.ts       <- PATCH infos client
│       │   └── change-password/route.ts
│       ├── requests/
│       │   ├── route.ts               <- GET liste / POST creer
│       │   ├── verify-payment/route.ts <- GET verif paiement apres timeout
│       │   └── [id]/
│       │       ├── route.ts           <- GET detail
│       │       ├── upload/route.ts    <- POST upload fichier
│       │       └── receipt/route.ts  <- GET genere PDF recu client
│       ├── answers/
│       │   └── [id]/
│       │       └── contest/route.ts   <- POST signalement utilisateur
│       ├── expert/
│       │   ├── requests/route.ts      <- GET demandes disponibles
│       │   ├── requests/[id]/answer/route.ts
│       │   ├── answers/route.ts       <- GET historique reponses
│       │   ├── balance/route.ts       <- GET gains et paiements
│       │   ├── profile/route.ts       <- PATCH profil expert
│       │   ├── categories/route.ts    <- PATCH categories + notifications
│       │   ├── change-password/route.ts
│       │   └── fiscal-summary/route.ts <- GET recapitulatif fiscal PDF
│       ├── experts/
│       │   ├── route.ts               <- GET liste publique
│       │   └── [id]/route.ts          <- GET profil public
│       ├── ratings/route.ts
│       ├── stats/
│       │   └── public/route.ts        <- GET compteurs page d accueil (cache 1h)
│       ├── stripe/
│       │   └── webhook/route.ts
│       ├── admin/
│       │   ├── stats/route.ts
│       │   ├── email/send/route.ts
│       │   ├── signalements/route.ts
│       │   ├── signalements/[id]/route.ts
│       │   ├── signalements/[id]/arbitrate/route.ts
│       │   ├── experts/route.ts
│       │   ├── experts/[id]/route.ts
│       │   ├── candidatures/route.ts
│       │   ├── candidatures/[id]/decide/route.ts
│       │   ├── utilisateurs/route.ts
│       │   ├── utilisateurs/[id]/route.ts
│       │   ├── utilisateurs/[id]/refund/route.ts
│       │   ├── utilisateurs/[id]/block/route.ts
│       │   ├── demandes/route.ts
│       │   ├── demandes/[id]/route.ts
│       │   ├── demandes/[id]/refund/route.ts  <- POST remboursement manuel + stocke refund_reason
│       │   ├── avis/route.ts          <- GET liste avis avec filtres (rated, unrated, email)
│       │   ├── finances/route.ts
│       │   ├── paiements/route.ts     <- GET historique mouvements financiers (paiements + remboursements + virements)
│       │   ├── gdpr/route.ts
│       │   ├── gdpr/[id]/route.ts     <- PATCH statut RGPD + trace audit
│       │   ├── gdpr/[id]/execute/route.ts <- POST anonymisation compte (droit a l oubli)
│       │   ├── audit/route.ts
│       │   └── marketing/route.ts     <- GET liste abonnes marketing + export JSON
│       └── cron/
│           └── check-expired/route.ts <- toutes les heures : remboursements + paiements
│
├── components/                        <- composants React reutilisables
│   ├── ui/                            <- composants shadcn (auto-generes)
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── requests/
│   │   ├── RequestCard.tsx
│   │   ├── RequestForm.tsx
│   │   └── RequestDetail.tsx
│   ├── experts/
│   │   ├── ExpertCard.tsx
│   │   └── ExpertAnswer.tsx
│   └── common/
│       ├── StarRating.tsx
│       ├── StatusBadge.tsx
│       └── CookieBanner.tsx           <- bandeau cookies RGPD (obligatoire EU)
│
├── lib/                               <- fonctions utilitaires et configs
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── stripe/
│   │   └── index.ts
│   ├── resend/
│   │   └── index.ts
│   ├── config.ts                      <- exporte toutes les constantes depuis process.env
│   └── utils.ts
│
├── emails/                            <- templates email (react-email)
│   ├── Welcome.tsx                    <- client : bienvenue a l inscription
│   ├── WelcomeExpert.tsx              <- expert : bienvenue apres validation
│   ├── EmailConfirm.tsx               <- client : lien de confirmation email
│   ├── PasswordReset.tsx              <- client/expert : lien reinitialisation mot de passe
│   ├── NewRequest.tsx                 <- expert : nouvelle demande dans ta categorie
│   ├── AnswerReceived.tsx             <- client : reponse recue
│   ├── ReceiptClient.tsx              <- client : recu de paiement (9 euros)
│   ├── Refunded.tsx                   <- client : rembourse (expiration 24h)
│   ├── ContestCreatedClient.tsx       <- client : signalement enregistre
│   ├── ContestCreatedExpert.tsx       <- expert : signalement sur ta reponse
│   ├── ContestResolvedValidateClient.tsx  <- client : signalement non retenu
│   ├── ContestResolvedValidateExpert.tsx  <- expert : reponse validee, paiement dans 5j
│   ├── ContestResolvedRefundClient.tsx    <- client : signalement retenu, remboursement 5j
│   ├── ContestResolvedRefundExpert.tsx    <- expert : reponse refusee, aucun paiement
│   ├── ExpertPaymentSent.tsx          <- expert : ton paiement de 2 euros a ete vire
│   ├── ExpertSuspended.tsx            <- expert : compte suspendu
│   └── ExpertReactivated.tsx          <- expert : compte reactif
│
├── types/
│   └── index.ts
│
├── proxy.ts                           <- protection des routes + verification role admin (middleware Next.js renomme)
│
├── .env.local                         <- variables d environnement (NE PAS COMMITER)
│
└── vercel.json                        <- config cron job Vercel



# ============================================================
# SECTION 7 - VARIABLES D ENVIRONNEMENT (.env.local)
# ============================================================

# PRINCIPE FONDAMENTAL :
# Chaque valeur qui peut changer (domaine, emails, noms, cles) est ici.
# Le code ne contient jamais de valeur en dur - il lit toujours le .env.
# Pour passer du local au production : changer uniquement le .env sur Vercel.
# Pour changer le domaine ou l email de contact : changer 1 ligne ici, tout suit.

# --- SUPABASE ---
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# --- STRIPE ---
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# --- RESEND (emails) ---
RESEND_API_KEY=re_...

# --- APPLICATION (a remplir maintenant, a mettre a jour quand tu as un domaine) ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
# En production : NEXT_PUBLIC_APP_URL=https://www.Avisbox.be

NEXT_PUBLIC_APP_NAME=Avisbox
# Utilise dans les titres, emails, footer - changer ici change partout

NEXT_PUBLIC_APP_TAGLINE=Obtenez un avis professionnel en moins de 24h pour 9 euros
# Utilise dans les balises meta et og:description

# --- EMAILS (expediteurs et destinataires) ---
EMAIL_FROM=Avisbox <noreply@Avisbox.be>
# L expediteur visible dans la boite mail des clients et experts
# En local pour les tests : utilise ton email personnel

EMAIL_CONTACT=contact@Avisbox.be
# Email de contact affiche dans les pages legales et emails
# En local pour les tests : utilise ton email personnel

EMAIL_ADMIN=ton.email@gmail.com
# Email ou tu recois les alertes admin (signalements, candidatures, erreurs)
# C est TON email personnel au lancement

# --- INFORMATIONS LEGALES (mentions legales obligatoires) ---
NEXT_PUBLIC_COMPANY_NAME=Avisbox
NEXT_PUBLIC_COMPANY_STATUS=Projet etudiant en phase de test
# Statut legal - a mettre a jour quand tu auras cree ta societe

NEXT_PUBLIC_COMPANY_ADDRESS=Belgique
# Adresse complete quand tu en auras une

NEXT_PUBLIC_COMPANY_BCE=
# Numero BCE belge - laisser vide pour l instant (etudiant, pas de TVA)

NEXT_PUBLIC_COMPANY_TVA=
# Numero TVA - laisser vide pour l instant (etudiant, exonere)

# --- SECURITE ---
CRON_SECRET=genere_un_mot_de_passe_aleatoire_ici_minimum_32_caracteres
# Protege le cron job contre les appels non autorises
# Generer avec : openssl rand -base64 32

ADMIN_EMAIL=ton.email@gmail.com
# Email de l admin (toi) - verifie dans le middleware pour proteger /admin

# --- UPLOADS ---
NEXT_PUBLIC_MAX_FILE_SIZE_MB=10
# Taille maximale d un fichier uploade par un client (en MB)
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf
# Types de fichiers autorises uniquement

# --- PRIX ---
NEXT_PUBLIC_REQUEST_PRICE_CENTS=900
# Prix d une demande en centimes (900 = 9 euros)
# Si tu changes le prix un jour, changer uniquement ici - tout le code suit
NEXT_PUBLIC_EXPERT_PAYMENT_CENTS=200
# Montant verse a l expert par reponse (200 = 2 euros)

# --- MONITORING (Sentry) ---
SENTRY_DSN=
# Laisser vide en local. Remplir apres creation d un compte Sentry gratuit sur sentry.io
# Sentry envoie un email immediat quand une erreur se produit en production

# --- ANALYTICS ---
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
# Laisser vide en local. Remplir avec ton domaine apres creation compte Plausible
# Alternative gratuite et RGPD-compatible a Google Analytics

# --- VERSIONS DOCUMENTS LEGAUX ---
# Incrementer quand tu modifies une CGU ou politique de confidentialite
# Permet de tracker quels utilisateurs ont accepte quelle version
NEXT_PUBLIC_CGU_VERSION=1.0
NEXT_PUBLIC_PRIVACY_VERSION=1.0
NEXT_PUBLIC_EXPERT_CHARTER_VERSION=1.0

# ============================================================
# COMMENT UTILISER CES VARIABLES DANS LE CODE
# ============================================================

# Dans un composant React :
#   process.env.NEXT_PUBLIC_APP_NAME      → "Avisbox"
#   process.env.NEXT_PUBLIC_APP_URL       → "http://localhost:3000"

# Dans une route API (server-side) :
#   process.env.EMAIL_ADMIN               → ton email
#   process.env.STRIPE_SECRET_KEY         → cle Stripe

# Variables avec NEXT_PUBLIC_ : accessibles cote client ET serveur
# Variables sans NEXT_PUBLIC_ : accessibles cote serveur uniquement (plus securise)

# EXEMPLE D UTILISATION dans un email :
#   `Bonjour, visitez ${process.env.NEXT_PUBLIC_APP_URL}/mon-compte`
#   → En local : http://localhost:3000/mon-compte
#   → En production : https://www.Avisbox.be/mon-compte
#   Un seul .env a modifier pour passer du local au production.




# ============================================================
# SECTION 8 - BASE DE DONNEES (SCHEMA COMPLET)
# ============================================================

# A executer dans l editeur SQL de Supabase (dans le dashboard)

--- REGLE EMAIL UNIQUE GLOBALE ---
# Un email ne peut apparaitre qu une seule fois dans toute la base de donnees.
# Cela signifie qu on ne peut pas avoir le meme email comme client ET comme expert.
# L unicite est garantie par Supabase Auth : chaque email = un seul compte Auth.
# Puisque les experts ont AUSSI un compte users (via user_id), ils partagent le meme email.
# Implementation :
#   - La table users a email UNIQUE → garanti par PostgreSQL
#   - Supabase Auth a aussi une contrainte unique sur l email → double protection
#   - A la candidature expert : verifier que l email n existe pas deja dans users
#   - Si l email existe deja comme client → proposer de se connecter et de postuler en tant qu expert
#   - Il ne peut jamais y avoir deux comptes distincts avec le meme email

--- TABLE users ---
# Stocke les informations des clients (acheteurs d avis)
# Principe RGPD : minimisation des donnees - on ne collecte que le strict necessaire
# Age et adresse NON collectes car inutiles pour le service

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Connexion (email unique dans toute la base - Supabase Auth garantit l unicite)
  email TEXT UNIQUE NOT NULL,              -- email de connexion (RGPD sensible)

  -- Identite
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,

  -- Contact optionnel
  phone TEXT,

  -- Consentements
  is_adult_confirmed BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT FALSE,

  -- Statut du compte
  is_blocked BOOLEAN DEFAULT FALSE,

  -- Stripe
  stripe_customer_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE experts ---
# Stocke les informations des professionnels verifies
# Chaque expert est d abord un utilisateur (user_id) avec des infos supplementaires

CREATE TABLE experts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),     -- chaque expert a aussi un compte users

  -- Profil public (visible par tous)
  display_name TEXT NOT NULL,            -- pseudo affiche (ex: "Marc C.")
  photo_url TEXT,                        -- URL photo de profil (Supabase Storage)
  bio TEXT,                              -- presentation, max 500 caracteres
  categories TEXT[] NOT NULL,           -- categories choisies par l expert
  -- Ces categories servent a DEUX choses :
  -- 1. Afficher l expert sur les bonnes pages publiques
  -- 2. Determiner quelles notifications email il recoit (nouvelle demande dans cette categorie)
  -- L expert peut modifier ses categories depuis /expert/profil a tout moment
  -- Modifier les categories met a jour immediatement les notifications
  years_experience INT NOT NULL,
  city TEXT NOT NULL,                    -- ville affichee publiquement (extraite de l adresse)
  languages TEXT[] DEFAULT '{fr}',      -- langues de reponse : 'fr' | 'nl' | 'en'
  availabilities TEXT,                   -- ex: "Lun-Ven 18h-22h" (texte libre)
  website_url TEXT,                      -- site web ou LinkedIn (optionnel)

  -- Informations privees (admin uniquement, RGPD sensible)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_street TEXT NOT NULL,          -- rue et numero
  address_zip TEXT NOT NULL,             -- code postal
  address_city TEXT NOT NULL,            -- ville complete
  address_country TEXT DEFAULT 'BE',     -- pays (BE par defaut)

  -- Informations professionnelles/legales
  entity_type TEXT NOT NULL,            -- 'individual' (particulier) ou 'company' (societe)
  company_name TEXT,                    -- nom de la societe si entity_type = 'company'
  bce_number TEXT,                      -- numero BCE belge (ex: BE0123456789)
  vat_number TEXT,                      -- numero TVA (ex: BE0123456789, meme format)
  justification_url TEXT,               -- URL du justificatif uploade (diplome, Kbis...)

  -- Statut du compte
  is_verified BOOLEAN DEFAULT FALSE,    -- valide manuellement par l admin
  is_active BOOLEAN DEFAULT TRUE,       -- accepte de nouvelles demandes
  is_blocked BOOLEAN DEFAULT FALSE,     -- suspendu par l admin (manuellement)
  suspension_reason TEXT,               -- raison de la derniere desactivation (visible dans l admin)
  suspension_type TEXT,                 -- 'manual' | 'auto_rating' | 'auto_contest'
  -- 'manual'        → desactive manuellement par l admin avec un commentaire
  -- 'auto_rating'   → desactive automatiquement : 3 mauvaises notes consecutives
  -- 'auto_contest'  → desactive automatiquement : signalement client en cours
  suspended_at TIMESTAMPTZ,             -- date et heure de la derniere desactivation

  -- Stats calculees automatiquement
  average_rating NUMERIC DEFAULT 0,
  total_answers INT DEFAULT 0,
  total_signals INT DEFAULT 0,          -- nombre de signalements recus au total
  response_rate NUMERIC DEFAULT 100,    -- % de reponses dans les delais

  -- Stripe
  stripe_account_id TEXT,               -- compte Stripe Connect Express
  -- NOTE : pas de balance_cents car les paiements sont automatiques par reponse
  -- Le cron job vire directement les 2 euros, il n y a pas de portefeuille interne

  created_at TIMESTAMPTZ DEFAULT NOW()
);


--- TABLE requests ---
# Stocke chaque demande d avis soumise par un utilisateur

CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category TEXT NOT NULL,               -- 'mecanique' | 'immo' | 'travaux' | 'assurance' | 'travail' | 'comptabilite'
  title TEXT NOT NULL,                  -- resume court de la situation (max 100 chars)
  description TEXT NOT NULL,            -- description detaillee de la situation
  attachments TEXT[],                   -- tableau d URLs de fichiers (Supabase Storage)
  status TEXT DEFAULT 'pending',        -- 'pending' | 'answered' | 'contested' | 'refunded' | 'closed'
  -- 'pending'   : en attente de reponse d un expert
  -- 'answered'  : expert a repondu, fenetre de signalement ouverte ou paiement en cours
  -- 'contested' : signalement declare, acces bloque pour tous sauf admin, tout paiement gele
  -- 'refunded'  : rembourse (expiration 24h ou signalement valide)
  -- 'closed'    : termine normalement
  amount_cents INT DEFAULT 900,         -- montant paye en centimes (900 = 9 euros)
  stripe_payment_intent_id TEXT,        -- identifiant Stripe pour remboursement eventuel
  expires_at TIMESTAMPTZ,               -- expiration calculee selon la regle vendredi
  payment_confirmed BOOLEAN DEFAULT FALSE, -- true apres confirmation par le webhook Stripe
  refund_reason TEXT,                   -- raison du remboursement si remboursement manuel admin
  -- locked_by UUID et locked_at TIMESTAMPTZ : verrou 10 min pour protection double soumission expert
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

# COLONNES AJOUTEES APRES LA CREATION INITIALE :
#   payment_confirmed, refund_reason, locked_by, locked_at
#   → voir Section 16 : colonnes ajoutees a la table requests

# Protection contre la double soumission (race condition) :
# Deux experts ne peuvent pas repondre a la meme demande en meme temps.
# Implementation dans POST /api/expert/requests/[id]/answer :
#
#   -- Transaction PostgreSQL avec verrou sur la ligne
#   BEGIN;
#   SELECT id, status FROM requests WHERE id = $1 FOR UPDATE;
#   -- FOR UPDATE verrouille la ligne pendant la transaction
#   -- Si un autre expert essaie en meme temps, il attend
#
#   IF status != 'pending' THEN
#     ROLLBACK;
#     RETURN { error: 'Cette demande a deja ete prise en charge.' }
#   END IF;
#
#   INSERT INTO answers (...);
#   UPDATE requests SET status = 'answered' WHERE id = $1;
#   COMMIT;
#
# Avec Supabase, utiliser supabase.rpc() pour appeler une fonction PostgreSQL
# qui execute cette logique transactionnelle atomiquement.
# Cela garantit qu un seul expert peut repondre, meme si deux cliquent en meme temps.



--- TABLE answers ---
# Stocke les reponses donnees par les experts

CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id),
  expert_id UUID REFERENCES experts(id),
  content TEXT NOT NULL,                  -- texte complet de la reponse
  verdict TEXT,                           -- resume en 1 phrase (ex: "Devis trop eleve de 30%")
  delivered_at TIMESTAMPTZ,               -- quand la reponse a ete livree a l utilisateur
  contest_window_ends TIMESTAMPTZ,        -- delivered_at + 48h : apres, le bouton signaler disparait
  payment_eligible_at TIMESTAMPTZ,        -- delivered_at + 5 jours : paiement automatique si pas conteste
  is_contested BOOLEAN DEFAULT FALSE,     -- true si l utilisateur a clique "Signaler" dans les 48h
  contest_reason TEXT,                    -- raison choisie par l utilisateur
  contest_resolved BOOLEAN DEFAULT FALSE, -- true quand l admin a tranche le signalement
  contest_decision TEXT,                  -- 'validate' | 'refund' - decision de l admin (null si pas de signalement)
  admin_decision_at TIMESTAMPTZ,          -- date et heure de la decision admin (pour calculer +5 jours)
  is_paid BOOLEAN DEFAULT FALSE,          -- true quand les 2 euros ont ete vires a l expert
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE expert_charters ---
# Preuve juridique que chaque expert a signe la charte avant d etre active

CREATE TABLE expert_charters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES experts(id),
  charter_version TEXT NOT NULL,          -- version du document (ex: "v1.0")
  signed_at TIMESTAMPTZ DEFAULT NOW(),    -- date et heure exacte de signature
  ip_address TEXT                         -- IP au moment de la signature (preuve supplementaire)
);


--- TABLE ratings ---
# Stocke les notes laissees par les utilisateurs apres chaque reponse

CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID REFERENCES answers(id),
  user_id UUID REFERENCES users(id),
  expert_id UUID REFERENCES experts(id), -- duplique pour requetes plus simples
  score INT CHECK (score >= 1 AND score <= 5),
  comment TEXT,                          -- commentaire optionnel
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE suspension_logs ---
# Historique complet de toutes les suspensions, reactivations et litiges d un expert
# Jamais efface - conserve indefiniment pour le suivi complet

CREATE TABLE suspension_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES experts(id),
  action TEXT NOT NULL,                 -- 'suspended' | 'reactivated'
  type TEXT,                            -- 'manual' | 'auto_rating' | 'auto_contest'
  reason TEXT,                          -- raison ecrite par l admin, ou generee automatiquement
  related_answer_id UUID REFERENCES answers(id),   -- reponse qui a declenche le litige (si applicable)
  related_signalement_id UUID REFERENCES answers(id), -- id du signalement associe (si applicable)
  contest_decision TEXT,                -- 'validate' | 'refund' - issue du litige (si applicable)
  created_by TEXT DEFAULT 'admin',      -- 'admin' ou 'system' (suspension automatique)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

# Exemples de raisons generees automatiquement :
#   auto_contest  → "Signalement client sur la demande : [titre]"
#   auto_rating   → "3 notes consecutives de 1 etoile recues"
# Exemples de raisons ecrites par l admin :
#   manual        → "Comportement inapproprie repete malgre avertissement"
#   manual        → "Fausses informations detectees, client confirme"

--- TABLE payouts ---
# Historique des virements faits aux experts

CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES experts(id),
  amount_cents INT NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending',       -- 'pending' | 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE expert_applications ---
# Candidatures d experts en attente de validation manuelle
# Collecte toutes les infos necessaires pour creer ensuite le compte expert complet

CREATE TABLE expert_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identite
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Profil public
  display_name TEXT NOT NULL,           -- pseudo choisi
  bio TEXT,
  categories TEXT[] NOT NULL,           -- categories choisies + notifications
  years_experience INT NOT NULL,
  city TEXT NOT NULL,
  languages TEXT[] DEFAULT '{fr}',

  -- Informations professionnelles
  entity_type TEXT NOT NULL,            -- 'individual' | 'company'
  company_name TEXT,
  bce_number TEXT,
  vat_number TEXT,

  -- Justification et document
  motivation TEXT,                      -- pourquoi il veut devenir expert
  document_url TEXT NOT NULL,           -- URL du justificatif uploade (obligatoire)

  -- Statut
  status TEXT DEFAULT 'pending',        -- 'pending' | 'approved' | 'rejected'
  admin_notes TEXT,                     -- notes internes de l admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);


# ============================================================
# SECTION 9 - API ROUTES (DETAIL COMPLET)
# ============================================================

--- AUTHENTIFICATION ---

POST   /api/auth/register
  Corps : { email, password, first_name, last_name, phone (optionnel), is_adult_confirmed }
  Action :
    1. Verifier que l email n existe pas deja dans la table users → erreur 409 si doublon
    2. Creer le compte dans Supabase Auth (envoie email de confirmation automatiquement)
    3. Creer la ligne dans la table users
  Retourne : { user, session }

# Google OAuth : gere nativement par Supabase Auth.
# Activer dans : Supabase → Authentication → Providers → Google → ON
# Le bouton "Continuer avec Google" sur la page /register appelle :
#   supabase.auth.signInWithOAuth({ provider: 'google' })
# Supabase cree automatiquement le compte users si c est la premiere connexion.
# Pas de route API supplementaire necessaire pour le OAuth.

POST   /api/auth/login
  Corps : { email, password }
  Action : connecte l utilisateur via Supabase Auth
  Retourne : { user, session }

POST   /api/auth/logout
  Action : invalide la session courante
  Retourne : { success: true }

GET    /api/auth/me
  Action : retourne l utilisateur connecte avec son role (user | expert | admin)
  Retourne : { user, role }

POST   /api/auth/forgot-password
  Corps : { email }
  Action : appelle supabase.auth.resetPasswordForEmail(email)
  Retourne : { success: true } (meme si l email n existe pas - securite)

POST   /api/auth/reset-password
  Corps : { password }
  Auth : token present dans l URL (gere par Supabase)
  Action : appelle supabase.auth.updateUser({ password })
  Retourne : { success: true }

--- PROFIL CLIENT ---

PATCH  /api/user/profile
  Auth requise : utilisateur connecte
  Corps : { first_name, last_name, phone, marketing_emails }
  Action :
    1. Si email change : verifier l unicite dans toute la BDD avant de mettre a jour
    2. Mettre a jour dans la table users
    3. Si email change : mettre a jour aussi dans Supabase Auth
    4. Tracer dans audit_logs
  Retourne : { user }

POST   /api/user/change-password
  Auth requise : utilisateur connecte
  Corps : { current_password, new_password }
  Action :
    1. Verifier le mot de passe actuel via supabase.auth.signInWithPassword
    2. Si correct → appelle supabase.auth.updateUser({ password: new_password })
    3. Si incorrect → erreur 401 "Mot de passe actuel incorrect"
  Retourne : { success: true }

--- PROFIL EXPERT ---

PATCH  /api/expert/profile
  Auth requise : expert connecte
  Corps : tous les champs modifiables (display_name, bio, categories, phone, address, etc.)
  Action :
    1. Si email change : verifier l unicite dans toute la BDD
    2. Mettre a jour la table experts et la table users (pour les champs partages)
    3. Tracer dans audit_logs
    4. Si categories change : mettre a jour immediatement les preferences de notification
  Retourne : { expert }

PATCH  /api/expert/categories
  Auth requise : expert connecte
  Corps : { categories: ['mecanique', 'travaux'] }
  Action :
    1. Met a jour le tableau categories dans la table experts
    2. Les nouvelles notifications seront basees sur ces categories immediatement
  Retourne : { expert }

POST   /api/expert/change-password
  Auth requise : expert connecte
  Corps : { current_password, new_password }
  Meme logique que /api/user/change-password
  Retourne : { success: true }

--- DEMANDES (UTILISATEUR) ---

POST   /api/requests
  Auth requise : utilisateur connecte
  Corps : { category, title, description }
  Action :
    1. Cree un PaymentIntent Stripe pour 9 euros
    2. Cree la demande en BDD avec status 'pending'
    3. Calcule expires_at = maintenant + 24h
  Retourne : { request, client_secret } (client_secret pour le paiement frontend)

GET    /api/requests
  Auth requise : utilisateur connecte
  Action : retourne toutes les demandes de l utilisateur connecte, du plus recent au plus ancien
  Retourne : { requests: [] }

GET    /api/requests/[id]
  Auth requise : utilisateur connecte (doit etre le proprietaire)
  Action : retourne les details complets d une demande avec sa reponse si elle existe
  Retourne : { request, answer, expert }

POST   /api/requests/[id]/upload
  Auth requise : utilisateur connecte
  Corps : FormData avec le fichier
  Action : upload le fichier dans Supabase Storage bucket "documents", ajoute l URL dans attachments
  Retourne : { url }

--- REPONSES (EXPERT) ---

GET    /api/expert/requests
  Auth requise : expert verifie et actif
  Action : retourne les demandes en status 'pending' dans les categories de l expert, non encore repondues
  Retourne : { requests: [] }

POST   /api/expert/requests/[id]/answer
  Auth requise : expert verifie et actif
  Corps : { content, verdict }
  Action :
    1. Transaction PostgreSQL avec SELECT ... FOR UPDATE sur la demande (protection double soumission)
    2. Verifie que le status est encore 'pending' - sinon retourne une erreur
    3. Cree la reponse en BDD avec :
         delivered_at = NOW()
         contest_window_ends = NOW() + 48 heures
         payment_eligible_at = NOW() + 5 jours calendaires
         is_paid = false
    4. Met le status de la demande a 'answered'
    5. Incremente total_answers de l expert
    6. Envoie un email a l utilisateur (reponse recue)
    7. NE vire PAS d argent - le paiement est automatique apres 5 jours via le cron job
  Retourne : { answer }

GET    /api/expert/answers
  Auth requise : expert connecte
  Action : historique de toutes ses reponses avec les notes recues
  Retourne : { answers: [] }

GET    /api/expert/balance
  Auth requise : expert connecte
  Action : retourne le resume des gains
           - total_earned : total gagne depuis le debut
           - total_pending : montant en attente (reponses < 5 jours sans signalement)
           - total_contested : montant gele (reponses contestees)
           - answers avec leur statut de paiement
  Retourne : { total_earned, total_pending, total_contested, answers: [] }

# NOTE : Il n y a PAS de route POST /api/expert/payout
# Les paiements sont 100% automatiques via le cron job.
# L expert ne peut pas declencher un retrait manuellement.
# Stripe Connect Express vire les 2 euros directement apres chaque reponse validee.



--- NOTATIONS ET PROFILS ---

POST   /api/ratings
  Auth requise : utilisateur connecte
  Corps : { answer_id, score, comment }
  Condition : l utilisateur doit etre le proprietaire de la demande liee
  Action :
    1. Cree la notation en BDD
    2. Recalcule la note moyenne de l expert
    3. Si 3 notes consecutives de 1 ou 2 etoiles → is_active = false + alerte admin
    4. Si note moyenne < 4.2 apres 10 avis → is_active = false + alerte admin
  Retourne : { rating }

POST   /api/answers/[id]/contest
  Auth requise : utilisateur connecte (doit etre le proprietaire de la demande)
  Corps : { reason }
  Raisons : 'vague' | 'incorrecte' | 'solicitation' | 'abusif' | 'autre'
  Condition : fenetre de 48h non expiree (contest_window_ends > NOW())
  Action :
    1. Met is_contested = true et contest_reason sur la reponse
    2. Met le statut de la demande a 'contested'
    3. Met is_active = false sur le compte de l expert (bloque temporairement)
    4. Envoie l email au client (ContestCreatedClient.tsx)
    5. Envoie l email a l expert (ContestCreatedExpert.tsx)
    6. Envoie une alerte email a l admin avec le contenu complet de la reponse
  Retourne : { success }

POST   /api/admin/answers/[id]/arbitrate
  Auth admin requise
  Corps : { decision: 'refund' | 'validate' }
  Action si 'refund' :
    1. Declenche le remboursement Stripe a l utilisateur
    2. contest_resolved = true, is_paid reste false
    3. Baisse le score de fiabilite de l expert
    4. Envoie email a l utilisateur (rembourse) et a l expert (reponse refusee)
  Action si 'validate' :
    1. contest_resolved = true
    2. Declenche le virement de 2 euros a l expert, is_paid = true
    3. Envoie email aux deux parties
  Retourne : { success }

GET    /api/experts
  Auth non requise (page publique)
  Params : ?category=mecanique
  Action : liste des experts verifies et actifs dans une categorie
  Retourne : { experts: [] }

GET    /api/experts/[id]
  Auth non requise (page publique)
  Action : profil complet d un expert avec ses 10 derniers avis
  Retourne : { expert, recent_ratings: [] }

# Note : la route GET /api/admin/contests a ete remplacee par GET /api/admin/signalements

--- STRIPE WEBHOOK ---

POST   /api/stripe/webhook
  Appele automatiquement par Stripe (pas par l utilisateur)
  Signature verifiee avec STRIPE_WEBHOOK_SECRET
  Evenements geres :
    payment_intent.succeeded    -> confirme la demande, declenche les notifications
    payment_intent.canceled     -> marque la demande comme annulee
    transfer.created            -> marque is_paid = true sur la reponse

--- CRON JOB ---

POST   /api/cron/check-expired
  Appele toutes les heures par Vercel Cron
  Header requis : Authorization: Bearer CRON_SECRET
  Action :
    1. Cherche toutes les demandes avec status='pending' et expires_at < maintenant
    2. Pour chacune : declenche le remboursement Stripe (stripe.refunds.create)
    3. Met le status a 'refunded'
    4. Envoie un email a l utilisateur (rembourse)
  Retourne : { refunded_count }

--- ADMIN ---

GET    /api/admin/stats
  Auth admin requise
  Action : retourne toutes les metriques du dashboard
           (CA mois, avis vendus, signalements en attente, experts actifs,
            taux remboursement, remboursements du mois, marge nette)
  Retourne : { stats }

GET    /api/admin/signalements
  Auth admin requise
  Params : ?status=pending|resolved|all, ?category=mecanique
  Action : liste des signalements avec infos client, expert, raison, delai restant
  Retourne : { signalements: [] }

GET    /api/admin/signalements/[id]
  Auth admin requise
  Action : detail complet du signalement (demande, reponse, raison, historique emails)
  Retourne : { signalement, request, answer, expert, user, email_history }

POST   /api/admin/signalements/[id]/arbitrate
  Auth admin requise
  Corps : { decision: 'validate' | 'refund' }

  Regle cle pour les deux decisions :
  - Remboursement client (decision 'refund') : IMMEDIAT via Stripe au moment de la decision admin.
  - Paiement expert (decision 'validate') : 5 jours apres la decision admin, via le cron job.
    payment_eligible_at = NOW() + 5 jours, le cron vire les 2 euros automatiquement.

  Action si 'validate' (reponse correcte, expert avait raison) :
    1. contest_resolved = true, contest_decision = 'validate'
    2. Statut de la demande repasse a 'answered'
    3. payment_eligible_at = NOW() + 5 jours
    4. is_active de l expert repasse a true (il peut a nouveau repondre)
    5. Le cron job enverra les 2 euros dans 5 jours automatiquement
    6. Email au client : "Apres analyse, votre signalement n a pas ete retenu.
       La reponse de l expert a ete validee. Aucun remboursement ne sera effectue."
    7. Email a l expert : "Votre reponse a ete validee. Votre paiement de 2 euros
       sera effectue dans un delai de 5 jours. Votre compte est a nouveau actif."

  Action si 'refund' (client avait raison, reponse mauvaise) :
    1. contest_resolved = true, contest_decision = 'refund'
    2. Statut de la demande passe a 'refunded'
    3. Remboursement Stripe IMMEDIAT via stripe.refunds.create()
    4. is_paid reste false, l expert ne recoit rien
    5. Score de fiabilite de l expert baisse, -1 etoile (minimum 0), -1 sur total_answers (minimum 0)
    6. is_active de l expert reste false - toi (admin) tu decides ensuite
       depuis /admin/experts/[id] si tu le reactives ou le suspends definitivement
    7. Email au client : "Votre signalement a ete retenu. Vous serez rembourse de 9 euros
       dans un delai de 5 jours."
    8. Email a l expert : "Votre reponse a ete refusee. Aucun paiement ne vous sera verse.
       Votre compte reste suspendu en attendant notre decision finale."

  Retourne : { success }

POST   /api/admin/email/send
  Auth admin requise
  Corps : { recipient_type, recipient_id, related_type, related_id, subject, body }
  Action :
    1. Envoie l email via Resend uniquement au destinataire indique
    2. Log l email dans la table admin_emails
    3. L autre partie ne recoit rien et ne peut pas voir cet email
  Retourne : { success }

GET    /api/admin/experts
  Auth admin requise
  Params de filtre :
    ?status=active|suspended|pending|all
    ?category=mecanique|immo|travaux|assurance|travail|comptabilite
  Params de recherche (tous optionnels, combinables) :
    ?q=texte              -- recherche globale sur tous les champs
    ?email=...            -- recherche par email exact ou partiel
    ?name=...             -- recherche sur prenom, nom, ou pseudo
    ?phone=...            -- recherche par telephone
    ?city=...             -- recherche par ville
    ?bce=...              -- recherche par numero BCE
    ?vat=...              -- recherche par numero TVA
    ?company=...          -- recherche par nom de societe
  Comportement :
    - La recherche est insensible a la casse (ILIKE en PostgreSQL)
    - La recherche est partielle : "marc" trouve "Marc", "Marcello", "Demarcq"
    - ?q=0477 cherche simultanement dans email, telephone, nom, prenom, pseudo
    - Les filtres status/category et la recherche sont combinables
    - Resultats tries par date d inscription (plus recent en premier)
  Retourne : { experts: [], total: number }

GET    /api/admin/experts/[id]
  Auth admin requise
  Action : profil complet de l expert avec tout son historique
  Retourne :
    {
      expert,             -- toutes ses infos (profil, statut, raison suspension)
      answers,            -- toutes ses reponses avec leur note
      signalements,       -- tous ses litiges avec decision, date, lien reponse, lien dossier
      suspension_logs,    -- historique complet suspensions et reactivations
      payouts,            -- historique de ses paiements
      email_history,      -- emails recus depuis la plateforme
      stats: {
        total_answers,
        total_signalements,
        signalements_valides,    -- litiges ou l expert avait raison
        signalements_refuses,    -- litiges ou l expert avait tort
        litige_rate              -- % de reponses ayant donne lieu a un litige refuse
      }
    }

PATCH  /api/admin/experts/[id]
  Auth admin requise
  Corps : champs a modifier (is_active, is_blocked, bio, categories, etc.)
  Regles specifiques pour la desactivation :
    - Si is_active passe a false, le champ "suspension_reason" est OBLIGATOIRE
    - Sans raison → retourner une erreur 400 "Veuillez indiquer la raison de la suspension"
  Action :
    1. Sauvegarde l ancienne valeur dans audit_logs avant modification
    2. Met a jour les informations de l expert en base de donnees
    3. Si is_active passe a false (desactivation manuelle) :
         - is_blocked = true
         - suspension_reason = raison fournie par l admin
         - suspension_type = 'manual'
         - suspended_at = NOW()
         - Insere une ligne dans suspension_logs (action='suspended', type='manual', reason=...)
         - Envoie email a l expert (template ExpertSuspended.tsx)
    4. Si is_active passe a true (reactivation manuelle) :
         - is_blocked = false
         - suspension_reason = null
         - suspension_type = null
         - Insere une ligne dans suspension_logs (action='reactivated', created_by='admin')
         - Envoie email a l expert (template ExpertReactivated.tsx)
  Retourne : { expert }

# Difference entre is_active et is_blocked :
# is_active = false + is_blocked = false → suspension automatique (notes ou signalement)
# is_active = false + is_blocked = true  → suspension manuelle par l admin
# is_active = true  + is_blocked = false → compte normal et actif

DELETE /api/admin/experts/[id]
  Auth admin requise
  Action : supprime le compte expert, annule les paiements en attente non encore vires
  Retourne : { success }

POST   /api/admin/candidatures/[id]/decide
  Auth admin requise
  Corps : { approved: true/false, message: string }
  Action si approuve :
    1. Cree le compte expert dans la table experts
    2. Cree le compte Stripe Connect Express
    3. Envoie email de bienvenue avec le message personnalise
  Action si refuse :
    1. Met le statut a 'rejected'
    2. Envoie email de refus avec le message personnalise
  Retourne : { success }

GET    /api/admin/utilisateurs
  Auth admin requise
  Params de filtre :
    ?status=active|blocked|all
  Params de recherche (tous optionnels, combinables) :
    ?q=texte              -- recherche globale sur tous les champs
    ?email=...            -- recherche par email exact ou partiel
    ?name=...             -- recherche sur prenom ou nom
    ?phone=...            -- recherche par telephone
  Comportement :
    - La recherche est insensible a la casse (ILIKE en PostgreSQL)
    - La recherche est partielle : "thom" trouve "Thomas", "Thompson"
    - ?q=0477 cherche simultanement dans email, telephone, prenom, nom
    - Resultats tries par date d inscription (plus recent en premier)
  Retourne : { users: [], total: number }

GET    /api/admin/utilisateurs/[id]
  Auth admin requise
  Action : profil complet du client, ses demandes, paiements, remboursements
  Retourne : { user, requests, payments }

POST   /api/admin/utilisateurs/[id]/refund
  Auth admin requise
  Corps : { request_id, reason }
  Action : remboursement manuel d une demande specifique via Stripe
  Retourne : { success }

PATCH  /api/admin/utilisateurs/[id]/block
  Auth admin requise
  Corps : { blocked: true/false }
  Action : bloque ou debloque un compte client
  Retourne : { success }

GET    /api/admin/finances
  Auth admin requise
  Action : revenus, remboursements, virements experts, marge nette sur 6 mois
  Frais Stripe calcules : Math.ceil(montant * 0.029) + nb_transactions * 25 centimes
  Retourne : { summary: { ca_total_cents, remboursements_cents, virements_experts_cents, marge_nette_cents }, monthly_data: [] }

GET    /api/admin/paiements
  Auth admin requise
  Params : ?type=all|paiement|remboursement|virement, ?status=all|paid|pending|refunded, ?email=...
  Action : historique complet de tous les mouvements financiers de la plateforme
    - Paiements clients : requests avec payment_confirmed = true
    - Remboursements : requests avec status = 'refunded' (inclut refund_reason si disponible)
    - Virements experts : table payouts
  Filtre email : cherche simultanement dans users (pour paiements/remboursements) et experts (pour virements)
  Retourne : { mouvements: [] } (triees par date decroissante)
  Note importante : la colonne refund_reason doit exister dans la table requests
    → voir Section 16 : colonnes ajoutees a la table requests

# Note technique importante sur la recherche :
# Utiliser ILIKE de PostgreSQL pour la recherche partielle insensible a la casse.
# Exemple de requete SQL pour la recherche globale sur les experts :
#
#   WHERE (
#     email      ILIKE '%' || $1 || '%' OR
#     first_name ILIKE '%' || $1 || '%' OR
#     last_name  ILIKE '%' || $1 || '%' OR
#     display_name ILIKE '%' || $1 || '%' OR
#     phone      ILIKE '%' || $1 || '%' OR
#     city       ILIKE '%' || $1 || '%' OR
#     bce_number ILIKE '%' || $1 || '%' OR
#     vat_number ILIKE '%' || $1 || '%' OR
#     company_name ILIKE '%' || $1 || '%'
#   )
#
# Ajouter des index PostgreSQL sur les colonnes les plus recherchees :
#   CREATE INDEX idx_experts_email ON experts (email);
#   CREATE INDEX idx_experts_phone ON experts (phone);
#   CREATE INDEX idx_users_email ON users (email);
#   CREATE INDEX idx_users_phone ON users (phone);
#
# Ces index accelerent les recherches quand la base de donnees grossit.



# ============================================================
# SECTION 10 - PAGES ET COMPOSANTS UI
# ============================================================

--- PAGES PUBLIQUES (sans connexion) ---

/ (page d accueil)
  Contenu :
    - Titre et sous-titre d accroche
    - Comment ca marche en 3 etapes (icone + texte)
    - Les categories actives avec prix (uniquement celles dont le statut est ACTIVE)
    - Temoignages d utilisateurs (3 cartes)
    - CTA principal : bouton "Poser ma question - 9 euros"
    - Bande de reassurance (24h garanti, experts verifies, rembourse si pas de reponse)
    - Mention de non-responsabilite visible : "Avisbox est une plateforme d entraide..."

/comment-ca-marche
  Contenu :
    - Explication detaillee du processus en 5 etapes
    - FAQ (10 questions frequentes)

/experts
  Contenu :
    - Filtre par categorie
    - Grille de cartes experts (nom, specialite, note, nombre d avis)

/experts/[id]
  Contenu :
    - Photo et nom de l expert
    - Bio, specialites, annees d experience, ville
    - Note globale + nombre d avis
    - 10 derniers avis recus
    - Bouton contact (visible uniquement apres avoir recu une reponse de cet expert)

/devenir-expert
  Contenu :
    - Explication du programme
    - Formulaire de candidature (nom, email, categorie, experience, justificatif)

--- ESPACE CLIENT (connexion requise) ---

/mes-demandes
  Composants :
    - Liste de toutes ses demandes
    - Chaque carte : categorie, titre, statut, date
    - Lien vers le detail

/mes-demandes/[id]
  Composants :
    - Texte de sa demande originale
    - Fichiers joints (si uploades)
    - Reponse de l expert avec verdict mis en avant
    - Profil de l expert avec bouton contact (debloque apres reception)
    - Formulaire de notation etoiles (si pas encore note, et si statut = 'answered')
    - Badge statut avec message adapte selon le statut :
        'pending'   → "En attente d un expert"
        'answered'  → "Reponse recue" + bouton "Signaler" si dans les 48h
        'contested' → bandeau orange : "Votre signalement est en cours d analyse..."
        'refunded'  → "Rembourse - vous pouvez poser une nouvelle question"
        'closed'    → "Termine"

/nouvelle-demande
  3 etapes avec barre de progression :
    Etape 1 : Choisir une categorie (Phase 1 active : Mecanique)
    Etape 2 : Decrire la situation + upload optionnel
    Etape 3 : Paiement Stripe

/mon-compte  (profil client - modifiable par le client lui-meme)
  Le client peut modifier ses propres informations sans passer par l admin.
  Toute modification est tracee dans audit_logs.

  Section "Mes informations" :
    - Prenom (modifiable)
    - Nom (modifiable)
    - Email (modifiable - verifie l unicite avant de sauvegarder)
    - Telephone (modifiable, optionnel)
    - Bouton "Sauvegarder"

  Section "Securite" :
    - Changer le mot de passe
      Champs : mot de passe actuel + nouveau mot de passe + confirmation
      Validation : minimum 8 caracteres
      Bouton "Changer mon mot de passe"

  Section "Preferences" :
    - Case a cocher : recevoir les emails marketing (modifiable)

  Section "Mes donnees" :
    - Bouton "Telecharger mes donnees" → export JSON de tout son compte
    - Bouton "Supprimer mon compte" → demande RGPD d effacement (confirmation en 2 etapes)

--- ESPACE EXPERT (connexion expert requise) ---

/expert/dashboard
  Composants :
    - Compteur de demandes disponibles dans ses categories
    - Liste des demandes en attente
    - Chaque carte : categorie, titre, date d expiration, bouton "Voir et repondre"

/expert/demandes/[id]
  Composants :
    - Description complete de la demande
    - Fichiers joints (photos du devis, etc.)
    - Champ texte : sa reponse complete
    - Champ texte court : verdict en 1 phrase
    - Bouton "Envoyer ma reponse"
    - Timer : temps restant avant expiration

/expert/mes-reponses
  Composants :
    - Liste de toutes ses reponses avec note recue, date, statut paiement

/expert/gains
  Composants :
    - Total gagne, total en attente, total en cours d analyse
    - Historique des reponses avec statut de paiement
    - Bouton "Telecharger mon recapitulatif fiscal [annee]"

/expert/profil  (profil expert - modifiable par l expert lui-meme)
  L expert peut modifier ses propres informations sans passer par l admin.
  Toute modification est tracee dans audit_logs.

  Section "Profil public" (ce que les clients voient) :
    - Pseudo / nom affiche (modifiable)
    - Photo de profil (modifiable - upload image)
    - Bio / presentation (modifiable, max 500 caracteres)
    - Ville affichee (modifiable)
    - Site web ou LinkedIn (modifiable, optionnel)
    - Disponibilites (modifiable - texte libre)
    - Langues de reponse (modifiable - cases a cocher : FR / NL / EN)

  Section "Categories et notifications" :
    Affiche les 6 categories avec une case a cocher pour chacune.
    En cochant une categorie :
      → L expert apparait dans les resultats pour cette categorie
      → Il recoit les emails de notification pour les nouvelles demandes dans cette categorie
    En decochant une categorie :
      → Il n apparait plus, ne recoit plus les notifications
      → Les demandes deja en attente dans cette categorie restent visibles pour lui
    Bouton "Sauvegarder mes categories"
    Note affichee : "Vous recevrez un email des qu une nouvelle demande arrive
    dans les categories selectionnees."

  Section "Mes informations privees" (non visibles publiquement) :
    - Prenom, Nom (modifiables)
    - Email de contact (modifiable - verifie l unicite)
    - Telephone (modifiable)
    - Adresse complete : rue, code postal, ville (modifiable)
    - Type de compte : Particulier / Societe (modifiable)
    - Nom de la societe (modifiable si type = societe)
    - Numero BCE (modifiable)
    - Numero TVA (modifiable)
    Bouton "Sauvegarder mes informations"

  Section "Securite" :
    - Changer le mot de passe
      Champs : mot de passe actuel + nouveau mot de passe + confirmation
      Bouton "Changer mon mot de passe"

  Section "Mes donnees" :
    - Bouton "Telecharger mes donnees"
    - Bouton "Supprimer mon compte" (confirmation en 2 etapes)





--- ESPACE ADMIN ---
# Acces reserve uniquement a toi (admin). Protege par middleware avec verification du role admin.
# Objectif : tout gerer sans jamais ouvrir Supabase ou la base de donnees directement.

/admin  (tableau de bord principal)
  Composants :
    - Barre de navigation laterale avec liens vers toutes les sections admin
    - 6 metriques en haut : CA du mois, avis vendus ce mois, signalements en attente,
      experts actifs, taux de remboursement, remboursements du mois
    - Alertes en temps reel : nombre de signalements non traites (badge rouge si > 0)
    - Raccourcis rapides : "Voir les signalements", "Valider des candidatures"

/admin/signalements  (liste de tous les signalements)
  Composants :
    - Filtre par statut : En attente / Resolus / Tous
    - Filtre par categorie : mecanique, immo, travaux, etc.
    - Tri par date (plus recent en premier par defaut)
    - Pour chaque signalement dans la liste :
        - Nom anonymise du client (ex: "Client #1042")
        - Categorie de la demande
        - Raison du signalement
        - Date du signalement
        - Temps restant avant expiration du delai de 5 jours
        - Statut : En attente / Resolu
        - Bouton "Traiter" → redirige vers /admin/signalements/[id]

/admin/signalements/[id]  (page complete de traitement d un signalement)
  C est la page la plus importante de l espace admin.
  Composants :

  Bloc 1 - Demande originale du client (lecture seule)
    - Categorie, titre, description complete
    - Fichiers joints (photos de devis, PDF) avec possibilite de les ouvrir
    - Date de creation de la demande
    - Montant paye par le client (9 euros)

  Bloc 2 - Reponse de l expert (lecture seule)
    - Nom de l expert, sa note moyenne, son nombre de reponses
    - Verdict de l expert (resume 1 phrase)
    - Contenu complet de la reponse
    - Date et heure de la reponse

  Bloc 3 - Details du signalement (lecture seule)
    - Raison choisie par le client
    - Date et heure du signalement
    - Note : "Tout paiement est gele jusqu a votre decision. Des que vous decidez,
      le paiement ou remboursement partira 5 jours apres votre decision."

  Bloc 4 - Email au client (action admin)
    - Objet pre-rempli : "Concernant votre signalement - Avisbox"
    - Champ texte libre pour le message personnalise
    - Note : le client ne voit pas ce que tu envoies a l expert
    - Bouton "Envoyer au client"
    - Historique des emails deja envoyes a ce client pour ce dossier

  Bloc 5 - Email a l expert (action admin)
    - Objet pre-rempli : "Concernant votre reponse - Avisbox"
    - Champ texte libre pour le message personnalise
    - Note : l expert ne voit pas ce que tu envoies au client
    - Bouton "Envoyer a l expert"
    - Historique des emails deja envoyes a cet expert pour ce dossier

  Bloc 6 - Decision finale (action admin)
    - Bouton vert "Valider la reponse"
        → payment_eligible_at = NOW() + 5 jours
        → le cron job enverra 2 euros a l expert dans 5 jours
        → emails automatiques aux deux parties
        → signalement marque comme resolu
    - Bouton rouge "Rembourser le client"
        → remboursement Stripe de 9 euros planifie dans 5 jours
        → expert ne recoit rien
        → score de fiabilite de l expert baisse
        → signalement marque comme resolu
        → le client peut librement reposer sa question et repayer quand il veut

/admin/experts  (liste de tous les experts)
  Composants :
    - Barre de recherche universelle en haut de page
        Placeholder : "Rechercher par nom, email, telephone, ville, BCE, TVA..."
        Recherche en temps reel (debounce 300ms) sur tous les champs simultanement
        Affiche le nombre de resultats trouves
    - Filtres combinables avec la recherche :
        Statut : Tous / Actifs / Desactives manuellement / Desactives automatiquement / Non verifies
        Categorie : Mecanique / Immo / Travaux / Assurance / Travail / Comptabilite
        Tri : Note / Nombre reponses / Date inscription / Nombre signalements
    - Pour chaque expert dans les resultats :
        Prenom + Nom + Pseudo, categorie, ville
        Note moyenne (etoiles), nombre de reponses, signalements recus
        Statut affiche clairement :
          Actif          → badge vert
          Desactive (manuel)    → badge rouge + raison affichee directement sous le nom
          Desactive (auto)      → badge orange + raison generee (ex: "Signalement en cours")
          Non verifie    → badge gris
        Bouton "Voir le profil" → /admin/experts/[id]
        Bouton rapide "Reactiver" visible directement dans la liste si desactive

/admin/experts/[id]  (profil complet d un expert, tout modifiable)
  Composants :

  En-tete du profil :
    - Photo, pseudo, statut actuel affiche clairement (Actif / Suspendu / Non verifie)
    - Interrupteur ON/OFF visible et bien distinct : "Compte actif"
        → ON (vert) : l expert peut voir et repondre aux demandes
        → OFF (rouge) : l expert ne voit plus rien, ne peut plus repondre
        → Un clic ouvre une modale de confirmation avec un champ de texte OBLIGATOIRE :
            "Raison de la suspension (obligatoire) :"
            [champ texte - ex: "Comportement inapproprie repete"]
            Bouton "Confirmer la suspension"
        → La raison est sauvegardee dans suspension_reason sur le compte expert
        → La modification est tracee dans audit_logs et suspension_logs
        → Un email est envoye a l expert pour l informer

  Bandeau de suspension (visible si is_active = false) :
    - Bandeau rouge en haut de la page, impossible a rater
    - Affiche :
        Type : "Suspendu manuellement" ou "Suspendu automatiquement"
        Raison : le texte exact que tu as ecrit, ou la raison generee automatiquement
        Date de suspension
        Bouton "Reactiver ce compte" directement dans le bandeau

  Bandeau de litige actif (visible si l expert a un signalement en cours) :
    - Bandeau orange distinct du bandeau rouge
    - Affiche :
        "Signalement en cours - demande : [titre de la demande]"
        Date du signalement
        Raison du signalement soumise par le client
        Lien direct vers /admin/signalements/[id] pour traiter le dossier

  Onglet "Informations" : tous les champs modifiables
    Identite : prenom, nom, pseudo, photo
    Contact : email, telephone, adresse complete
    Professionnel : type (particulier/societe), nom societe, BCE, TVA
    Profil public : bio, categories, langues, disponibilites, site web
    Bouton "Sauvegarder" (trace dans audit_logs)

  Onglet "Activite" :
    Note moyenne et evolution
    Liste de toutes ses reponses avec note recue
    Liste de tous les signalements le concernant avec leur resolution
    Historique complet de ses paiements (dates, montants, statuts)

  Onglet "Historique suspensions" :
    Liste chronologique de toutes les suspensions et reactivations
    Pour chacune :
      Date, type (manuel/auto), raison complete, qui a fait l action (admin ou systeme)
    Cet historique n est jamais efface - meme apres reactivation

  Onglet "Litiges et signalements" :
    Liste complete de tous les litiges ayant implique cet expert, du plus recent au plus ancien.
    Chaque litige affiche :
      - Date et heure du signalement
      - Titre de la demande concernee
      - Raison du signalement soumise par le client
      - Lien direct vers la reponse de l expert dans ce dossier
      - Lien direct vers la page de traitement du signalement (/admin/signalements/[id])
      - Decision prise par l admin : "Valide" ou "Refuse"
      - Date de la decision admin
      - Consequence : "Expert paye" ou "Client rembourse"
      - Si ce litige a entraine une suspension : la raison et la date affichees

    En haut de l onglet, un resume chiffre :
      - Nombre total de litiges recus
      - Nombre de litiges valides (reponse correcte)
      - Nombre de litiges refus (reponse mauvaise)
      - Taux de litiges : litiges refus / total reponses (en %)

    Ce suivi permet de voir en un coup d oeil si un expert est problematique :
      un expert avec 10 reponses et 3 litiges refus est un signal d alarme clair.

  Onglet "Communications" :
    Historique de tous les emails recus depuis la plateforme
    Formulaire "Envoyer un email" (objet + message)

  Bouton "Supprimer le compte" (confirmation en 2 etapes)


/admin/candidatures  (candidatures experts en attente)
  Composants :
    - Barre de recherche : par nom, email, categorie
    - Liste des candidatures avec statut : En attente / Approuvee / Refusee
    - Pour chaque candidature :
        Nom, email, categorie, annees d experience, justification
        Lien vers le document justificatif uploade (diplome, Kbis)
        Date de candidature
    - Page detail d une candidature :
        Toutes les infos ci-dessus
        Champ texte pour envoyer un message personnalise au candidat
        Bouton "Approuver" → cree le compte expert + email de bienvenue
        Bouton "Refuser" → email de refus avec le message personnalise

/admin/demandes  (toutes les demandes clients)
  Composants :
    - Barre de recherche : par titre de demande, nom du client, nom de l expert
    - Filtre par statut : En attente / Repondues / Remboursees / Expirees
    - Filtre par categorie
    - Pour chaque demande : categorie, titre, statut, date, montant
    - Bouton "Voir le detail" → voir la demande et la reponse associee
    - Bouton "Rembourser manuellement" (pour les cas exceptionnels)

/admin/utilisateurs  (tous les clients inscrits)
  Composants :
    - Barre de recherche universelle en haut de page
        Placeholder : "Rechercher par nom, email ou telephone..."
        Recherche simultanee sur : prenom, nom, email, telephone
        Recherche en temps reel (debounce 300ms)
        Affiche le nombre de resultats trouves
    - Filtre : Actifs / Bloques / Tous
    - Pour chaque client dans les resultats :
        Prenom + Nom, email, telephone (si renseigne)
        Date d inscription, nombre de demandes, total depense
        Statut : Actif / Bloque
        Bouton "Voir le profil" → /admin/utilisateurs/[id]
    - Page detail d un client :
        Informations du compte (modifiables, traces dans audit_logs)
        Toutes ses demandes avec statuts et montants
        Historique de ses paiements et remboursements
        Bouton "Envoyer un email a ce client"
        Bouton "Rembourser une demande specifique"
        Bouton "Bloquer le compte" (en cas d abus)
        Bouton "Effacer les donnees" (droit a l oubli RGPD)

/admin/finances  (vue financiere complete)
  Composants :
    - Revenus du mois en cours et du mois precedent
    - Graphique des revenus sur les 6 derniers mois
    - Total des remboursements effectues ce mois
    - Total des virements effectues aux experts ce mois
    - Marge nette (revenus - remboursements - frais Stripe : 2,9% arrondi au centime superieur + 0,25 euro fixe par transaction)
    - Mois affiches du plus recent au plus ancien

/admin/paiements  (historique complet des mouvements financiers)
  Composants :
    - Barre de recherche par email (cherche dans users et experts)
    - Filtre par type : Tous / Paiements clients / Remboursements / Virements experts
    - Filtre par statut : Tous / Paye / En attente / Rembourse
    - 3 cartes de totaux : total paiements clients, total remboursements, total virements experts
    - Tableau de tous les mouvements : date, type (badge couleur), description + raison + lien dossier,
      compte (nom + email), montant (+ vert paiement / - bleu remboursement / - indigo virement),
      statut (badge couleur), reference Stripe (tronquee)
    - Lien "Voir le dossier" pour les demandes clients
    - Lien "Voir l expert" pour les virements experts
  Note : necessite la colonne refund_reason dans la table requests → voir Section 16


# Emails admin bilateraux - detail technique
# Les emails envoyes manuellement depuis l espace admin sont loggues en base de donnees.
# Ni le client ni l expert ne voient les emails envoyes a l autre partie.
# Chaque email est envoye via Resend avec l expediteur : contact@Avisbox.be

--- TABLE admin_emails ---
# Historique de tous les emails envoyes manuellement par l admin

CREATE TABLE admin_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type TEXT NOT NULL,       -- 'client' ou 'expert'
  recipient_id UUID NOT NULL,         -- id de l utilisateur ou de l expert
  recipient_email TEXT NOT NULL,      -- email reel du destinataire
  related_type TEXT,                  -- 'signalement' | 'candidature' | 'autre'
  related_id UUID,                    -- id du signalement ou de la candidature concerne
  subject TEXT NOT NULL,              -- objet de l email
  body TEXT NOT NULL,                 -- contenu de l email
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE audit_logs ---
# Journal de toutes les modifications de donnees personnelles (obligatoire RGPD)
# Chaque modification faite par l admin est enregistree automatiquement

CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID,                      -- toujours l admin (toi)
  action TEXT NOT NULL,               -- ex: 'update_user_email', 'suspend_expert', 'refund'
  target_type TEXT NOT NULL,          -- 'user' | 'expert' | 'request' | 'answer'
  target_id UUID NOT NULL,            -- id de l enregistrement modifie
  old_value JSONB,                    -- ancienne valeur avant modification
  new_value JSONB,                    -- nouvelle valeur apres modification
  reason TEXT,                        -- raison de la modification (optionnel)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE gdpr_requests ---
# Demandes RGPD soumises par les utilisateurs ou experts

CREATE TABLE gdpr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_type TEXT NOT NULL,       -- 'user' | 'expert'
  requester_id UUID NOT NULL,
  requester_email TEXT NOT NULL,
  request_type TEXT NOT NULL,         -- 'access' | 'rectification' | 'erasure' | 'portability'
  status TEXT DEFAULT 'pending',      -- 'pending' | 'in_progress' | 'completed'
  notes TEXT,                         -- notes de l admin pendant le traitement
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

--- TABLE consents ---
# Enregistrement des consentements (obligatoire RGPD)

CREATE TABLE consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,                       -- null si expert non encore cree
  expert_id UUID,
  consent_type TEXT NOT NULL,         -- 'cgu' | 'privacy_policy' | 'expert_charter' | 'marketing'
  version TEXT NOT NULL,              -- version du document accepte (ex: 'v1.0')
  accepted BOOLEAN NOT NULL,
  ip_address TEXT,                    -- IP au moment du consentement
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);



# ============================================================
# SECTION - FONCTIONNALITES OBLIGATOIRES ET RECOMMANDEES
# ============================================================

# CONTEXTE DU PROJET :
# Developpeur : etudiant, pas de numero de TVA, pas encore de domaine
# Phase actuelle : test en local uniquement
# Notifications : email uniquement (pas de SMS pour l instant)
# Toutes les valeurs de configuration sont dans le .env.local


--- OBLIGATOIRE 1 : PAGES LEGALES ---
# Sans ces pages, le site est illegal en Belgique

Pages a creer :

/cgu  (Conditions Generales d Utilisation)
  Contenu obligatoire :
    - Identification de la plateforme et de son createur
    - Nature du service (plateforme d entraide, pas de consultation formelle)
    - Clause de non-responsabilite (reprendre la formulation exacte de la Regle 5)
    - Prix et modalites de paiement
    - Politique de remboursement (24h si pas de reponse, 5 jours apres decision)
    - Droits et obligations des utilisateurs et des experts
    - Loi applicable : droit belge
  Note : utiliser les variables .env pour le nom et l email de contact
    ex: process.env.NEXT_PUBLIC_APP_NAME, process.env.EMAIL_CONTACT

/politique-confidentialite
  Contenu obligatoire :
    - Quelles donnees sont collectees et pourquoi
    - Combien de temps elles sont conservees
    - Avec qui elles sont partagees (Stripe, Supabase, Resend)
    - Comment exercer ses droits RGPD
    - Contact pour les demandes RGPD : process.env.EMAIL_CONTACT

/mentions-legales
  Contenu obligatoire :
    - Nom du responsable du site : process.env.NEXT_PUBLIC_COMPANY_NAME
    - Adresse : process.env.NEXT_PUBLIC_COMPANY_ADDRESS
    - Email : process.env.EMAIL_CONTACT
    - Numero BCE : process.env.NEXT_PUBLIC_COMPANY_BCE (vide si etudiant)
    - Hebergeur : Vercel Inc., 340 Pine Street, San Francisco, CA 94104
  Note : Si BCE vide, ecrire "Projet en cours de creation"

Bandeau cookies :
  Affiche des la premiere visite, en bas de l ecran
  Deux boutons : "Accepter" et "Refuser"
  Si refus : aucun cookie analytique n est charge
  Le choix est sauvegarde dans localStorage (pas de cookie, ironie)
  Composant : components/common/CookieBanner.tsx
  Variable d etat dans .env : NEXT_PUBLIC_PLAUSIBLE_DOMAIN (vide = analytics desactives)


--- OBLIGATOIRE 2 : VERIFICATION EMAIL ---

A l inscription, l utilisateur ne peut pas utiliser la plateforme sans confirmer son email.
Supabase Auth gere ca nativement : activer "Email confirmations" dans le dashboard Supabase.
  → Aller dans : Supabase → Authentication → Settings → Email confirmations → ON
  → L email de confirmation utilise le template Welcome.tsx

Page /auth/confirm :
  Page intermediaire affichee apres inscription : "Un email vous a ete envoye.
  Cliquez sur le lien pour activer votre compte."
  Si l utilisateur essaie d acceder sans confirmer → redirection vers cette page


--- OBLIGATOIRE 3 : MOT DE PASSE OUBLIE ---

Page /auth/forgot-password :
  Formulaire avec un champ email
  Bouton "Recevoir le lien de reinitialisation"
  Supabase Auth gere la logique nativement
  → Aller dans : Supabase → Authentication → Settings → activer "Secure email change"

Page /auth/reset-password :
  Page accessible via le lien recu par email
  Formulaire : nouveau mot de passe + confirmation
  Apres validation : redirection vers /login avec message "Mot de passe modifie"

Routes API a ajouter :
  POST /api/auth/forgot-password  → appelle supabase.auth.resetPasswordForEmail()
  POST /api/auth/reset-password   → appelle supabase.auth.updateUser({ password })


--- OBLIGATOIRE 4 : GESTION DES ECHECS DE PAIEMENT STRIPE ---

Cas a gerer dans POST /api/requests et dans le webhook Stripe :

  Cas 1 - Carte refusee au moment du paiement :
    → Ne pas creer la demande en BDD
    → Afficher un message clair a l utilisateur sur la page de paiement
    → Proposer de reessayer avec une autre carte
    → Messages selon le code d erreur Stripe :
        card_declined      → "Carte refusee. Verifiez vos informations ou utilisez une autre carte."
        insufficient_funds → "Fonds insuffisants sur cette carte."
        expired_card       → "Cette carte est expiree."

  Cas 2 - Paiement reussi mais erreur serveur apres :
    → Le paiement Stripe a ete debite mais la demande n a pas ete creee en BDD
    → Le webhook payment_intent.succeeded doit creer la demande si elle n existe pas
    → Toujours utiliser le webhook comme source de verite, pas la reponse API directe

  Cas 3 - Timeout ou perte de connexion pendant le paiement :
    → Page de confirmation avec statut "En cours de verification"
    → Verifier l etat du PaymentIntent via GET /api/requests/verify-payment?pi_id=...
    → Si succeeded → creer la demande
    → Si failed → afficher erreur
    → Si processing → afficher "En cours, vous recevrez un email de confirmation"

  Dans le .env, jamais de logique de prix en dur :
    NEXT_PUBLIC_REQUEST_PRICE_CENTS=900
    → Utilise dans le code : process.env.NEXT_PUBLIC_REQUEST_PRICE_CENTS


--- RECOMMANDE 5 : NOTIFICATIONS EMAIL EXPERTS ---

Quand une nouvelle demande est soumise et payee :
  → Chercher tous les experts actifs et verifies dans la meme categorie
  → Envoyer un email immediat a chacun (template NewRequest.tsx)
  → Email contient : titre de la demande, categorie, temps restant, lien direct vers /expert/demandes/[id]
  → L email est envoye depuis : process.env.EMAIL_FROM

Cette notification est critique pour respecter le delai de 24h.
Sans elle, l expert doit ouvrir l application pour savoir s il y a du travail.
Implementation dans POST /api/requests apres confirmation du paiement Stripe.


--- RECOMMANDE 6 : PAGE "COMMENT BIEN POSER MA QUESTION" ---

Page /comment-poser-ma-question
  Objectif : aider les clients a donner assez d informations pour que l expert puisse repondre

  Contenu par categorie :
    Mecanique :
      - Indiquer la marque, le modele, l annee et le kilometrage du vehicule
      - Decrire le probleme precisement (bruit, voyant, comportement)
      - Joindre une photo du devis si disponible
      - Mentionner si le probleme est recent ou ancien
    Immo :
      - Preciser si c est achat, location, ou vente
      - Joindre le document en question (mandat, bail, compromis)
      - Indiquer la commune et le type de bien
    Travaux :
      - Joindre le devis complet avec le detail des postes
      - Preciser la superficie et le type de logement
      - Indiquer si d autres devis ont ete recus et pour quel montant

  Dans le formulaire de nouvelle demande, un lien vers cette page :
    "Besoin d aide pour bien decrire votre situation ? → Voir nos conseils"

  Guide aussi integre directement dans le formulaire /nouvelle-demande :
    Placeholder du champ description pre-rempli selon la categorie choisie
    Exemple pour mecanique :
      "Vehicule : [marque, modele, annee, km]
       Probleme : [description precise]
       Devis : [montant et detail des reparations demandees]"


--- RECOMMANDE 7 : FACTURE ET RECU CLIENT ---

Apres paiement confirme, envoyer automatiquement un recu par email.
Obligation legale en Belgique pour toute transaction commerciale.

Template email : ReceiptClient.tsx
  Contenu du recu :
    - Numero de transaction (genere automatiquement : SA-2026-XXXX)
    - Date et heure du paiement
    - Description : "Avis professionnel - categorie [mecanique] - demande [titre]"
    - Montant : 9,00 euros TVAC
    - Mention : "TVA non applicable - Article 56bis du Code de la TVA" (etudiant)
    - Nom et coordonnees : process.env.NEXT_PUBLIC_COMPANY_NAME + EMAIL_CONTACT
    - Numero de reference Stripe : le PaymentIntent ID

Ajouter dans la table requests un champ :
  receipt_number TEXT   -- ex: SA-2026-0001, incremente automatiquement

Page /mes-demandes/[id] :
  Bouton "Telecharger mon recu" → genere un PDF via /api/requests/[id]/receipt


--- RECOMMANDE 8 : MONITORING DES ERREURS (SENTRY) ---

STATUT : INSTALLE ET CONFIGURE (avril 2026)

Installation effectuee :
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs --saas --org second-avis --project javascript-nextjs

Fichiers crees par le wizard (a commiter) :
  sentry.server.config.ts  → configuration Sentry cote serveur
  sentry.edge.config.ts    → configuration Sentry pour l edge runtime
  instrumentation.ts       → point d entree Sentry dans Next.js
  next.config.ts           → modifie pour wrapper withSentryConfig

Fichier SENSIBLE a ne jamais commiter (deja dans .gitignore) :
  .env.sentry-build-plugin → contient SENTRY_AUTH_TOKEN (token prive)

Options choisies lors de la configuration :
  - Routing via serveur Next.js : Non (evite de surcharger le serveur)
  - Tracing performance : Oui
  - Session Replay : Non (alourdit le bundle, inutile au lancement)
  - Logs envoyes a Sentry : Oui

Ce que Sentry fait :
  - Capture automatiquement toutes les erreurs non gerees
  - Envoie un email immediat a EMAIL_ADMIN quand une erreur se produit
  - Affiche la trace complete (quel fichier, quelle ligne, quel utilisateur)
  - Plan gratuit : 5000 erreurs par mois (largement suffisant au lancement)

DSN Sentry (dans sentry.server.config.ts et sentry.edge.config.ts) :
  https://95af3d5a0a5bbef1f88dcb677f42e19d@o4511196715548672.ingest.de.sentry.io/4511196741238864

Note : le DSN est semi-public et peut etre dans le code source sans risque.
  Seul le SENTRY_AUTH_TOKEN (dans .env.sentry-build-plugin) est prive.


--- RECOMMANDE 9 : VALIDATION DES FICHIERS UPLOADES ---

Avant d envoyer un fichier vers Supabase Storage, valider cote serveur :

Dans POST /api/requests/[id]/upload :
  1. Verifier la taille : file.size > MAX_FILE_SIZE_MB * 1024 * 1024 → erreur 400
  2. Verifier le type MIME : si pas dans ALLOWED_FILE_TYPES → erreur 400
  3. Verifier le nom du fichier : pas de caracteres speciaux dangereux
  4. Scanner le contenu (optionnel mais recommande) : rejeter les fichiers avec signatures d executables

Variables .env utilisees :
  NEXT_PUBLIC_MAX_FILE_SIZE_MB=10
  NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

Message d erreur clair a afficher :
  "Fichier non accepte. Formats autorises : JPG, PNG, PDF. Taille maximum : 10MB."


--- RECOMMANDE 10 : COMPTEUR SUR LA PAGE D ACCUEIL ---

Affiche en temps reel (ou cache toutes les heures) :
  "X avis rendus" → COUNT(*) FROM answers WHERE is_paid = true
  "X% de satisfaction" → AVG(score) FROM ratings (converti en pourcentage)
  "X experts verifies" → COUNT(*) FROM experts WHERE is_verified = true AND is_active = true

Cache le resultat dans une variable globale mise a jour toutes les heures
(pas besoin de requete SQL a chaque visite - trop lent)

Route API : GET /api/stats/public
  Retourne : { total_answers, satisfaction_rate, active_experts }
  Resultat mis en cache avec revalidation toutes les 3600 secondes (Next.js cache)


--- RECOMMANDE 11 : SEO DE BASE ---

Fichier app/layout.tsx - metadata globales :
  Utilise les variables .env pour ne rien avoir en dur :
    title: process.env.NEXT_PUBLIC_APP_NAME
    description: process.env.NEXT_PUBLIC_APP_TAGLINE
    openGraph:
      title: process.env.NEXT_PUBLIC_APP_NAME
      description: process.env.NEXT_PUBLIC_APP_TAGLINE
      url: process.env.NEXT_PUBLIC_APP_URL
      siteName: process.env.NEXT_PUBLIC_APP_NAME

Fichier app/sitemap.ts :
  Genere automatiquement le sitemap XML
  Liste toutes les pages publiques + profils experts actifs

Fichier app/robots.txt :
  Autorise Google sur les pages publiques
  Bloque les pages /admin, /api, /mes-demandes

Image Open Graph (app/opengraph-image.png) :
  Image 1200x630px affichee quand le lien est partage sur WhatsApp ou reseaux sociaux
  Contient le logo + le tagline


--- RECOMMANDE 12 : ANALYTICS ---

Service recommande : Plausible Analytics
  Pourquoi : 100% RGPD, pas de cookies, pas de consentement necessaire, gratuit 30 jours
  Alternative : Google Analytics (necessite bandeau cookies)

Installation :
  npm install next-plausible

Dans .env : NEXT_PUBLIC_PLAUSIBLE_DOMAIN=Avisbox.be
  Si vide ou en local → analytics desactives automatiquement

Ce que ca mesure :
  - Nombre de visiteurs uniques par jour
  - Pages les plus visitees
  - Taux de conversion (visiteurs → inscription → premiere demande)
  - D ou viennent les visiteurs (Google, direct, reseaux sociaux)


--- RECOMMANDE 13 : PAGE "A PROPOS" ---

Page /a-propos
  Contenu :
    - Qui tu es (en restant vague si tu le souhaites - "Developpe par un etudiant belge")
    - Pourquoi tu as cree Avisbox (histoire courte et authentique)
    - La mission : "Democratiser l acces aux avis professionnels"
    - Valeurs : transparence, entraide, protection du consommateur
    - Comment contacter : process.env.EMAIL_CONTACT
    - Lien vers /devenir-expert pour recruter des experts
  Ton : personnel et humain - pas corporatif


--- RECOMMANDE 14 : RECU FISCAL ANNUEL POUR LES EXPERTS ---

Chaque expert qui a recu des paiements a besoin d un document fiscal annuel.
Sans ca, tu recevras des emails chaque janvier : "J ai gagne combien l an dernier ?"

Page /expert/gains :
  Bouton "Telecharger mon recapitulatif [annee]"
  Genere un PDF contenant :
    - Nom et coordonnees de l expert
    - Periode : du 01/01/[annee] au 31/12/[annee]
    - Tableau : date de paiement, titre de la demande, montant recu (2 euros)
    - Total annuel
    - Mention : "Document genere par Avisbox - conserver pour votre declaration fiscale"
    - Nom de la plateforme et email de contact (depuis .env)

Route API : GET /api/expert/fiscal-summary?year=2026
  Auth requise : expert connecte
  Genere le PDF avec la librairie pdf-lib ou react-pdf
  Retourne le fichier PDF en telechargement direct


# ============================================================
# SECTION RGPD - CONFORMITE COMPLETE
# ============================================================

# Loi applicable : Reglement General sur la Protection des Donnees (RGPD)
# + Loi belge du 30 juillet 2018 relative a la protection des personnes physiques
# Autorite de controle en Belgique : Autorite de protection des donnees (APD)

--- DONNEES COLLECTEES ET LEUR JUSTIFICATION ---

Clients :
  - Nom complet        → necessaire pour identifier le compte (base : contrat)
  - Email              → necessaire pour la connexion et les notifications (base : contrat)
  - Historique demandes → necessaire pour le service (base : contrat)
  - IP de connexion    → securite du compte (base : interet legitime)
  - Stripe customer ID → paiements (base : contrat)

Experts :
  - Nom, bio, ville    → affichage profil public (base : consentement explicite)
  - Email              → connexion et notifications (base : contrat)
  - Justificatif pro   → verification identite (base : obligation legale)
  - Stripe account ID  → paiement des gains (base : contrat)
  - IP signature charte → preuve juridique (base : interet legitime)

--- DROITS DES UTILISATEURS ET IMPLEMENTATION ---

Droit d acces (article 15 RGPD) :
  L utilisateur peut demander toutes ses donnees.
  Implementation : bouton "Telecharger mes donnees" dans /mon-compte
  Genere un fichier JSON avec toutes ses donnees dans les 30 jours.
  Cote admin : page /admin/rgpd avec les demandes en attente.

Droit de rectification (article 16 RGPD) :
  L utilisateur peut corriger ses donnees personnelles.
  Implementation : formulaire d edition dans /mon-compte
  L admin peut aussi modifier depuis /admin/utilisateurs/[id] ou /admin/experts/[id].
  Chaque modification est tracee dans audit_logs (qui a modifie quoi et quand).

Droit a l effacement (article 17 RGPD) :
  L utilisateur peut demander la suppression de ses donnees.
  ATTENTION : certaines donnees doivent etre conservees meme apres effacement :
    - Les transactions financieres (obligation comptable : 7 ans en Belgique)
    - Les logs de signalements (preuve juridique en cas de litige)
  Implementation : le compte est anonymise (email → effaced_[id]@deleted.com,
  nom → "Utilisateur supprime") mais les transactions restent avec un ID anonyme.
  L admin traite ces demandes depuis /admin/rgpd.

Droit a la portabilite (article 20 RGPD) :
  L utilisateur peut recevoir ses donnees dans un format lisible.
  Implementation : export JSON genere automatiquement depuis /admin/rgpd.

--- SECURITE DES DONNEES ---

Chiffrement en transit : HTTPS obligatoire (Vercel + Supabase le gerent)
Chiffrement au repos : Supabase chiffre les donnees au repos par defaut
Acces limite : seul l admin peut acceder aux donnees personnelles depuis /admin
Mots de passe : jamais stockes en clair - geres par Supabase Auth (bcrypt)
Tokens Stripe : jamais stockes - Stripe gere les donnees de carte directement
Duree de conservation : donnees actives = toute la duree du compte
                        apres suppression = anonymisation immediate sauf exceptions legales

--- MODIFICATIONS DE DONNEES PAR L ADMIN (RGPD) ---

Quand l admin modifie une donnee personnelle depuis /admin :
  1. L ancienne valeur est sauvegardee dans audit_logs avant modification
  2. La nouvelle valeur est appliquee en base de donnees
  3. Un log est cree avec : qui (admin), quoi (champ modifie), quand, pourquoi

Quand l admin efface un compte (droit a l oubli) :
  1. L email est remplace par : effaced_[uuid]@deleted.Avisbox.be
  2. Le nom est remplace par : "Compte supprime"
  3. La bio et les infos de contact sont effacees
  4. Les transactions et signalements restent avec l ID anonymise
  5. Un log d effacement est cree dans audit_logs
  6. Un email de confirmation est envoye a l ancienne adresse email

--- PAGE /admin/rgpd ---

Contenu :
  - Liste des demandes RGPD en attente (acces, rectification, effacement, portabilite)
  - Pour chaque demande : type, demandeur, date, statut, bouton traiter
  - Page detail d une demande :
      - Infos du demandeur
      - Type de demande
      - Champ notes admin
      - Bouton "Generer export JSON" (pour acces et portabilite)
      - Bouton "Anonymiser le compte" (pour effacement)
      - Bouton "Marquer comme traite"

--- PAGE /admin/audit ---

Contenu :
  - Journal chronologique de toutes les actions admin
  - Filtre par type d action, par date, par utilisateur concerne
  - Chaque ligne : action faite, sur qui, par qui (admin), quand, ancienne valeur




# ============================================================
# SECTION 11 - CONVENTIONS DE CODE
# ============================================================

--- ORTHOGRAPHE ---
Mettre les accents et les apostrophes dans les commentaires et le texte pour que ce soit professionnel.
Ne jamais utiliser de tiret long IA (- ou --) dans le code, les composants, les textes UI, les emails ou les commentaires.
Utiliser uniquement des tirets classiques courts (-) quand un tiret est necessaire.

--- NOMMAGE ---

Composants React : PascalCase (ex: RequestCard.tsx)
Fonctions et variables : camelCase (ex: getUserRequests)
Constantes : UPPER_SNAKE_CASE (ex: MAX_FILE_SIZE)
Fichiers non-composants : kebab-case (ex: check-expired.ts)
Tables BDD : snake_case (ex: expert_applications)

--- COMMENTAIRES ---

Chaque fonction doit avoir un commentaire au-dessus expliquant ce qu elle fait.
Les commentaires sont en francais, simples, en 1 ou 2 lignes maximum.
Exemple :

  // Retourne toutes les demandes de l utilisateur connecte, du plus recent au plus ancien
  async function getUserRequests(userId: string) {
    ...
  }

Les sections importantes dans un fichier sont separees par un commentaire de bloc :

  // ---- Gestion des fichiers ----

--- SEPARATION DU CODE ---

Ne jamais mettre de logique SQL dans un composant React.
La logique de base de donnees va dans /lib/ ou dans les routes /api/.
Les composants React affichent des donnees, ils ne les fetchen pas directement.
Un fichier = une responsabilite. Pas de fichiers de 500 lignes.

--- TYPES TYPESCRIPT ---

Toutes les interfaces sont dans /types/index.ts
Exemple de types principaux a definir :

  interface User {
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string | null
    is_adult_confirmed: boolean
    marketing_emails: boolean
    is_blocked: boolean
    stripe_customer_id: string | null
    created_at: string
  }

  interface Expert {
    id: string
    user_id: string
    display_name: string
    photo_url: string | null
    bio: string | null
    categories: string[]
    years_experience: number
    city: string
    languages: string[]
    availabilities: string | null
    website_url: string | null
    first_name: string
    last_name: string
    email: string
    phone: string
    address_street: string
    address_zip: string
    address_city: string
    address_country: string
    entity_type: 'individual' | 'company'
    company_name: string | null
    bce_number: string | null
    vat_number: string | null
    justification_url: string | null
    is_verified: boolean
    is_active: boolean
    is_blocked: boolean
    suspension_reason: string | null
    suspension_type: 'manual' | 'auto_rating' | 'auto_contest' | null
    suspended_at: string | null
    average_rating: number
    total_answers: number
    total_signals: number
    response_rate: number
    stripe_account_id: string | null
    created_at: string
  }

  interface ExpertApplication {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    display_name: string
    bio: string | null
    categories: string[]
    years_experience: number
    city: string
    languages: string[]
    entity_type: 'individual' | 'company'
    company_name: string | null
    bce_number: string | null
    vat_number: string | null
    motivation: string | null
    document_url: string
    status: 'pending' | 'approved' | 'rejected'
    admin_notes: string | null
    created_at: string
  }

  interface SuspensionLog {
    id: string
    expert_id: string
    action: 'suspended' | 'reactivated'
    type: 'manual' | 'auto_rating' | 'auto_contest' | null
    reason: string | null
    related_answer_id: string | null
    related_signalement_id: string | null
    contest_decision: 'validate' | 'refund' | null
    created_by: 'admin' | 'system'
    created_at: string
  }

  interface Payout {
    id: string
    expert_id: string
    amount_cents: number
    stripe_transfer_id: string | null
    status: 'pending' | 'paid'
    created_at: string
  }

  interface Request {
    id: string
    user_id: string
    category: 'mecanique' | 'immo' | 'travaux' | 'assurance' | 'travail' | 'comptabilite'
    title: string
    description: string
    attachments: string[]
    status: 'pending' | 'answered' | 'contested' | 'refunded' | 'closed'
    amount_cents: number
    stripe_payment_intent_id: string | null
    expires_at: string
    created_at: string
  }

  interface Answer {
    id: string
    request_id: string
    expert_id: string
    content: string
    verdict: string | null
    delivered_at: string
    contest_window_ends: string
    payment_eligible_at: string
    is_contested: boolean
    contest_reason: string | null
    contest_resolved: boolean
    contest_decision: 'validate' | 'refund' | null
    admin_decision_at: string | null
    is_paid: boolean
    created_at: string
  }

  interface Rating {
    id: string
    answer_id: string
    user_id: string
    expert_id: string
    score: number
    comment: string | null
    created_at: string
  }


# ============================================================
# SECTION 12 - CONFIGURATION VERCEL CRON JOB
# ============================================================

# Contenu du fichier vercel.json a la racine du projet

{
  "crons": [
    {
      "path": "/api/cron/check-expired",
      "schedule": "0 * * * *"
    }
  ]
}

# "0 * * * *" signifie : a la minute 0 de chaque heure, toutes les heures


# ============================================================
# SECTION 13 - LOGIQUE DU CRON JOB (DETAIL)
# ============================================================

# Fichier : /app/api/cron/check-expired/route.ts
# Ce code est execute automatiquement toutes les heures par Vercel

Etapes du cron job :

  1. Verifier le header Authorization (securite)
     Si le token ne correspond pas a CRON_SECRET → retourner erreur 401

  --- Partie A : Remboursements pour demandes expirees ---

  2. Chercher dans la table requests :
     WHERE status = 'pending'
     AND expires_at < NOW()

  3. Pour chaque demande expiree :
     a. Appeler stripe.refunds.create({ payment_intent: stripe_payment_intent_id })
     b. Mettre le status a 'refunded'
     c. Envoyer un email a l utilisateur (template Refunded.tsx)
     d. Logger pour l admin

  --- Partie B : Paiements experts apres 5 jours ---

  4. Chercher dans la table answers :
     WHERE is_paid = false
     AND is_contested = false
     AND contest_window_ends < NOW()    -- fenetre 48h terminee
     AND payment_eligible_at < NOW()   -- 5 jours ecoules

  5. Pour chaque reponse eligible :
     a. Recuperer le montant depuis : process.env.NEXT_PUBLIC_EXPERT_PAYMENT_CENTS (200 par defaut)
     b. Appeler stripe.transfers.create({ amount: EXPERT_PAYMENT_CENTS, destination: expert.stripe_account_id })
     c. Mettre is_paid = true sur la reponse
     d. Envoyer un email a l expert (template ExpertPaymentSent.tsx)
     e. Logger le paiement dans la table payouts

  --- Partie C : Nettoyage des demandes avec paiement non confirme ---

  6. Chercher dans la table requests :
     WHERE payment_confirmed = false
     AND created_at < NOW() - 5 minutes

  7. Supprimer toutes ces demandes abandonnees
     L utilisateur avait 5 minutes pour finaliser son paiement Stripe.
     Passé ce delai, la demande est supprimee. Aucun email envoye (paiement jamais effectue).

  Retourne : { refunded_count, paid_count, cleaned_count }

  Calcul de expires_at a la creation d une demande (dans POST /api/requests) :

    function calculerExpiration(createdAt: Date): Date {
      // On ajoute 24 heures a la date de creation
      const expiration = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)

      // Si l expiration tombe un samedi (jour 6) ou un dimanche (jour 0)
      // on la deplace au lundi suivant a la meme heure
      const jour = expiration.getDay()

      if (jour === 6) {
        // Samedi → ajouter 2 jours pour aller au lundi
        expiration.setDate(expiration.getDate() + 2)
      } else if (jour === 0) {
        // Dimanche → ajouter 1 jour pour aller au lundi
        expiration.setDate(expiration.getDate() + 1)
      }

      // L heure reste exactement la meme, seule la date change
      return expiration
    }

  Exemples de ce que cette fonction produit :
    Vendredi 09h00  → +24h = Samedi 09h00  → jour=6 → +2 jours → Lundi 09h00
    Vendredi 15h30  → +24h = Samedi 15h30  → jour=6 → +2 jours → Lundi 15h30
    Vendredi 22h00  → +24h = Samedi 22h00  → jour=6 → +2 jours → Lundi 22h00
    Mercredi 14h00  → +24h = Jeudi 14h00   → jour=4 → inchange  → Jeudi 14h00
    Lundi 08h00     → +24h = Mardi 08h00   → jour=2 → inchange  → Mardi 08h00


# ============================================================
# SECTION 14 - ORDRE DE DEVELOPPEMENT RECOMMANDE
# ============================================================

Semaine 1-2 : FONDATIONS
  [x] Projet Next.js cree (TypeScript, Tailwind, App Router)
  [x] shadcn/ui installe
  [x] Compte Supabase cree + schema SQL complet execute (13 tables)
  [x] Colonnes SQL additionnelles ajoutees dans requests (voir Section 16)
  [x] Fichier .env.local configure (voir Section 7)
  [x] /lib/supabase/, /lib/config.ts, /types/index.ts crees
  [x] Page d accueil / avec compteur public
  [x] Header avec navigation selon role (user/expert/admin)
  [x] Bucket Supabase Storage "documents" cree

Semaine 3 : AUTHENTIFICATION
  [x] Pages /register, /login, /auth/confirm, /auth/forgot-password, /auth/reset-password
  [x] Routes API /register, /login, /logout, /forgot-password, /reset-password, /me
  [x] proxy.ts : protection des routes + redirect apres login
  [x] Composants Header.tsx et CookieBanner.tsx
  [x] Test : inscription, connexion, mot de passe oublie, deconnexion

Semaine 4 : DEMANDES UTILISATEUR
  [x] Page /nouvelle-demande en 3 etapes (categorie, description + upload, paiement Stripe)
  [x] Pages /mes-demandes, /mes-demandes/[id], /mes-demandes/[id]/signaler, /mon-compte
  [x] Routes API /api/requests (GET, POST), /api/requests/[id] (GET, DELETE, upload, receipt, verify-payment)
  [x] Routes API /api/user/profile, /api/user/change-password
  [x] Paiement Stripe avec gestion des erreurs (carte refusee, solde insuffisant, expiree)
  [x] Upload fichiers avec validation serveur (taille + type MIME)
  [x] Nettoyage auto des demandes non payees apres 5 min
  [x] Test : payer, voir le recu PDF, tester cartes refusees

Semaine 5 : ESPACE EXPERT
  [x] Pages /expert/dashboard, /expert/demandes/[id], /expert/mes-reponses, /expert/gains, /expert/profil
  [x] Pages publiques /experts, /experts/[id]
  [x] Routes API expert (requests, answer, lock, answers, balance, profile, photo, change-password)
  [x] Routes API publiques /api/experts, /api/experts/[id]
  [x] Route /api/answers/[id]/contest (signalement client)
  [x] Route /api/ratings (notation + suspension automatique)
  [x] Route /api/cron/check-expired (remboursements + paiements + nettoyage)
  [x] Composants ExpertGuard.tsx, StarRating.tsx
  [x] Protection double soumission : verrou 10 min en DB
  [x] Upload photo de profil expert
  [ ] Test : flux complet client → expert → reponse → signalement → reactivation admin

Semaine 6 : EMAILS
  [x] Resend et react-email installes
  [x] 17 templates email crees (voir liste Section 6)
  [x] Emails branches sur les bonnes routes API (reponse, signalement, remboursement, paiement)
  [x] Test : verifier chaque email dans Resend dashboard

Semaine 7 : PAIEMENTS STRIPE
  [x] Stripe Checkout integre avec gestion des erreurs
  [x] Route /api/stripe/webhook
  [x] Stripe Connect Express pour virements experts
  [x] Page /expert/gains avec recu fiscal annuel PDF
  [x] Test complet : payer, voir recu, expert voit son paiement en attente

Semaine 8 : CRON JOB ET SIGNALEMENTS
  [x] Route /api/cron/check-expired (3 parties : expiration, paiement expert, nettoyage)
  [x] Cron job configure dans vercel.json (toutes les heures)
  [x] Route /api/ratings avec suspension automatique (3x1 etoile ou moyenne < 4.2)
  [x] Route /api/answers/[id]/contest avec blocage expert + emails bilateraux
  [x] Route /api/answers/[id]/contest trace suspension dans suspension_logs ET audit_logs
  [x] Cron job : protection race condition via fonction PostgreSQL atomique refund_expired_request()
      → SELECT FOR UPDATE garantit qu'un expert ne peut pas repondre pendant le remboursement
      → Fonction SQL a creer dans Supabase (voir Section 16)
  [x] Test : simuler un signalement, verifier que l expert est bloque

Semaine 9 : PAGES LEGALES ET SEO
  [x] Pages /cgu, /politique-confidentialite, /mentions-legales, /a-propos
  [x] Pages /comment-poser-ma-question, /devenir-expert
  [x] app/sitemap.ts et app/robots.ts
  [x] Metadata SEO dans chaque page (title, description, og)
  [x] Footer avec liens legaux
  [x] Charte expert : page /expert/charte + route API + signature avec IP
  [x] Suppression de compte client et expert (anonymisation RGPD)
  [x] Widget d assistance IA pour les visiteurs
  [ ] Image Open Graph 1200x630px
  [ ] Plausible Analytics (quand domaine disponible)

Semaine 10 : ADMIN
  [x] Toutes les pages admin : /admin, /admin/experts, /admin/utilisateurs, /admin/signalements
  [x] Pages /admin/candidatures, /admin/demandes, /admin/demandes/[id], /admin/finances
  [x] Pages /admin/rgpd, /admin/audit, /admin/avis, /admin/paiements, /admin/marketing
  [x] Toutes les routes API admin correspondantes
  [x] Verification email obligatoire dans proxy.ts pour /admin, /expert et pages client
  [x] Protection brute force : blocage 15 min apres 3 echecs (voir Section 16 : login_attempts)
  [x] Corrections UX : affichage heures, statuts apres arbitrage, badges notifications sidebar
  [x] Corrections admin : filtres avis, calcul frais Stripe, recherche RGPD et audit
  [x] Corrections emails : salutation personnalisee, liens vers pages client/expert
  [x] Corrections financieres : page paiements, raison remboursement, arrondi frais Stripe
  [x] Badges sidebar admin : orange (experts suspendus) + rouge (experts non verifies) sur lien Experts
  [x] Signalement accepte (client rembourse) : expert perd 1 etoile (minimum 0)
  [x] Categories actives dynamiquement : minimum 2 experts actifs et verifies requis par categorie
  [x] Route GET /api/stats/categories : compteur experts par categorie (cache 5 min)
  [x] POST /api/requests : validation serveur - refuse si moins de 2 experts dans la categorie
  [x] Page /nouvelle-demande : affiche "Pas assez d'experts" si categorie non disponible
  [x] Suppression compte expert depuis /admin/experts/[id] : bouton + raison obligatoire + email ExpertDeleted
  [x] Route DELETE /api/admin/experts/[id] : email avant suppression + cascade FK + audit_log
  [x] Email ExpertDeleted.tsx cree (emails/ExpertDeleted.tsx)
  [ ] Test : simuler tout le cycle complet (inscription → demande → reponse → signalement → arbitrage)

Semaine 11 : SECURITE
  [x] Protection brute force login (table login_attempts, blocage 15 min apres 3 echecs)
  [x] Rate limiting : /login (3/15 min), /forgot-password (3/15 min), /register (5/heure par IP)
  [x] Verification email obligatoire avant acces aux pages protegees (proxy.ts)
  [x] Protection CRON_SECRET sur le cron job
  [x] Validation fichiers uploades cote serveur (taille + type MIME)
  [x] Stripe webhook verifie avec STRIPE_WEBHOOK_SECRET
  [x] Protection double soumission expert (verrou DB locked_by / locked_at)
  [x] Headers HTTP de securite dans next.config.ts (X-Frame-Options, HSTS, CSP partiel...)
  [x] Row Level Security (RLS) active sur toutes les tables (voir Section 16 : RLS)
  [x] Audit log sur toutes les modifications de donnees personnelles
  [x] Audit dependances npm (0 vulnerabilite apres npm audit fix)
  [x] Sentry installe et configure (npm install @sentry/nextjs + wizard)
  [ ] Content Security Policy (CSP) strict - a faire apres mise en production

Semaine 12 : DEPLOIEMENT ET MONITORING
  [ ] Creer compte Vercel, connecter le repo GitHub
  [ ] Configurer toutes les variables .env sur Vercel (dont SENTRY_AUTH_TOKEN)
  [ ] Passer STRIPE_SECRET_KEY en sk_live_ pour la production
  [ ] Tester le deploiement complet en production
  [ ] Verifier que le cron job fonctionne sur Vercel
  [ ] Configurer le domaine (1 ligne dans .env)

En cours / Prevu :
  [ ] Mode nuit (dark mode) : theme bleu fonce inspire de l image Open Graph
      Choix utilisateur : Jour / Nuit / Auto (selon theme OS)
      Bouton en haut a droite dans le Header
      Theme jour : bleu et blanc (actuel)
      Theme nuit : bleu fonce (#0f172a) et bleu (#3b82f6) comme l OG image
  [ ] Test cycle complet : inscription → demande → reponse → signalement → arbitrage



# ============================================================
# SECTION 15 - CE QUE CLAUDE DOIT TOUJOURS FAIRE
# ============================================================

Quand tu generes du code pour ce projet :

1. Toujours expliquer en 2 lignes ce que tu vas ecrire avant de l ecrire
2. Toujours ajouter un commentaire au-dessus de chaque fonction
3. Toujours utiliser les types TypeScript definis dans /types/index.ts
4. Toujours utiliser Tailwind pour le style, jamais de style inline
5. Toujours utiliser les composants shadcn/ui disponibles plutot qu en creer
6. Toujours utiliser le client Supabase server-side dans les routes API
7. Toujours valider les donnees recues avec zod avant de les utiliser
8. Toujours verifier que l utilisateur connecte est autorise a acceder a la ressource
9. Toujours gerer les erreurs avec un try/catch et retourner des messages clairs
10. Ne jamais generer des fichiers de plus de 150 lignes sans le signaler et proposer de decouper
11. Ne jamais utiliser d emoji dans le code, les composants, les messages d erreur, ou les commentaires

Quand l utilisateur (moi) te decrit un probleme ou un bug :
1. Demander quel fichier est concerne et coller le code si necessaire
2. Expliquer d abord pourquoi le probleme se produit
3. Proposer la solution la plus simple possible
4. Appliquer la correction avec commentaire

--- SECURITE : PROTECTIONS AUTOMATIQUES DES TECHNOLOGIES ---

  SQL Injection : Supabase client JS utilise des requetes parametrees automatiquement.
    Ne jamais concatener de chaines dans les requetes → toujours .eq('email', email).
  XSS : React echappe automatiquement. Ne jamais utiliser dangerouslySetInnerHTML avec du contenu utilisateur.
  CSRF : Next.js App Router + cookies httpOnly Supabase → protection automatique.
  Donnees carte : jamais stockees, Stripe gere tout (certifie PCI DSS Level 1).
  Mots de passe : jamais vus en clair, Supabase Auth gere le hachage (bcrypt).
  Chiffrement : HTTPS force par Vercel, donnees au repos chiffrees par Supabase (AES-256).
  DDoS : Vercel integre une protection basique. Ajouter Cloudflare en production si besoin.

--- SECURITE : REGLES DE CODE PERMANENTES ---

  1. Toujours revalider avec zod cote serveur dans chaque route API.
  2. Chaque route API commence par : const { data: { user } } = await supabase.auth.getUser()
  3. Toujours verifier que request.user_id === user.id avant de retourner une ressource.
  4. Les cles service_role et STRIPE_SECRET_KEY n ont jamais le prefixe NEXT_PUBLIC_.
  5. Les messages d erreur ne revelent jamais les noms de tables, colonnes, ou IDs internes.
  6. Toujours verifier taille ET type MIME des fichiers uploades cote serveur (pas seulement l extension).


# ============================================================
# SECTION 16 - COMMANDES SQL A EXECUTER DANS SUPABASE
# ============================================================

# Ces commandes sont a executer une seule fois dans Supabase → SQL Editor.
# Elles completent le schema de base defini en Section 8.
# Les colonnes et tables creees ici ne font pas partie du schema initial.


--- 1. COLONNES AJOUTEES A LA TABLE requests ---

# A executer apres avoir cree la table requests avec le schema de la Section 8.
# Ces colonnes ne sont pas dans le CREATE TABLE initial car elles ont ete ajoutees en cours de developpement.

  ALTER TABLE requests ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;
  ALTER TABLE requests ADD COLUMN IF NOT EXISTS refund_reason TEXT;
  ALTER TABLE requests ADD COLUMN IF NOT EXISTS locked_by UUID;
  ALTER TABLE requests ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;


--- 2. TABLE login_attempts (protection brute force et rate limiting) ---

# Stocke les tentatives de connexion echouees pour bloquer les attaques par force brute.
# Reutilisee avec des cles prefixees pour le rate limiting des routes /forgot-password et /register.

  CREATE TABLE login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_login_attempts ON login_attempts (email, created_at);


--- 3. ROW LEVEL SECURITY (RLS) - protection des donnees par utilisateur ---

# Principe : meme si quelqu un obtient la cle anon, il ne peut pas lire les donnees des autres.
# createAdminClient() utilise service_role → bypass le RLS automatiquement (voulu pour l admin).
# createClient() utilise la session de l utilisateur connecte → soumis au RLS.

# Active le RLS sur toutes les tables sensibles
  ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
  ALTER TABLE experts             ENABLE ROW LEVEL SECURITY;
  ALTER TABLE requests            ENABLE ROW LEVEL SECURITY;
  ALTER TABLE answers             ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ratings             ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payouts             ENABLE ROW LEVEL SECURITY;
  ALTER TABLE gdpr_requests       ENABLE ROW LEVEL SECURITY;
  ALTER TABLE expert_applications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE expert_charters     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE consents            ENABLE ROW LEVEL SECURITY;
  ALTER TABLE suspension_logs     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
  ALTER TABLE admin_emails        ENABLE ROW LEVEL SECURITY;
  ALTER TABLE login_attempts      ENABLE ROW LEVEL SECURITY;

  -- TABLE users : chaque client voit et modifie uniquement son propre profil
  CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

  -- TABLE experts : profil public visible par tous, modification reservee au proprietaire
  CREATE POLICY "experts_select_public" ON experts FOR SELECT USING (is_verified = true AND is_active = true);
  CREATE POLICY "experts_select_own"    ON experts FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "experts_update_own"    ON experts FOR UPDATE USING (auth.uid() = user_id);

  -- TABLE requests : visible uniquement par le client proprietaire
  CREATE POLICY "requests_select_own" ON requests FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "requests_insert_own" ON requests FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- TABLE answers : visible par le client de la demande ou l expert qui a repondu
  CREATE POLICY "answers_select_client" ON answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM requests WHERE requests.id = answers.request_id AND requests.user_id = auth.uid())
  );
  CREATE POLICY "answers_select_expert" ON answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM experts WHERE experts.id = answers.expert_id AND experts.user_id = auth.uid())
  );
  CREATE POLICY "answers_insert_expert" ON answers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM experts WHERE experts.id = answers.expert_id AND experts.user_id = auth.uid())
  );

  -- TABLE ratings : lecture publique, ecriture reservee au client proprietaire de la demande
  CREATE POLICY "ratings_select_all"    ON ratings FOR SELECT USING (true);
  CREATE POLICY "ratings_insert_own"    ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- TABLE payouts : visible uniquement par l expert concerne
  CREATE POLICY "payouts_select_own" ON payouts FOR SELECT USING (
    EXISTS (SELECT 1 FROM experts WHERE experts.id = payouts.expert_id AND experts.user_id = auth.uid())
  );

  -- TABLE gdpr_requests : visible uniquement par le demandeur
  CREATE POLICY "gdpr_select_own" ON gdpr_requests FOR SELECT USING (
    (requester_type = 'user'   AND auth.uid() = requester_id) OR
    (requester_type = 'expert' AND EXISTS (SELECT 1 FROM experts WHERE experts.id = requester_id AND experts.user_id = auth.uid()))
  );
  CREATE POLICY "gdpr_insert_own" ON gdpr_requests FOR INSERT WITH CHECK (
    (requester_type = 'user'   AND auth.uid() = requester_id) OR
    (requester_type = 'expert' AND EXISTS (SELECT 1 FROM experts WHERE experts.id = requester_id AND experts.user_id = auth.uid()))
  );

  -- TABLE expert_applications : visible uniquement par le candidat
  CREATE POLICY "applications_select_own" ON expert_applications FOR SELECT USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );
  CREATE POLICY "applications_insert_own" ON expert_applications FOR INSERT WITH CHECK (true);

  -- TABLE expert_charters : visible uniquement par l expert signataire
  CREATE POLICY "charters_select_own" ON expert_charters FOR SELECT USING (
    EXISTS (SELECT 1 FROM experts WHERE experts.id = expert_charters.expert_id AND experts.user_id = auth.uid())
  );

  -- TABLE consents : visible uniquement par le proprietaire
  CREATE POLICY "consents_select_own" ON consents FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM experts WHERE experts.id = consents.expert_id AND experts.user_id = auth.uid())
  );

  -- Tables admin : aucun acces direct via cle anon (service_role uniquement)
  -- Pas de policy = aucun acces possible sans service_role
  -- suspension_logs, audit_logs, admin_emails, login_attempts : acces service_role uniquement

# IMPORTANT : apres avoir active le RLS, tester les routes API pour verifier qu aucune n est cassee.
# Si une route retourne une erreur inattendue, verifier qu elle utilise bien createAdminClient()
# pour les operations admin et createClient() pour les operations utilisateur.


--- 4. FONCTION PostgreSQL - protection race condition remboursement ---

# Garantit qu'un expert ne peut pas repondre pendant qu'un remboursement est en cours.
# A executer une seule fois dans Supabase → SQL Editor.

  CREATE OR REPLACE FUNCTION refund_expired_request(p_request_id UUID)
  RETURNS TEXT AS $$
  DECLARE
    v_status TEXT;
    v_payment_intent TEXT;
  BEGIN
    SELECT status, stripe_payment_intent_id
    INTO v_status, v_payment_intent
    FROM requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_status != 'pending' THEN
      RETURN 'skipped';
    END IF;

    UPDATE requests SET status = 'refunded' WHERE id = p_request_id;

    RETURN v_payment_intent;
  END;
  $$ LANGUAGE plpgsql;


# ============================================================
# FIN DU FICHIER CLAUDE.md
# ============================================================