# Easy Back-Office

Easy Back-Office is a tool that let you setup a pretty back-office in minutes. It works
with any MySQL database.

## Quick start

```bash
npm install easy-back-office
```

### Integration in a NestJS app

Put this piece of code in your `src/main.ts` file:

```js
import galadmin from 'easy-back-office';
import { Config } from 'easy-back-office/dist/types/Config';

const adminConfig: Config = { ... }

app.getHttpAdapter().use('/admin', galadmin(adminConfig));
```

If you are using Prisma ORM, add the following code to your `schema.prisma`.
Easy Back-Office will create a table in your database, and Prisma won't be able to
perform migrations correctly if we don't specify it.

```prisma
model galadmin_sessions {
  session_id String  @id @db.VarChar(128)
  expires    Int     @db.UnsignedInt
  data       String? @db.MediumText
}
```

### Integration in an Express app

```js
const galadmin = require('easy-back-office').default;

app.use('/admin', galadmin(adminConfig));
```

### What is adminConfig?

_adminConfig_ is the object that contains all the configuration information
about your back-office. Its properties are listed below.

### Minimal example

```js
const adminConfig = {
  name: 'Mon projet',
  sessionSecret: 'chapeaumelon',
  auth: {
    username: 'user',
    password: 'password',
  },
  mysql: {
    host: 'abc.example.com',
    user: 'root',
    password: 'password',
    database: 'monprojet',
  },
  views: [
    {
      type: 'table',
      label: 'Fruits',
      tableName: 'fruits',
      columns: [
        {
          label: 'Nom',
          name: 'fruitName',
        },
        {
          label: 'Acidité',
          name: 'acidity',
        },
      ],
    },
  ],
};
```

## Configuration

```js
const adminConfig = {
  /** Nom du projet (OBLIGATOIRE) */
  name: 'Mon projet',

  /** Chaîne de caractères aléatoires qui permet de chiffrer les cookies de session (OBLIGATOIRE) */
  sessionSecret: 'chapeaumelon',

  /** Identifiants permettant d'accéder au back-office (OBLIGATOIRE) */
  auth: {
    /** Nom d'utilisateur */
    username: 'user',

    /** Password */
    password: 'password',
  },

  /** Identifiants de connexion à la base de données (OBLIGATOIRE) */
  mysql: {
    host: 'abc.example.com',
    user: 'root',
    password: 'password',
    database: 'monprojet',
  },

  /** Clé API Google Maps pour les champs adresses et l'affichage de cartes */
  googleMapsKey: '______',

  /** Désactiver la sélection multiple dans les vues de type table */
  hideMultiselect: true,

  /** Cache l'inscription Made with love by Galadrim */
  hideBranding: true,

  views: [
    {
      /** Vue de type "table" */
      type: 'table',

      /** Nom affiché de la vue */
      label: string,

      /** Icône FontAwesome de la vue dans le menu. user affiche l'icône fa-user. */
      icon: 'user',

      /** Nom de la table MySQL */
      tableName: 'users',

      /** Nombre de résultats par page */
      limit: 100,

      /**
       * Ces champs permettent de personnaliser la requête MySQL qui gère l'affichage de la table.
       * Ils sont tous optionnels.
       *
       * SELECT {selectExpression} FROM {tableName} {join} WHERE {filters} GROUP BY {groupBy} ORDER BY {orderBy} {desc ? "DESC" : ""}
       */
      selectExpression: '*, MAX(age) AS maxAge',
      join: 'JOIN activities ON users.activity_id = activities.id',
      groupBy: 'activity_id',
      orderBy: 'maxAge',
      isDesc: true,
      filters: 'age < 50',

      /** Lorsque notClickable est à true, les résultats ne sont pas cliquables. (default: false) */
      notClickable: true,

      /** Rendre possible de créer des enregistrements (default: false) */
      canCreate: true,

      /** Groupe nominal "un nouvel élément" */
      aNewSingular: 'un nouvel utilisateur',

      /** Rendre possible de supprimer des enregistrements (default: true) */
      canDelete: true,

      /** Rendre possible de modifier des enregistrements (default: true) */
      canEdit: true,

      /** URL appelée en POST lors de la création d'un nouvel élément, avec l'ID de l'élément créé */
      createCallback: 'https://myapi.com/createCallback',

      editCallback: 'https://myapi.com/editCallback',
      deleteCallback: 'https://myapi.com/deleteCallback',

      columns: [
        {
          /** Nom affiché de la colonne (OBLIGATOIRE) */
          label: 'Poids',

          /** Nom de la colonne dans la table MySQL */
          name: 'weight',

          /** Formatter la valeur avant de l'afficher */
          formatValue: (user) => `${user.weight} kg`,

          /** Masquer la colonne dans la liste des résultats et ne l'afficher que dans le détail (default: false) */
          hideInTable: true,
        },
      ],
      subviews: [],
      recordViewPanels: [],
    },
  ],
};
```

### File upload on S3

Different column types exists, one of them is the FileColumn, allowing the
upload of a file onto AWS S3. A basic configuration would be as follow:

```js
...
  columns: [{
    label: 'Image',
    name: 'imageUrl',
    dataType: 'file',
    s3Config: {
      host: process.env.AWS_S3_HOST,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      bucket: process.env.AWS_S3_PODCAST_BUCKET_NAME,
      /** Optional, only needed when your bucket isn't public and you need to generate a signed URL */
      signedUrlNeeded: true,
      /** Optional, only needed when your bucket isn't public and you need to generate a signed URL */
      region: 'eu-west-3',
    },
  }]
```

### File upload on a remote server (via SFTP)

It is possible to use a FileColumn to allow upload to a remote server via SFTP. A basic configuration would be as follow:

```js
...
  columns: [{
    label: 'Image',
    name: 'imageUrl',
    dataType: 'file',
    publicPath: '/home/ubuntu/project/public',
    subdirectory: 'img',
    sftpConfig: {
      host: process.env.SFTP_HOST,
      user: process.env.SFTP_USER,
      password: process.env.SFTP_PASSWORD,
    },
  }]
```
