---
title: Limitations connues
summary: Ce que le Studio et le serveur Axentra ne font pas encore, ou font avec une restriction connue, et comment la contourner.
keywords: limitations, limites, problèmes connus, non pris en charge, fonctionnalité manquante, restrictions, contournement, solution de contournement, feuille de route, impossible
---

Cette page liste les restrictions que tu peux rencontrer en travaillant avec cette version du
Studio et du serveur Axentra, chacune avec une solution de contournement lorsqu’il en existe une.
Certaines viennent du Studio, d’autres du serveur ; l’API du serveur offre parfois plus que le
Studio.

## Utilisateurs et connexion {#users-sign-in}

- **Aucun compte n’est créé dans le Studio.** Les comptes proviennent de la première installation,
  de l’acceptation d’une invitation ou de la première connexion par authentification unique.
  Invite plutôt les personnes dans un locataire.
- **Pas de réinitialisation de mot de passe, de vérification d’adresse e-mail ni
  d’authentification à deux facteurs** dans Axentra lui-même. Si tu utilises l’authentification
  unique, ton fournisseur d’identité peut imposer l’authentification à deux facteurs.
- **Les fournisseurs d’authentification unique se configurent uniquement dans la configuration du
  serveur.** Le Studio ne peut ni lister, ni ajouter, ni désactiver de fournisseurs d’identité.
- **Les comptes sans adresse e-mail** (possibles avec certaines configurations d’authentification
  unique) ne peuvent pas être créés ni liés dans le Studio.
- **Pas d’export ni d’effacement des données d’une personne.** Les demandes relatives à la
  protection des données doivent être traitées par l’opérateur, dans les utilisateurs, les
  enregistrements, les sauvegardes et les journaux.
- **La limitation des tentatives de connexion est calculée par minute.** Toute personne qui connaît
  une adresse e-mail peut bloquer les connexions par mot de passe de ce compte pendant jusqu’à une
  minute en envoyant de mauvais mots de passe ; les sessions déjà ouvertes et l’authentification
  unique ne sont pas concernées.

## Rôles, autorisations et clés d’API {#access}

- **Le Studio ne peut afficher les rôles que tu peux attribuer que si tu peux lire les rôles**
  (`roles:read`). Sans cette autorisation, le champ du rôle est un simple champ de texte et le
  serveur explique un éventuel refus. Un changement de rôle effectué pendant qu’une page est
  ouverte n’est pris en compte qu’au prochain rechargement de tes autorisations par le Studio, ou
  lorsque tu recharges la page.
- **Les autorisations propres à un produit ne peuvent pas être déclarées dans le Studio.** La page
  **Autorisations** est en lecture seule ; les produits les déclarent dans leur code ou via l’API.
- **Enregistrer un rôle personnalisé supprime les autorisations de produit retirées** qui y
  figurent encore. Elles n’avaient aucun effet tant qu’elles étaient retirées, mais seraient
  revenues si le produit les avait de nouveau déclarées.
- **Les clés d’API créées par une personne ne sont pas révoquées lorsque cette personne part.**
  Passe-les en revue et révoque-les toi-même.
- **La confirmation de révocation ne liste pas les clés dérivées.** Révoquer une clé révoque aussi
  toutes les clés créées avec elle, mais le Studio n’indique pas lesquelles.

## Données et fichiers {#data-files}

- **Pas de nombre total.** Les listes affichent « N entrées affichées » et en chargent davantage à
  la demande ; l’API ne fournit, par conception, ni numéros de page ni totaux.
- **Enregistrements :** filtres uniquement sur les valeurs JSON de premier niveau, tri uniquement
  par ID, date de création ou date de mise à jour. Enregistrer un enregistrement remplace son
  objet JSON complet. Un enregistrement contient au maximum 256 Kio.
- **La recherche plein texte** ([Recherche](help:search)) porte sur un locataire à la fois et ne
  trouve que des mots entiers (pas de préfixe ni de recherche approximative). Le Studio n’ajoute pas de documents à l’index ; c’est ton produit qui le fait.
- **Sauvegardes et stockage des fichiers :** le Studio n’affiche pas l’état des sauvegardes, et la
  procédure de sauvegarde du serveur couvre la base de données ; le stockage des fichiers doit être
  sauvegardé séparément.

## Tâches, événements et webhooks {#events}

- **Mettre une tâche en file d’attente n’est proposé qu’avec `jobs:manage`.** Certains types de
  tâches peuvent aussi être mis en file d’attente par des utilisateurs de locataires, mais l’API
  n’indique pas lesquels ; le Studio ne les propose donc pas.
- **La vue des événements en direct fonctionne par interrogation périodique.** Les nouveaux
  événements apparaissent après un court délai, pas instantanément ; il n’y a pas de WebSockets.
- **La prochaine exécution d’une planification est calculée par le serveur à l’enregistrement** ;
  le Studio vérifie la syntaxe cron pendant la saisie, mais n’affiche pas d’aperçu de la prochaine
  exécution d’une expression non enregistrée. Les planifications s’exécutent en UTC.

## Utilisation et facturation {#usage-billing}

- **Les réservations ne peuvent être recherchées que par leur identifiant.** L’API ne fournit pas
  de liste des réservations.
- **Aucune donnée de carte ni coordonnée bancaire dans le Studio**, par conception. Les offres
  payantes passent par la page de paiement hébergée du prestataire de paiement.
- **Les prestataires de paiement n’ont pas été testés avec des services réels** dans cette
  version ; ils sont testés uniquement avec des prestataires simulés.

## Notifications {#notifications}

- **E-mail uniquement.** Il n’existe pas de canaux SMS ni de notifications push.
- **Pas encore de limite d’envoi par locataire** pour les notifications.

## Le Studio et le serveur {#studio-server}

- **La version du serveur n’est vérifiée qu’au chargement du Studio.** Après une mise à jour du
  serveur, recharge la page. La liste des modules activés n’est elle aussi lue qu’au chargement.
- **Des adresses distinctes pour le Studio et l’API** ne fonctionnent que si les deux appartiennent
  au même site (par exemple `studio.example.com` et `api.example.com`). La configuration
  recommandée et testée sert les deux depuis la même adresse.
- **Serveurs mono-produit avec des produits restants :** si un serveur en mode mono-produit
  contient encore d’autres produits, le Studio masque le sélecteur de produit. Les administrateurs
  de la plateforme n’accèdent aux autres produits que par la page **Produits**, et ne peuvent pas
  les y archiver.
- **Les paramètres du serveur ne peuvent pas être modifiés dans le Studio.** La page
  **Paramètres** affiche uniquement la configuration effective ; les modifications se font sur le
  serveur.
- **La limitation générale du débit des requêtes est désactivée par défaut** et comptée par
  processus serveur.

## Navigateurs, langues et accessibilité {#browsers-languages}

- **Seuls les navigateurs basés sur Chromium sont testés automatiquement.** Firefox et Safari
  devraient fonctionner, mais ne sont pas couverts par les tests automatisés.
- **Les textes du serveur sont en anglais** : les descriptions des rôles et des autorisations ainsi
  que le **Message du serveur** dans les détails d’une erreur ne sont pas traduits.
- **Les vérifications d’accessibilité couvrent le premier affichage de chaque page** ; les boîtes
  de dialogue, menus et erreurs de formulaire ouverts ne sont vérifiés que dans certaines sections.
  Voir [Clavier et accessibilité](help:keyboard-accessibility#known-gaps).

## Exploitation {#operations}

- **Aucun déploiement en production ni aucun test de charge** n’a été réalisé pour cette version ;
  il n’existe pas encore de chiffres de capacité.
- **Les migrations de base de données vont uniquement vers l’avant.** Revenir à une version
  antérieure implique de restaurer une sauvegarde.

## Pages associées {#related}

- [Dépannage](help:troubleshooting) pour les messages d’erreur et leurs solutions.
- [FAQ](help:faq) pour les questions courantes.
- [Référence des modules](help:modules-reference) pour comprendre ce qu’implique un module
  désactivé.
