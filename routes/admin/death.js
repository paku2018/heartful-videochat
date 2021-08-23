const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");
const fs = require("fs");

const CONFIG_FILE = './config.json';
if (!fs.existsSync(CONFIG_FILE)) {
    console.error('The config file not found.');
    return;
}

async function getAllDeathList(req) {
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.password, t_manager.email, t_manager.relation  " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " where t_death.status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getDeathList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.password, t_manager.email, t_manager.relation, t_manager.id as manager_id  " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " where t_death.status = 1 " +
        " ORDER BY t_death.id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalDeath(req) {
    let checkSqlStr = "SELECT COUNT(id) as cnt FROM t_death WHERE t_death.status = 1";
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}

async function removeDeath(req) {
    let sqlStr = "UPDATE t_death SET status = 0 " +
        " WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(sqlStr);
}


module.exports = {

    getAllDeathListApi: async function (req, res) {
        try {
            let deathList = await getAllDeathList(req);
            res.send(JSON.stringify({
                status: true,
                list: deathList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    getDeathListApi: async function (req, res) {
        try {
            let totalCount = await getTotalDeath(req);
            let deathList = await getDeathList(req);
            let totalPage = parseInt((totalCount - 1) / req.body.params.per_page + 1);
            let page = req.body.params.page;
            let per_page = req.body.params.per_page;
            let start = per_page * (page - 1);
            res.send(JSON.stringify({
                status: true,
                per_page: req.body.params.per_page,
                page: req.body.params.page,
                total: totalCount,
                last_page: totalPage,
                from: start,
                to: start + per_page,
                data: deathList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    removeDeathApi: async function (req, res) {
        try {
            await removeDeath(req);
            res.send(JSON.stringify({
                status: true
            }));
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
