const connection = require("../../connection");
const util = require("../../util");

async function checkDurationExist (id){
    let sqlStr = "SELECT id " +
        " from t_duration " +
        "WHERE id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkCodeExist(code) {
    let sqlStr = "SELECT * " +
        " from t_duration " +
        "WHERE code = '" + code + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function createCode(company_id) {
    let sqlStr = "SELECT code " +
        " from t_company " +
        "WHERE id = '" + company_id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    let company_code = result[0].code;

    while(true) {
        let code = company_code + util.getCurrentDate() + util.createCode(1, 3);
        let result = await checkCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}

async function createDuration (req){
    let death_id = req.body.death_id;
    let start_time = req.body.start_time;
    let end_time = req.body.end_time;
    //let code = req.body.code;
    let url = req.body.url;
    let status = req.body.status;
    let company_id = req.user.id;
    let code = await createCode(company_id);

    let sqlStr = "INSERT INTO t_duration (death_id, start_time, end_time, code, url, status) VALUES('" + death_id + "','" + start_time + "','" + end_time + "','" + code + "','"
        + url  + "','" + status + "')";
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function modifyDuration (req){
    let id = req.body.id;
    let start_time = req.body.start_time;
    let end_time = req.body.end_time;
    let url = req.body.url;
    let status = req.body.status;
    console.log(req.body);

    let sqlStr = "UPDATE t_duration SET start_time = '" + start_time +
        "', end_time = '" + end_time +
        "', url = '" + url +
        "', status = '" + status +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function getDurationDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_duration " +
        "WHERE id = '" + req.body.id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}


async function getDurationList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let company_id = req.user.id;
    let sqlStr = "SELECT t_duration.*, t_manager.id as manager_id, t_manager.name as manager_name, t_death.live_status " +
        " from t_duration " +
        " left join t_death on t_duration.death_id = t_death.id " +
        " left join t_manager on t_manager.death_id = t_death.id " +
        " where t_death.company_id = " + company_id +
        " ORDER BY t_duration.id LIMIT " + start + ", " + per_page;
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalDuration(req) {
    let company_id = req.user.id;
    let checkSqlStr = "SELECT COUNT(t_duration.id) as cnt FROM t_duration left join t_death on t_duration.death_id = t_death.id WHERE t_death.company_id = " + company_id;
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}

async function removeDuration(req) {
    let checkSqlStr = "DELETE FROM t_duration WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(checkSqlStr);
}


module.exports = {
    createDurationApi: async function (req, res) {
        try {

            let id = await createDuration(req);
            res.send(JSON.stringify({
                status: true,
                id: id
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    modifyDurationApi: async function (req, res) {
        try {
            let exist = await checkDurationExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "duration_not_exist"
                }));
            } else {
                await modifyDuration(req);
                res.send(JSON.stringify({
                    status: true,
                }));

            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    removeDurationApi: async function (req, res) {
        try {
            let exist = await checkDurationExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "duration_not_exist"
                }));
            } else {
                await removeDuration(req);
                res.send(JSON.stringify({
                    status: true,
                }));

            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getDurationDetailApi: async function (req, res) {
        try {
            let result = await getDurationDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "duration_not_exist"
                }));
            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getDurationListApi: async function (req, res) {
        try {
            let totalCount = await getTotalDuration(req);
            let durationList = await getDurationList(req);
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
                data: durationList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
