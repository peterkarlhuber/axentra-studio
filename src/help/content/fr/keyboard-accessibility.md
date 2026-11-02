---
title: Clavier et accessibilité
summary: Comment utiliser le Studio au clavier, avec un lecteur d’écran, le zoom, les animations réduites et un thème clair ou sombre, et quelles lacunes sont connues.
keywords: accessibilité, a11y, clavier, raccourcis clavier, tabulation, focus, lecteur d’écran, NVDA, JAWS, VoiceOver, zoom, agrandissement, contraste, mode sombre, mode clair, thème, animations réduites, réduire les animations, WCAG, RGAA
---

Le Studio est conçu pour respecter le niveau AA des WCAG 2.1. Chaque fonction est utilisable au
clavier, la structure des pages est correctement annoncée par les lecteurs d’écran, et le Studio
suit les réglages de ton système pour le jeu de couleurs et les animations. Chaque version est
vérifiée automatiquement avec le moteur d’accessibilité axe-core sur chaque page, dans le thème
clair et le thème sombre, sur un écran d’ordinateur et sur un écran de téléphone de 360 pixels de
large.

## Utilisation au clavier {#keyboard}

| Touche                                          | Effet                                                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Tab** / **Maj+Tab**                           | Passer à la commande suivante ou précédente.                                                                   |
| **Tab** juste après le chargement d’une page    | Atteint d’abord **Aller au contenu principal** ; **Entrée** permet de sauter la navigation.                    |
| **Entrée**                                      | Suivre un lien, actionner un bouton, envoyer un formulaire.                                                    |
| **Espace**                                      | Actionner un bouton, cocher une case, basculer un interrupteur.                                                |
| **Touches fléchées**                            | Se déplacer dans les menus, les listes de sélection et les onglets ; **Entrée** ou **Espace** valide le choix. |
| **Échap**                                       | Fermer une boîte de dialogue, un tiroir, un menu, une infobulle ou la navigation mobile.                       |
| **F8**                                          | Aller à la zone des notifications (les messages dans un coin de l’écran).                                      |
| **Entrée** dans un champ **Types d’événements** | Ajoute le type d’événement saisi à la liste.                                                                   |

Bon à savoir :

- **Les boîtes de dialogue gardent le focus à l’intérieur** tant qu’elles sont ouvertes, et le
  rendent au bouton qui les a ouvertes lorsqu’elles se ferment.
- **Les boîtes de dialogue de secrets à usage unique ne se ferment pas avec Échap.** Les secrets de
  clés d’API et de webhooks ne sont affichés qu’une fois : la boîte de dialogue reste donc ouverte
  jusqu’à ce que tu confirmes **J’ai conservé le secret en lieu sûr**. Cela évite de perdre un
  secret par mégarde.
- **Les actions dangereuses** demandent une confirmation ; certaines, comme la révocation d’une
  clé d’API, te demandent aussi de saisir un nom (**Saisis … pour confirmer**). Cela protège contre
  les frappes accidentelles.
- **Les infobulles** (les petits boutons (i) à côté des libellés) s’ouvrent avec **Entrée** ou
  **Espace** et se ferment avec **Échap**. Elles fonctionnent au clavier, au toucher et avec les
  lecteurs d’écran, pas seulement au survol.
- **Les tableaux** comportant de nombreuses colonnes défilent dans leur propre zone étiquetée. Place
  le focus sur la zone avec **Tab** et fais-la défiler avec les touches fléchées.

## Focus {#focus}

La commande qui a le focus clavier affiche toujours un anneau visible (violet, avec un contraste
d’au moins 3:1 par rapport à son arrière-plan). Lorsque tu ouvres une autre page, le Studio place
le focus sur le titre principal de la page : tu commences ainsi par le nouveau contenu et les
lecteurs d’écran annoncent la nouvelle page.

## Lecteurs d’écran {#screen-readers}

- **Repères :** chaque page comporte un en-tête, la navigation principale et le contenu principal,
  ainsi qu’un seul titre principal.
- **Le fil d’Ariane** et la **Navigation principale** sont étiquetés. Les sections de la barre
  latérale des modules désactivés sont annoncées comme « module non activé ».
- **Formulaires :** chaque champ a un libellé visible ; les champs obligatoires sont annoncés ; les
  messages d’erreur sont reliés à leur champ.
- **Les tableaux** ont des légendes et des en-têtes de colonne, et les colonnes triables annoncent
  leur sens de tri. Le nombre « N entrées affichées » est annoncé lorsque d’autres lignes se
  chargent.
- **Les messages d’état** (copié dans le presse-papiers, chargement, notifications) sont annoncés
  via des régions dynamiques (live regions). Les notifications d’erreur sont annoncées
  immédiatement.
- **Les graphiques** ont un résumé textuel, et **Afficher le tableau de données** présente les
  mêmes valeurs sous forme de tableau.
- **Les aperçus d’e-mails** s’affichent dans un cadre isolé (sandbox) ; leur contenu textuel se lit
  normalement.

## Zoom et taille du texte {#zoom}

Tu peux agrandir le navigateur jusqu’à 200 % sans perdre de contenu ni de fonctions. Sur les
fenêtres étroites (et en cas de zoom), la mise en page s’adapte :

| Largeur de la fenêtre | Mise en page                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| 1200 px et plus       | Barre latérale complète, pages sur plusieurs colonnes                                                     |
| 960 à 1199 px         | Barre latérale complète ou repliée                                                                        |
| moins de 960 px       | La barre latérale devient un tiroir ouvert avec **Ouvrir la navigation**                                  |
| moins de 640 px       | Les colonnes de tableau les moins importantes sont masquées, les actions de la page passent sous le titre |

Les boutons standard mesurent au moins 36 pixels de haut et les grands boutons 44 pixels ;
certains boutons compacts des tableaux et des barres d’outils sont plus petits. Sur ordinateur, tu
peux réduire la barre latérale à des icônes avec **Replier la barre latérale** ; le Studio s’en
souvient pour chaque navigateur.

## Animations réduites {#reduced-motion}

Si ton système d’exploitation demande aux applications de réduire les animations, le Studio
désactive ses animations et transitions (par exemple pour les boîtes de dialogue, les menus et les
indicateurs de chargement).

## Thème clair, sombre et système {#themes}

Ouvre le menu utilisateur (ton nom dans la barre supérieure) et choisis **Thème** : **Clair**,
**Sombre** ou **Système** (suit ton système d’exploitation). Les deux thèmes sont vérifiés pour un
contraste suffisant. Ton choix est enregistré dans le navigateur et dans ton profil ; un navigateur
dans lequel tu n’as pas encore choisi de thème adopte celui de ton profil après ta connexion.

## Langue {#language}

Choisis la langue dans le menu utilisateur sous **Langue**, ou sur la page de connexion. Lorsque tu
es connecté, le choix est enregistré dans ton profil. Les dates, heures et nombres suivent la
langue choisie. Certains textes viennent du serveur et restent en anglais, par exemple les
descriptions des rôles intégrés et des autorisations, ainsi que le **Message du serveur** dans les
détails d’une erreur.

## Lacunes connues {#known-gaps}

- **Les vérifications automatiques couvrent le premier affichage de chaque page.** Les boîtes de
  dialogue, menus, tiroirs, notifications et erreurs de formulaire ouverts ne sont vérifiés que
  dans certaines sections.
- **Seul Chromium est testé automatiquement.** Firefox et Safari (WebKit) ne sont pas couverts par
  les tests automatisés.
- **Le mode de contraste élevé de Windows** (couleurs forcées) n’est pas testé spécifiquement.
- **Les graphiques sont pensés pour un pointeur.** Le survol affiche les détails de chaque point ;
  les personnes qui utilisent le clavier ou un lecteur d’écran obtiennent les mêmes valeurs via
  **Afficher le tableau de données**.
- **Les textes du serveur**, comme les descriptions des autorisations et les messages du serveur,
  sont uniquement en anglais.

Si tu rencontres un obstacle, signale-le à ton opérateur avec l’adresse de la page et les étapes qui
y ont conduit.

## Dépannage {#troubleshooting}

| Situation                                        | Que faire                                                                                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L’anneau de focus n’est pas visible              | Utilise **Tab** (l’anneau apparaît pour le focus clavier, pas pour les clics de souris). Vérifie qu’aucune extension du navigateur ne remplace les styles de la page.                     |
| Une boîte de dialogue ne se ferme pas avec Échap | Elle affiche un secret à usage unique. Copie-le et conserve-le, puis confirme **J’ai conservé le secret en lieu sûr**.                                                                    |
| Les animations sont toujours lues                | Active « réduire les animations » dans les paramètres d’accessibilité de ton système d’exploitation et recharge le Studio.                                                                |
| Le thème change à nouveau                        | Le stockage du navigateur est peut-être bloqué (par exemple en navigation privée) : le choix n’est donc pas mémorisé localement et le Studio revient au thème enregistré dans ton profil. |
| Du contenu est coupé avec un zoom élevé          | Les tableaux larges défilent dans leur propre zone ; place le focus dessus avec **Tab** et utilise les touches fléchées.                                                                  |
