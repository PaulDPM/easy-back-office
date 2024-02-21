import * as express from "express";
import * as multiparty from "multiparty";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { S3, Endpoint } from "aws-sdk";
import sizeOf from "image-size"
import * as serializeJs from "serialize-javascript";
import * as SftpClient from 'ssh2-sftp-client';

import * as rollup from "rollup";
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

function generateUniqueIdForObject(obj) {
    const str = JSON.stringify(obj);
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    return hash;
}

export default (db, config, user) => {
    const app = express();

    app.use(async (req, res, next) => {
        if (!config.enriched) {
            await enrichConfig(config, db);
        }
        next();
    })

    async function getRecords(params) {
        let queryString = "";
        if (params.filters) {
            queryString = " WHERE (" + params.filters + ")";
        }
        if (params.query) {
            const columns = params.columns
            let isNewCondition = true
            for (let i in columns) {
                if (columns[i].searchable !== false && (columns[i].searchableName || columns[i].name)) {
                    if (queryString.length == 0) {
                        queryString += " WHERE ("
                    } else if (isNewCondition) {
                        queryString += " AND ("
                    } else {
                        queryString += " OR "
                    }
                    if (columns[i].searchableName) {
                        // on ne doit pas ajouter de backticks sur le searchableName car celui-ci peut être une fonction
                        // exemple : searchableName = "CONCAT_WS(' ', firstname, lastname)"
                        queryString += columns[i].searchableName
                    } else if (columns[i].name) {
                        queryString += columns[i].name.split(".").map(x => "`" + x + "`").join(".")
                    }
                    queryString += " LIKE '%" + params.query.replace(/'/g, "\\'") + "%'"
                    isNewCondition = false;
                }
            }
            queryString += ")"
        }
        const limit = params.allRecords ? 999999 : parseInt(params.limit)
        const query = params.customQuery || ("SELECT " + (params.selectExpression || "*") + " FROM ?? " + (params.join || "") + queryString + " " + (params.groupBy ? "GROUP BY " + params.groupBy : "") + (params.orderBy || params.primaryId ? " ORDER BY " + (params.orderBy || `${params.table}.${params.primaryId}`) : "") + (params.isDesc ? " DESC" : "") + " LIMIT ? OFFSET ?")
        const queryParams = [params.table, limit, Math.max((params.page - 1) * limit, 0)]
        const { err, rows } = await db.query(query, queryParams)
        if (err) {
            console.error(err)
            return {
                error: err
            }
        }
        return {
            rows,
            queryString,
            input: {
                query,
                params
            }
        }
    }

    async function findRecordByPosition(params) {
        return await getRecords(Object.assign(params, {
            page: parseInt(params.position) + parseInt(params.offset),
            limit: 1
        }));
    }

    app.get('/config', async (req, res) => {
        try {
            /*
            config = {
                ...config,
                ...{
                    views: config.views.filter(view => !view.roles || view.roles.includes(user.role))
                }
            }
            for (let view of config.views) {
                if (view.columns) {
                    view.columns = view.columns.filter(column => !column.roles || column.roles.includes(user.role))
                }
            }
            */
            const { mysql, auth, sessionSecret, ...safeConfig } = config;
            res.send({
                config: serializeJs(safeConfig)
            })
        } catch (e) {
            console.error(e);
            res.sendStatus(500)
        }
    })

    app.get("/customComponent", async (req, res) => {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/front/package.json'), 'utf-8'));
            const external = Object.keys(pkg.dependencies || {});
            const bundle = await rollup.rollup({
                input: path.join(__dirname, "../../", req.query.componentPath as string),
                plugins: [
                    resolve(),
                    babel({
                        configFile: path.join(__dirname, "../babel.config"),
                        babelHelpers: "bundled"
                    })
                ],
                external
            });
            const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
            res.send(output[0].code)
        } catch (err) {
            console.error(err)
        }
    })

    app.post('/adjacentRecordId', async function (req, res, next) {
        const { rows, error } = await findRecordByPosition(req.body)
        if (error) {
            return res.status(500).send(error)
        }
        const recordId = rows[0] ? rows[0][req.body.primaryId] : null;
        res.send({
            recordId: recordId
        });
    });

    const sqlAnd = (conditions) => {
        const existingConditions = [];
        for (const condition of conditions) {
            if (condition) {
                existingConditions.push(condition)
            }
        }
        if (existingConditions.length <= 1) {
            return existingConditions[0] || null
        } else {
            let result = "";
            for (let i = 0; i < existingConditions.length; i++) {
                if (i > 0) {
                    result += " AND "
                }
                result += "(" + existingConditions[i] + ")"
            }
            return result
        }
    }

    app.post('/foreignSelectRecords', async (req, res, next) => {
        const view = config.views[req.body.viewIndex];
        const column = [
            ...view.columns,
            ...(view.recordViewPanels?.map(x => x?.createConfig?.columns)?.filter(x => x)?.flat() || [])
        ].find(x => x.__id__ === req.body.columnId)
        const { rows: records, error } = await getRecords({
            table: column.table,
            page: 1,
            filters: sqlAnd([column.filters, req.body.query ? `${column.searchableName} LIKE '${column.wholeSearch ? '%' : ''}${req.body.query}%'` : null]),
            join: column.join,
            selectExpression: column.selectExpression,
            orderBy: column.orderBy,
            limit: column.limit || 50
        })
        if (error) {
            return res.status(500).send(error)
        }
        const options = await Promise.all(records.map(async (record) => {
            let label;
            if (column.formatForeignValue) {
                label = await column.formatForeignValue(record);
            } else if (column.formatValue) {
                label = await column.formatValue(record);
            } else if (column.formattedValue) {
                label = evalExpression(column.formattedValue, record)
            } else {
                label = record[column.name]
            }
            const value = record[column.foreignName] || record[column.name]
            return ({
                value,
                label
            })
        }))
        res.send(options)
    })

    app.post('/records', async function (req, res, next) {
        const view = config.views[req.body.viewIndex];
        const { rows: records, queryString, input, error } = await getRecords({
            table: view.tableName,
            page: req.body.page,
            filters: sqlAnd([
                view.filters,
                view.subviews && req.body.subviewIndex !== undefined ? view.subviews[req.body.subviewIndex].filters : null,
                ...req.body.filters,
                view.filtersFromUser ? view.filtersFromUser(user.userId) : null
            ]),
            customQuery: view.customQuery,
            join: view.join,
            selectExpression: view.selectExpression,
            orderBy: req.body.orderBy || view.orderBy,
            isDesc: req.body.isDesc === null ? view.isDesc : req.body.isDesc,
            primaryId: view.primaryId,
            query: req.body.query,
            groupBy: view.groupBy,
            columns: view.columns,
            limit: view.limit || 10,
        })
        if (error) {
            return res.status(500).send(error)
        }

        for (const column of view.columns) {
            if (column.formatValue) {
                for (const record of records) {
                    record[`__formatValue-${column.__id__}__`] = await column.formatValue(record)
                }
            }
        }
        const { err, rows: counts } = await db.query("SELECT COUNT(*) AS Count FROM (SELECT 1 FROM ?? " + (view.join || "") + queryString + " " + (view.groupBy ? "GROUP BY " + view.groupBy : "") + ") s", [view.tableName])
        if (err) {
            res.send({
                records,
                input,
                count: "-",
                countErr: err
            })
        } else {
            res.send({
                records,
                input,
                count: counts[0].Count
            })
        }
    })

    const formattedValueToFunction = {}

    function getFormattedValue(column, record) {
        let value;
        try {

            record.options = column.options
            if (column.formattedValueOptimized) {
                if (!formattedValueToFunction[column.formattedValueOptimized]) {
                    eval("formattedValueToFunction[column.formattedValueOptimized] = " + column.formattedValueOptimized);
                }
                value = formattedValueToFunction[column.formattedValueOptimized](record)
            } else if (column.formattedValue) {
                value = evalExpression(column.formattedValue, record)
            } else if (column.dataType == "tinyint") {
                value = record[column.name] == 1 ? "Oui" : "Non"
            } else {
                value = record[column.name]
            }
            return value === null || typeof value == "undefined" ? "" : value
        } catch (err) {
            return value || ""
        }
    }

    function evalExpression(expression, data) {
        let varString = '';
        let statement = '';

        try {
            for (let key in data) {
                statement = "var " + key + " = " + (typeof data[key] === "string" ? "'" + data[key].replace(/'/g, "\\'").replace(/\n/g, "").replace(/\r/g, "") + "'" : (typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key])) + ";"
                varString += statement
            }
            const result = eval(varString + expression);
            return result;
        } catch (e) {
            console.log("Problème d'évaluation de l'expression", statement)
            console.error(e);
            return "Error"
        }
    }

    app.post('/recordsExport', async function (req, res) {
        const view = config.views[req.body.viewIndex];
        const { rows: records, error } = await getRecords({
            table: view.tableName,
            page: 1,
            allRecords: true,
            filters: sqlAnd([view.filters, view.subviews && req.body.subviewIndex !== undefined ? view.subviews[req.body.subviewIndex].filters : null].concat(req.body.filters)),
            customQuery: view.customQuery,
            join: view.join,
            selectExpression: view.selectExpression,
            orderBy: req.body.orderBy || view.orderBy,
            isDesc: req.body.isDesc === null ? view.isDesc : req.body.isDesc,
            primaryId: view.primaryId,
            query: req.body.query,
            groupBy: view.groupBy,
            columns: view.columns,
            limit: view.limit || 10,
        });
        if (error) {
            return res.status(500).send(error)
        }
        let output = "";
        const columns = view.columns
        for (let j = 0; j < columns.length; j++) {
            if (!columns[j].hideInTable) {
                if (j > 0) output += ";"
                output += columns[j].label;
            }
        }
        for (let i in records) {
            const el = records[i];
            output += "\r\n"
            for (let j = 0; j < columns.length; j++) {
                if (!columns[j].hideInTable) {
                    if (j > 0) output += ";"
                    if (columns[j].dataType == 'textarea') {
                        output += '"'
                    }
                    output += getFormattedValue(columns[j], el)
                    if (columns[j].dataType == 'textarea') {
                        output += '"'
                    }
                }
            }
        }
        res.send({
            content: output
        })
    })

    app.post('/recordsImport', async function (req, res) {
        const form = new multiparty.Form();
        form.parse(req, async function (err, fields, files) {
            if (err) {
                return res.status(500).send(err);
            }
            // Get viewIndex in fields
            const view = config.views[fields.viewIndex[0]];
            if (typeof view.parseImportFile !== "function") {
                return res.status(500).send("\"parseImportFile\" doit être défini dans la configuration de la vue.");
            }

            const records = await view.parseImportFile(files.data[0]);
            const columns = [];
            if (records.length === 0) {
                return res.send({
                    affectedRows: 0
                })
            }

            try {
                for (let record of records) {
                    for (let key in record) {
                        if (!columns.includes(key)) {
                            columns.push(key)
                        }
                    }
                }

                let queryString = "INSERT INTO ?? (" + columns.map(x => "`" + x + "`").join(", ") + ") VALUES";
                for (let record of records) {
                    queryString += " (" + columns.map(x => record[x] ? ("'" + record[x].replace(/'/g, "\\'") + "'") : "NULL").join(", ") + "),";
                }
                queryString = queryString.slice(0, -1) + " ON DUPLICATE KEY UPDATE";
                for (let column of columns) {
                    queryString += " `" + column + "` = VALUES(`" + column + "`),"
                }
                const { err, rows: r } = await db.query(queryString.slice(0, -1), [view.tableName])
                if (err) {
                    console.error(err)
                    return res.status(500).send({
                        err,
                        message: "Une erreur est survenue."
                    })
                }
                res.send({
                    affectedRows: r.affectedRows
                })
            } catch (err) {
                console.error(err)
                res.status(500).send({
                    err,
                    message: "Une erreur est survenue."
                })
            }
        })
    })

    app.get('/record', async function (req, res) {
        const view = config.views[req.query.viewIndex as string];
        const { err, rows } = await db.query("SELECT " + (view.selectExpression || "*") + " FROM ?? " + (view.join || "") + " WHERE ?? = ?", [view.tableName, view.tableName + "." + view.primaryId, req.query.recordId])
        if (err) {
            return res.status(500).send(err);
        }
        if (rows.length > 0) {
            const record = rows[0]
            for (const column of view.columns) {
                if (column.formatValue) {
                    record[`__formatValue-${column.__id__}__`] = await column.formatValue(record)
                }
            }
            res.send(record)
        } else {
            res.sendStatus(404)
        }
    })

    app.post('/updateRecord', async function (req, res, next) {
        const view = config.views[req.body.viewIndex];
        for (let key in req.body.data) {
            if (req.body.data[key] == "NULL" || req.body.data[key] == "") {
                req.body.data[key] = null
            }
        }
        const queryExpression = Object.keys(req.body.data).map(x => `${x} = ?`).join(", ");
        const queryParameters = Object.keys(req.body.data).map(x => req.body.data[x]);
        const { err } = await db.query(`UPDATE ?? SET ${queryExpression} WHERE ?? = ?`, [view.tableName, ...queryParameters, view.primaryId, req.body.primaryValue])
        if (err) {
            return res.status(500).send(err);
        }
        if (view.editCallback) {
            try {
                await axios.post(view.editCallback, {
                    id: req.body.primaryValue,
                    data: req.body.data,
                    previousData: req.body.previousData
                })
            } catch (e) { }
        }
        if (view.editCallbackFunction) {
            await view.editCallbackFunction({
                id: req.body.primaryValue,
                data: req.body.data
            })
        }
        res.sendStatus(200)
    })

    app.post('/customAction', async function (req, res, next) {
        const view = config.views[req.body.viewIndex];
        const action = view.customActions[req.body.actionIndex];
        for (const recordId of req.body.selectedRecordIds) {
            try {
                const { rows } = await db.query("SELECT " + (view.selectExpression || "*") + " FROM ?? " + (view.join || "") + " WHERE ?? = ?", [view.tableName, view.tableName + "." + view.primaryId, recordId])
                const record = rows[0]
                await action.action(record);
            } catch (err) {
                console.error(err)
                return res.send({
                    success: false,
                    error: err
                })
            }
        }
        res.send({
            success: true,
            message: action.successMessage
        })
    })

    app.post('/deleteRecord', async function (req, res) {
        const view = config.views[req.body.viewIndex];
        const { err } = await db.query("DELETE FROM ?? WHERE ?? = ?", [view.tableName, view.primaryId, req.body.primaryValue])
        if (err) {
            return res.status(500).send(err);
        }
        if (view.deleteCallback) {
            try {
                await axios.post(view.deleteCallback, {
                    id: req.body.primaryValue
                })
            } catch (e) { }
        }
        if (view.deleteCallbackFunction) {
            await view.deleteCallbackFunction({
                id: req.body.primaryValue
            })
        }
        res.sendStatus(200)
    })

    app.post('/deleteRecordFromPanel', async function (req, res) {
        const view = config.views[req.body.viewIndex];
        const panel = view.recordViewPanels.find(x => x.__id__ === req.body.panelId)
        const { err } = await db.query("DELETE FROM ?? WHERE ?? = ?", [panel.tableName, panel.primaryId, req.body.primaryValue])
        if (err) {
            return res.status(500).send(err);
        }
        if (panel.deleteCallback) {
            try {
                await axios.post(panel.deleteCallback, {
                    id: req.body.primaryValue
                })
            } catch (e) { }
        }
        if (panel.deleteCallbackFunction) {
            await panel.deleteCallbackFunction({
                id: req.body.primaryValue
            })
        }
        res.sendStatus(200)
    })

    app.post('/deleteRecords', async function (req, res, next) {
        const view = config.views[req.body.viewIndex];
        const { err } = await db.query(`DELETE FROM ?? WHERE ?? IN(${req.body.primaryValues.map(x => "'" + x + "'").join(",")})`, [view.tableName, view.primaryId])
        if (err) {
            return res.status(500).send(err);
        }
        res.sendStatus(200)
    })

    app.post('/duplicateRecord', async function (req, res, next) {
        const primaryId = req.body.duplicateConfig.primaryId;
        const { err, rows } = await db.query("SELECT * FROM ?? WHERE ?? = ?", [req.body.table, primaryId, req.body.primaryValue])
        if (err) {
            return res.status(500).send(err);
        }
        const record = rows[0];
        const data = {}
        for (let field of req.body.duplicateConfig.fields) {
            data[field] = record[field]
        }
        const { err: err2, rows: r } = await db.query("INSERT IGNORE INTO ?? SET ?", [req.body.table, data])
        if (err2) {
            return res.status(500).send(err);
        }
        const newRecordId = r.insertId;
        for (let foreignTable of req.body.duplicateConfig.foreignTables) {
            const { err, rows } = await db.query("SELECT * FROM ?? WHERE ?? = ?", [foreignTable.table, primaryId, req.body.primaryValue]);
            if (err) console.log(err);
            for (let record of rows) {
                const data = {};
                data[primaryId] = newRecordId;
                for (let field of foreignTable.fields) {
                    data[field] = record[field]
                }
                await db.query("INSERT IGNORE INTO ?? SET ?", [foreignTable.table, data])
            }
        }
        res.sendStatus(200)
    })

    app.post('/createRecord', async function (req, res, next) {
        const view = config.views[req.body.viewIndex];
        const panel = req.body.panelIndex ? view.recordViewPanels[req.body.panelIndex] : null
        try {
            for (let key in req.body.data) {
                if (req.body.data[key] == "NULL") {
                    req.body.data[key] = null
                }
            }
            if (panel) {
                req.body.data[panel.createConfig.recordIdKey] = req.body.recordId;
            }
            const primaryColumn = (view || panel)?.columns?.find(x => x.name === (view || panel).primaryId)
            if (primaryColumn?.dataType == "uuid") {
                req.body.data[primaryColumn.name] = uuidv4()
            }
            const createPayload = JSON.parse(JSON.stringify(req.body.data));
            const columns = panel ? panel.createConfig.columns : view.columns;
            for (let key in createPayload) {
                if (columns?.find(x => x.name === key)?.includedInCreatePayload === false) {
                    delete createPayload[key]
                }
            }
            const queryExpression = Object.keys(createPayload).join(", ");
            const queryPlaceholders = Object.keys(createPayload).map(x => "?").join(", ");
            const queryParameters = Object.keys(createPayload).map(x => createPayload[x]);
            const { err, rows: r } = await db.query(`INSERT INTO ?? (${queryExpression}) VALUES(${queryPlaceholders})`, [panel ? panel.tableName : view.tableName, ...queryParameters])
            if (err) {
                console.error(err)
                return res.status(500).send({
                    err,
                    message: err.code === 'ER_DUP_ENTRY' ? "Cet élément existe déjà." : "Une erreur est survenue."
                })
            }
            if (panel ? panel.createCallback : view.createCallback) {
                try {
                    await axios.post(panel ? panel.createCallback : view.createCallback, {
                        id: r.insertId,
                        data: req.body.data
                    })
                } catch (e) { }
            }
            if (panel ? panel.createCallbackFunction : view.createCallbackFunction) {
                await (panel ? panel.createCallbackFunction : view.createCallbackFunction)({
                    id: r.insertId,
                    data: req.body.data
                })
            }
            res.send({
                id: r.insertId
            })
        } catch (err) {
            console.error(err)
            res.status(500).send({
                err,
                message: "Une erreur est survenue."
            })
        }
    })

    app.get('/customQuery', async function (req, res, next) {
        const query = (req.query.query as string).replace(/\?/g, req.query.primaryValue as string)
        const { err, rows } = await db.query(query);
        if (err) {
            return res.status(500).send(err);
        }
        if (req.query.viewIndex && req.query.panelIndex) {
            const panel = config.views[req.query.viewIndex as string].recordViewPanels[req.query.panelIndex as string];
            if (panel.formatValue) {
                for (const row of rows) {
                    for (const key in panel.formatValue) {
                        row[key] = await panel.formatValue[key](row);
                    }
                }
            }
        }
        res.send(rows)
    })

    function uploadFile(column, fileParamName, req, res) {
        if (column.s3Config) {
            const s3Config = column.s3Config;
            const form = new multiparty.Form();
            const s3 = new S3({
                endpoint: new Endpoint(s3Config.host),
                accessKeyId: s3Config.accessKeyId,
                secretAccessKey: s3Config.secretAccessKey,
                region: s3Config.region,
                signatureVersion: "v4",
            });
            form.parse(req, function (err, fields, files) {
                if (err) {
                    return res.status(500).send(err);
                }
                const extension = files[fileParamName][0].originalFilename.match(/(?:\.([^.]+))?$/)[1];
                let aspectRatio = null;
                if (["png", "jpeg", "jpg", "gif"].includes(extension)) {
                    const dimensions = sizeOf(files[fileParamName][0].path);
                    aspectRatio = dimensions.height / dimensions.width;
                }
                const originalFilenameWithoutExtension = files[fileParamName][0].originalFilename.replace("." + extension, "")
                const path = (s3Config.subfolder ? s3Config.subfolder + "/" : "") + originalFilenameWithoutExtension + "-" + Math.random().toString().substr(2) + "." + extension;

                if (s3Config.signedUrlNeeded) {
                    const signedUrl = s3.getSignedUrl('putObject', {
                        Bucket: s3Config.bucket,
                        Key: path,
                        ContentType: files[fileParamName][0].headers['content-type'],
                        Expires: 150,
                    });
                    axios.put(signedUrl, fs.readFileSync(files[fileParamName][0].path), {
                        maxContentLength: 100000000000,
                        maxBodyLength: 100000000000,
                        headers: {
                            ContentType: files[fileParamName][0].headers['content-type']
                        }
                    })
                        .then(() => {
                            res.status(200).send({
                                path,
                                aspectRatio,
                                originalFilename: files[fileParamName][0].originalFilename,
                            });
                        })
                        .catch(e => {
                            res.status(500).send(e)
                        })
                } else {
                    s3.putObject({
                        Body: fs.readFileSync(files[fileParamName][0].path),
                        Bucket: s3Config.bucket,
                        ContentType: files[fileParamName][0].headers['content-type'],
                        ACL: 'public-read',
                        Key: path
                    }, function (err, data) {
                        if (err) return res.status(500).send(err);
                        res.send({
                            url: `https://${s3Config.host}/${s3Config.bucket}/${path}`,
                            path,
                            aspectRatio,
                            originalFilename: files[fileParamName][0].originalFilename
                        })
                    });
                }
            })
        } else if (column.sftpConfig) {
            if (!column.publicPath) {
                return res.status(500).send("You need to pass publicPath parameter when using sftpConfig");
            }
            const form = new multiparty.Form();
            form.parse(req, function (err, fields, files) {
                if (err) {
                    return res.status(500).send(err);
                }
                const pathSplitted = files[fileParamName][0].path.split(/[\/\\]+/);
                const filename = pathSplitted[pathSplitted.length - 1];
                (async () => {
                    const sftp = new SftpClient();
                    await sftp.connect({
                        host: column.sftpConfig.host,
                        port: 22,
                        username: column.sftpConfig.user,
                        password: column.sftpConfig.password
                    });
                    await sftp.fastPut(files[fileParamName][0].path, column.publicPath + (column.subdirectory ? "/" + column.subdirectory : "") + "/" + filename);
                    await sftp.end();
                    res.send({
                        path: filename,
                        originalFilename: files[fileParamName][0].originalFilename
                    })
                    fs.unlinkSync(files[fileParamName][0].path)
                })();
            })
        } else {
            const form = new multiparty.Form({
                uploadDir: (column.publicPath as string) + (column.subdirectory as string)
            });
            form.parse(req, function (err, fields, files) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send({
                    path: files[fileParamName][0].path.replace(column.publicPath, ""),
                    originalFilename: files[fileParamName][0].originalFilename
                })
            })
        }
    }

    app.post('/uploadFileFromBetterRichTextInput', async function (req, res, next) {
        const fileUploadProperties = JSON.parse(req.headers['file-upload-properties'] as string);
        uploadFile(fileUploadProperties, "upload", req, res);
    })

    app.post('/uploadFile', async function (req, res, next) {
        const view = config.views[req.query.viewIndex as string];
        const column = [
            ...view.columns,
            ...(view.recordViewPanels?.map(x => x?.createConfig?.columns)?.filter(x => x)?.flat() || [])
        ].find(x => x.__id__ == req.query.columnId)
        uploadFile(column, "file", req, res);
    })

    return app
}



async function enrichConfig(config, db) {
    const { rows: info } = await db.query("SELECT * FROM information_schema.columns WHERE table_schema = ?", [config.mysql?.database || config.postgresql?.database])
    for (const view of config.views) {
        if (view.type == "table") {
            const tableName = view.tableName;
            for (const infoEl of info) {
                if (infoEl.TABLE_NAME == tableName && infoEl.COLUMN_KEY == "PRI") {
                    view.primaryId = infoEl.COLUMN_NAME;
                }
            }
            for (const column of view.columns) {
                enrichColumn(column, tableName, info)
            }
            if (view.recordViewPanels) {
                for (const panel of view.recordViewPanels) {
                    if (panel.createConfig) {
                        for (const column of panel.createConfig.columns) {
                            enrichColumn(column, tableName, info)
                        }
                    }
                    if (!panel.__id__) {
                        panel.__id__ = generateUniqueIdForObject(panel)
                    }
                }
            }
        }
    }
    config.enriched = true;
}

function enrichColumn(column, tableName, info) {
    if (!column.__id__) {
        column.__id__ = generateUniqueIdForObject(column)
    }
    const infoEl = info.find(x => x.TABLE_NAME == tableName && x.COLUMN_NAME == column.name)
    if (infoEl?.IS_NULLABLE == "NO" && infoEl?.DATA_TYPE != 'text' && (column.required !== true && column.required !== false)) {
        column.required = true;
    }
    if (!column.dataType && infoEl) {
        column.dataType = infoEl.DATA_TYPE;
        if (column.dataType == "enum") {
            column.dataType = "select";
            column.options = JSON.parse(infoEl.COLUMN_TYPE.replace("enum(", "[").replace(")", "]").replace(/'/g, '"'))
        }
    }
    if (column.dataType == "richText") {
        column.name = column.contentField
    }
    if (column.dataType == "file" && column.s3Config) {
        column.baseUrl = `https://${column.s3Config.host}/${column.s3Config.bucket}/`
    }
}
