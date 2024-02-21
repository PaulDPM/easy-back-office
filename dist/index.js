"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const session = require("express-session");
const SessionStore = require("express-mysql-session");
const pgSessionStore = require("connect-pg-simple");
const mysql2 = require("mysql2/promise");
const pg = require("pg");
const dbManager_1 = require("./utils/dbManager");
const bcrypt = require("bcryptjs");
const argon = require("argon2");
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const moment = require("moment");
const api_1 = require("./api");
moment.locale('fr');
exports.default = (config) => {
    const db = new dbManager_1.default();
    db.init(config);
    const app = express();
    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,file-upload-properties');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        next();
    });
    app.use(express.json({
        limit: '50mb'
    }));
    app.use(session({
        secret: config.sessionSecret,
        store: config.postgresql ? new (pgSessionStore(session))({
            pool: new pg.Pool({
                host: config.postgresql.host,
                user: config.postgresql.user,
                password: config.postgresql.password,
                database: config.postgresql.database,
                port: config.postgresql.port || 5432,
                ssl: config.postgresql.ssl
            }),
            createTableIfMissing: true,
            tableName: 'galadmin_sessions'
        }) : new SessionStore({
            schema: { tableName: 'galadmin_sessions' }
        }, mysql2.createPool({
            host: config.mysql.host,
            user: config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
            port: config.mysql.port || 3306
        })),
        resave: false,
        saveUninitialized: false,
        name: 'galadmin.sid'
    }));
    const passwordMatch = (password, hash) => {
        if (password === hash || bcrypt.compareSync(password, hash)) {
            return true;
        }
        try {
            if (argon.verify(hash, password)) {
                return true;
            }
        }
        catch (e) { }
        return false;
    };
    app.post('/api/login', async (req, res) => {
        if (req.body.username === config.auth.username && req.body.password === config.auth.password) {
            req.session.user = { role: "root" };
            res.send({ success: true });
        }
        else if (config.authRoles) {
            for (const authRole of config.authRoles) {
                const { rows } = await db.query("SELECT * FROM ?? WHERE ?? = ?", [authRole.table, authRole.usernameField, req.body.username]);
                const user = rows.find(x => passwordMatch(req.body.password, x[authRole.passwordField]));
                if (!user) {
                    continue;
                }
                req.session.user = { role: authRole.role, userId: user[authRole.idField] };
                return res.send({ success: true });
            }
            res.send({ success: false });
        }
        else {
            res.send({ success: false });
        }
    });
    app.get('/api/isAuthenticated', (req, res) => {
        res.send({
            isAuthenticated: !!req.session.user
        });
    });
    app.get('/api/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
            }
        });
        res.sendStatus(200);
    });
    app.use("/api", async (req, res, next) => {
        var _a, _b;
        if (req.method === "OPTIONS" || req.session.user) {
            if ((_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.userId) {
                let stillExists = false;
                for (const authRole of config.authRoles) {
                    const { rows } = await db.query("SELECT * FROM ?? WHERE ?? = ?", [authRole.table, authRole.idField, req.session.user.userId]);
                    if (rows.length > 0) {
                        stillExists = true;
                        break;
                    }
                }
                if (!stillExists) {
                    req.session.destroy((err) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                    return res.sendStatus(401);
                }
            }
            next();
        }
        else {
            res.sendStatus(401);
        }
    });
    app.use("/api", (req, res, next) => {
        return (0, api_1.default)(db, Object.assign(Object.assign({}, config), { views: config.views.filter(x => !x.roles || (req.session.user && x.roles.includes(req.session.user.role))) }), req.session.user)(req, res, next);
    });
    app.get("*", (req, res) => {
        let filePath = path.join(__dirname, '../src/front/build' + (req.url === "/" ? "/index.html" : req.url));
        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, '../src/front/build/index.html');
        }
        if ([".woff", ".png"].includes(path.extname(filePath))) {
            res.sendFile(filePath);
        }
        else {
            let fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
            fileContent = fileContent.replace(/\/_HOMEPAGE_/g, req.baseUrl);
            res.contentType(mime.getType(filePath));
            res.send(fileContent);
        }
    });
    return app;
};
//# sourceMappingURL=index.js.map