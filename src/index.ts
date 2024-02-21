import * as express from "express";
import * as session from "express-session";
import * as SessionStore from "express-mysql-session";
import * as pgSessionStore from 'connect-pg-simple';
import * as mysql2 from 'mysql2/promise';
import * as pg from 'pg';
import dbManager from "./utils/dbManager";
import * as bcrypt from "bcryptjs";
import * as argon from 'argon2';

import * as fs from "fs";
import * as path from "path";
import * as mime from "mime";

import * as moment from "moment";

import { Config } from "./types/config"

import api from "./api"

moment.locale('fr');

export default (config: Config): any => {
    const db = new dbManager();

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

    const passwordMatch = (password: string, hash: string) => {
        if (password === hash || bcrypt.compareSync(password, hash)) {
            return true;
        }
        try {
            if (argon.verify(hash, password)) {
                return true;
            }
        } catch (e) { }
        return false;
    }

    app.post('/api/login', async (req, res) => {
        if (req.body.username === config.auth.username && req.body.password === config.auth.password) {
            req.session.user = { role: "root" }
            res.send({ success: true })
        } else if (config.authRoles) {
            for (const authRole of config.authRoles) {
                const { rows } = await db.query("SELECT * FROM ?? WHERE ?? = ?", [authRole.table, authRole.usernameField, req.body.username]);
                const user = rows.find(x => passwordMatch(req.body.password, x[authRole.passwordField]))
                if (!user) {
                    continue;
                }
                req.session.user = { role: authRole.role, userId: user[authRole.idField] }
                return res.send({ success: true })
            }
            res.send({ success: false })
        } else {
            res.send({ success: false })
        }
    })


    app.get('/api/isAuthenticated', (req, res) => {
        res.send({
            isAuthenticated: !!req.session.user
        })
    })


    app.get('/api/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error(err)
            }
        });
        res.sendStatus(200)
    })

    app.use("/api", async (req, res, next) => {
        if (req.method === "OPTIONS" || req.session.user) {
            if (req.session?.user?.userId) {
                // we check that the user still exists
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
                            console.error(err)
                        }
                    });
                    return res.sendStatus(401)
                }
            }
            next()
        } else {
            res.sendStatus(401)
        }
    })

    app.use("/api", (req, res, next) => {
        return api(db, {
            ...config,
            views: config.views.filter(x => !x.roles || (req.session.user && x.roles.includes(req.session.user.role)))
        }, req.session.user)(req, res, next)
    })

    // Serve static files
    app.get("*", (req, res) => {
        let filePath = path.join(__dirname, '../src/front/build' + (req.url === "/" ? "/index.html" : req.url))
        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, '../src/front/build/index.html')
        }

        // Send media files just like they are
        if ([".woff", ".png"].includes(path.extname(filePath))) {
            res.sendFile(filePath)
        } else {
            // For text files, we replace _HOMEPAGE_ with the base url of the back-office
            let fileContent = fs.readFileSync(filePath, { encoding: "utf-8" })
            fileContent = fileContent.replace(/\/_HOMEPAGE_/g, req.baseUrl)
            res.contentType(mime.getType(filePath));
            res.send(fileContent)
        }
    })

    return app;
};
