export type Filter = {}

export type BaseTypeColumn = {
    label: string,
    hideInTable?: boolean,
    canEditOnCreation?: boolean,
    includedInCreatePayload?: boolean,
    canEdit?: boolean,
    hidden?: boolean,
    formattedValue?: string,
    formatValue?: (record: any) => string | Promise<string>,
    searchable?: boolean,
    searchableName?: string,
    labelTooltip?: string,
    required?: boolean
}

export type ColorColumn = {
    dataType: 'color',
    name: string
}

export type StandardColumn = {
    name?: string,
    dataType?: string
}


export type SelectColumn = {
    dataType: 'select',
    name: string,
    options: string[] | { [key: string]: string },
    defaultOption: string,
    optional?: boolean
}

export type AddressColumn = {
    dataType: 'address',
    latitudeField?: string,
    longitudeField?: string,
    addressField?: string,
    streetNumberField?: string,
    routeField?: string,
    localityField?: string,
    administrativeAreaLevel2Field?: string,
    administrativeAreaLevel1Field?: string,
    countryField?: string,
    postalCodeField?: string,
}

export type DateColumn = {
    dataType: 'date',
    name: string
}

export type DatetimeColumn = {
    dataType: 'datetime',
    name: string
}

export type ForeignSelectColumn = {
    dataType: 'foreign',
    name: string,
    table: string,
    foreignName?: string,
    limit?: number,
    selectExpression?: string,
    join?: string,
    filters?: Filter[],
    orderBy?: string,
    optional?: boolean,
    formatForeignValue?: (record: any) => string,
}

export type ForeignDatalistColumn = {
    dataType: 'datalist',
    name: string,
    table: string,
    foreignName?: string,
    wholeSearch?: boolean,
    limit?: number,
    selectExpression?: string,
    join?: string,
    filters?: Filter[],
    orderBy?: string,
    optional?: boolean,
    formatForeignValue?: (record: any) => string,
}

export type TextareaColumn = {
    dataType: 'textarea',
    name: string,
}

export type RichTextColumn = {
    dataType: "richText";
    htmlField: string;
    contentField?: string;
};

export type BetterRichTextColumn = {
    dataType: "betterRichText";
    htmlField: string;
    fileUploadProperties?: FileUploadProperties;
};

export type FileColumn = {
    dataType: 'file',
    name: string
} & FileUploadProperties

export type FileUploadProperties = {
    publicPath?: string,
    subdirectory?: string,
    aspectRatioField?: string,
    originalNameField?: string,
    s3Config?: {
        host: string,
        accessKeyId: string,
        secretAccessKey: string,
        bucket: string,
        subfolder?: string
        signedUrlNeeded?: boolean,
        region?: string,
    },
    sftpConfig?: {
        host: string,
        user: string,
        password: string
    }
}

export type Column = BaseTypeColumn & (
    StandardColumn |
    ColorColumn |
    SelectColumn |
    AddressColumn |
    DateColumn |
    DatetimeColumn |
    ForeignSelectColumn |
    ForeignDatalistColumn |
    RichTextColumn |
    BetterRichTextColumn |
    TextareaColumn |
    FileColumn
)

export type CreateType = {
    canCreate: true,
    aNewSingular: string,
    createFilters?: { [key: string]: string },
    createConfig?: {
        redirectToCreatedItems?: boolean
    }
}

export type CustomAction = {
    label: string,
    action: (record: any) => void,
    successMessage?: string
}

export type FormDataFile = {
    fieldName: string,
    originalFilename: string,
    path: string,
    headers: { [key: string]: string },
    size: number
}

export type TableView = {
    type: 'table',
    icon?: string,
    label: string,
    tableName: string,
    primaryId?: string,
    customQuery?: string,
    selectExpression?: string,
    join?: string,
    groupBy?: string,
    orderBy?: string,
    isDesc?: boolean,
    limit?: number,
    filters?: string,
    filtersFromUser?: (userId: number) => string,
    notClickable?: boolean,
    clickToEdit?: boolean,
    openInNewTab?: boolean,
    customActions?: CustomAction[],
    /** Rendre possible à l'utilisateur de créer des enregistrements */
    /** Rendre possible à l'utilisateur de supprimer des enregistrements */
    canDelete?: boolean,
    /** Rendre possible à l'utilisateur de modifier des enregistrements */
    canEdit?: boolean,
    /** Rendre possible à l'utilisateur de télécharger les enregistrements (par défaut : true) */
    canExport?: boolean,
    /** Rendre possible à l'utilisateur d'importer des enregistrements (par défaut : false) */
    canImport?: boolean,
    /**
     * Types de fichier acceptés pour l'import, au format de l'attribut {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers accept}.
     * @example [".xlsx", ".xls", ".csv"]
     */
    importFileTypes?: string[],
    /** Obligatoire si `canImport` est `true`. Prend le fichier d'import en paramètre et renvoie une liste d'entités. */
    parseImportFile?: (file: FormDataFile) => Promise<any[]>,
    createCallback?: string,
    createCallbackFunction?: ({ id, data }: { id: number, data: any }) => void,
    editCallback?: string,
    editCallbackFunction?: ({ id, data }: { id: number, data: any }) => void,
    deleteCallback?: string,
    deleteCallbackFunction?: ({ id }: { id: number }) => void,
    columns: Column[],
    subviews?: Subview[],
    recordViewPanels?: ViewPanel[]
} & (CreateType | { canCreate?: false })

export type Subview = {
    label: string,
    filters: string
}

export type BaseTypePanel = {
    label: string,
    folded?: boolean,
}

export type CreateConfig = {
    label: string,
    recordIdKey: string,
    columns: Column[],
    redirectToCreatedItems?: boolean
}

export type TablePanel = {
    type: "table",
    query: string,
    formattedQuery?: string,
    canDownload?: boolean,
    canShow?: boolean,
    canDelete?: boolean,
    canCreate?: boolean,
    createConfig?: CreateConfig,
    tableName?: string,
    primaryId?: string,
    formatValue?: {
        [key: string]: (record: any) => string | Promise<string>
    },
    formattedValues?: { [key: string]: string },
    createCallback?: string,
    createCallbackFunction?: ({ id, data }: { id: number, data: any }) => void,
    deleteCallback?: string,
    deleteCallbackFunction?: ({ id }: { id: number }) => void,
}

export type MapPanel = {
    type: "map",
    query: string,
    latitudeField: string,
    longitudeField: string,
    zoom?: number,
}

export type GalleryPanel = {
    type: "gallery",
    query: string,
    canDelete?: boolean,
    canCreate?: boolean,
    createConfig?: CreateConfig,
    tableName?: string,
    primaryId?: string,
    baseUrl?: string,
    pathField?: string,
    objectFit?: 'cover' | 'contain',
    createCallback?: string,
    createCallbackFunction?: ({ id, data }: { id: number, data: any }) => void,
    deleteCallback?: string,
    deleteCallbackFunction?: ({ id }: { id: number }) => void,
}

export type ChatPanel = {
    type: "chat",
    /* Requête SQL pour récupérer les messages échangés */
    getMessagesQuery: string,
    /* URL pour envoyer un message */
    postMessageUrl: string,
    messageField: string,
    isAdminField: string,
    datetimeField: string,
    /* Clé secrète transmise à la route d'envoi de message */
    secretKey?: string
}

export type ViewPanel = BaseTypePanel & (TablePanel | MapPanel | GalleryPanel | ChatPanel)

export type IframeView = {
    type: 'iframe',
    src: string,
    icon?: string,
    label: string
}

export type LinkView = {
    type: 'link',
    src: string,
    icon?: string,
    label: string
}

export type CustomView = {
    type: 'custom',
    icon?: string,
    label: string,
    componentPath: string
}

export type BaseTypeView = {
    /** Cache la vue dans le menu latéral */
    hidden?: boolean,
    roles?: string[]
}

export type View = BaseTypeView & (TableView | IframeView | LinkView | CustomView)

export type AuthRole = {
    role: string,
    table: string,
    usernameField: string,
    passwordField: string,
    idField: string,
}

export type Config = {
    /** Nom du projet */
    name: string,

    /** Chaîne de caractères aléatoires qui permet de chiffrer les cookies de session */
    sessionSecret: string,

    useMysql2?: boolean,

    /** Identifiants permettant d'accéder au back-office */
    auth: {
        /** Nom d'utilisateur */
        username: string,

        /** Password */
        password: string
    },

    authRoles?: AuthRole[],

    /** Identifiants de connexion à la base de données */
    mysql?: {
        host: string,
        user: string,
        password: string,
        database: string,
        port?: number
    },

    postgresql?: {
        host: string,
        user: string,
        password: string,
        database: string,
        port?: number
        ssl?: any
    },

    /** Clé API Google Maps pour les champs adresses et l'affichage de cartes */
    googleMapsKey?: string,

    /** Désactiver la sélection multiple dans les vues de type table */
    hideMultiselect?: boolean,

    /** Cache l'inscription Made with love by Galadrim */
    hideBranding?: boolean,

    views: View[]
}
