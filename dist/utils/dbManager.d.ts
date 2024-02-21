export default class dbManager {
    _db: any;
    dbType: any;
    init(config: any): void;
    query(queryString: any, args?: any[]): Promise<any>;
}
