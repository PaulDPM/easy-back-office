"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
const mysql2 = require("mysql2");
const pg = require("pg");
function convertQuery(mysqlQuery, params) {
    let pgQuery = '';
    let pgParams = [];
    let paramIndex = 1;
    let charIndex = 0;
    while (charIndex < mysqlQuery.length) {
        if (mysqlQuery.charAt(charIndex) === '?' && mysqlQuery.charAt(charIndex + 1) === '?') {
            pgQuery += params.shift();
            charIndex += 2;
        }
        else if (mysqlQuery.charAt(charIndex) === '?') {
            pgQuery += `$${paramIndex++}`;
            pgParams.push(params.shift());
            charIndex++;
        }
        else {
            pgQuery += mysqlQuery.charAt(charIndex);
            charIndex++;
        }
    }
    return {
        pgQuery,
        pgParams,
    };
}
class dbManager {
    init(config) {
        if (config.mysql) {
            this._db = (config.useMysql2 ? mysql2 : mysql).createPool({
                connectionLimit: 10,
                host: config.mysql.host,
                user: config.mysql.user,
                password: config.mysql.password,
                database: config.mysql.database,
                port: config.mysql.port || 3306,
                dateStrings: true,
                multipleStatements: true
            });
            this.dbType = "MYSQL";
        }
        else if (config.postgresql) {
            this._db = new pg.Pool({
                host: config.postgresql.host,
                user: config.postgresql.user,
                password: config.postgresql.password,
                database: config.postgresql.database,
                port: config.postgresql.port || 5432,
                ssl: config.postgresql.ssl
            });
            this.dbType = "POSTGRESQL";
        }
    }
    async query(queryString, args = []) {
        return new Promise((resolve, reject) => {
            if (this.dbType === "POSTGRESQL") {
                const result = convertQuery(queryString, args);
                queryString = result.pgQuery;
                args = result.pgParams;
            }
            this._db.query(queryString, args, (a, b, c) => {
                if (this.dbType === "MYSQL") {
                    resolve({ err: a, rows: b, fields: c });
                }
                else if (this.dbType === "POSTGRESQL") {
                    resolve({ err: a, rows: b === null || b === void 0 ? void 0 : b.rows, fields: b === null || b === void 0 ? void 0 : b.fields });
                }
            });
        });
    }
}
exports.default = dbManager;
//# sourceMappingURL=dbManager.js.map