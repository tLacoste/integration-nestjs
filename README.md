[playground]: http://localhost:3000/graphql
[specs]: ./test/app.e2e-spec.ts

## Projet d'intégration

### Pré-requis

- Avoir [Node.js](https://nodejs.org/) installé
- Avoir [docker](https://www.docker.com/) installé

## Ce que tu vas devoir faire

- Lancer l'API et la DB en suivant les instructions dans la section [Démarrage](#démarrage)
- Tester l'application sur le playground GraphQL à l'adresse [http://localhost:3000/graphql][playground]
- Parcourir la [documentation NestJs](https://docs.nestjs.com)
- Executer les tests e2e
- Cloner ce repository sur un respotiroy github qui pourra être accessible en public
- Effectuer les modifications nécessaires pour répondre aux [problèmes mentionnés](#travail-à-effectuer)
- A chaque question, effectuer un `commit` sur le repository public

## Démarrage

### Installation NestJs

Installation globale pour NestJs pour pouvoir utiliser la CLI

```bash
$ npm i -g @nestjs/cli
```

Pour désinstaller à la fin si tu ne veux plus NestJs sur ton ordinateur

```bash
$ npm i uninstall -g @nestjs/cli
```

### Installation

```bash
$ npm install
```

### Docker

```bash
$ docker compose up
```

### Démarrage de l'application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

### Tests end to end

```bash
# e2e tests
$ npm run test:e2e
```

#### Au début du projet, le résultat des tests end to end devrait ressembler à ça

![Au début du projet, le résultat des tests end to end devrait ressembler à ça](assets/tests_result.png 'Au début du projet, le résultat des tests end to end devrait ressembler à ça')

## Travail à effectuer

### 01

Il semblerait qu'il y ai un problème pour récupérer les adresses e-mails d'un utilisateur sur l'API.

Dans la documentation de l'API GraphQL disponible sur le [playground], on remarque que le type graphql d'un `User` n'est pas un tableau de `UserEmail[]` mais un seul `UserEmail`.

> Dans le fichier [`/test/app.e2e-spec.ts`][specs], active les tests `[02]` et `[03]` en enlevant `.skip` sur les tests en question.
>
> Voir la [documentation NestJs](https://docs.nestjs.com/graphql/resolvers) sur les resolvers GraphQL

### 02

Les filtres `equal` et `in` sur les adresses e-mails ne fonctionnent pas ensembles.
On voudrait maintenant que ce soit le cas. 

Quand les deux filtres sont présents, on voudrait en résultat avoir une liste avec l'email correspondant à `equal` mais aussi les emails faisant partie de `in`

> Dans le fichier [`/test/app.e2e-spec.ts`][specs], active le test `[06]`
>
> Voir la [documentation TypeORM](https://typeorm.io/find-options) sur les conditions dans TypeORM

### 03

Quand on essaie d'ajouter un utilisateur, on devrait contrôler la validité les données entrantes.

- Si le nom de l'utilisateur est vide, on devrait avoir l'erreur de validation **Le nom de l'utilisateur n'est pas défini**
- Si la date de naissance est définie dans le future, on devrait avoir l'erreur de validation **La date de naissance ne peut pas être définie dans le future**

> Dans le fichier [`/test/app.e2e-spec.ts`][specs], active les tests `[08]` et `[09]`
>
> Voir la [documentation NestJs](https://docs.nestjs.com/techniques/validation) sur les validateurs

### 04

La partie `EmailResolver` a un peu été laissée en plan, et rien n'a été implémenté, il n'y a que des commentaires qui expliquent rapidement ce qui doit être fait.

Ca serait bien d'implémenter ces fonctionnalités.

> Dans le fichier [`/test/app.e2e-spec.ts`][specs], active les tests `[10]`, `[11]`, `[12]` les uns après les autres

### 05

Je crois qu'on a oublié les mutations pour ajouter et supprimer des adresses e-mails pour les utilisateurs.

Deux règles à respecter :

- Une adresse e-mail doit être validée comme étant une adresse e-mail valide (nooooooooon!)
- Dès qu'un utilisateur est `inactif`, on ne devrait plus pouvoir lui ajouter d'email ou en supprimer.

> Voir la [documentation NestJs](https://docs.nestjs.com/graphql/mutations) sur les mutations GraphQL

### 06

Essayer de faire des tests unitaires / end to end pour sécuriser les développements

> Voir la [documentation NestJs](https://docs.nestjs.com/fundamentals/testing) sur les tests unitaires / e2e
