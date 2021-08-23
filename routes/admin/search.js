const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");

async function getCompanyDetailByCode(code, type) {
    let sqlStr = "SELECT t_company.*, t_company_payment.bank_name, t_company_payment.bank_address, t_company_payment.payment_type " +
        " from t_company " +
        " left join t_company_payment on t_company.id = t_company_payment.company_id " +
        "WHERE t_company.code";
    if(type == 0) {
        sqlStr = sqlStr +  " = '" + code + "'";
    } else {
        sqlStr = sqlStr +  " like '%" + code + "%'";
    }
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getBusinessDetailByCode(code, type) {
    let sqlStr = "SELECT * " +
        " from t_business " +
        "WHERE status = 1 AND code";
    if(type == 0) {
        sqlStr = sqlStr +  " = '" + code + "'";
    } else {
        sqlStr = sqlStr +  " like '%" + code + "%'";
    }
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getDeathDetailByCode(code, type) {
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.email, t_manager.relation " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        "WHERE t_death.code";
    if(type == 0) {
        sqlStr = sqlStr +  " = '" + code + "'";
    } else {
        sqlStr = sqlStr +  " like '%" + code + "%' OR t_manager.name like '%" + code + "%'";
    }
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getDurationDetailByCode(code, type) {
    let sqlStr = "SELECT * " +
        " from t_duration " +
        "WHERE code";
    if(type == 0) {
        sqlStr = sqlStr +  " = '" + code + "'";
    } else {
        sqlStr = sqlStr +  " like '%" + code + "%'";
    }
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getViewerDetailByCode(code, type) {
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE status = 1 AND uuid";
    if(type == 0) {
        sqlStr = sqlStr +  " = '" + code + "'";
    } else {
        sqlStr = sqlStr +  " like '%" + code + "%' OR t_viewer.name like '%" + code + "%'";
    }
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

module.exports = {
    searchEqualApi: async function (req, res) {
        try {
            let code = req.body.code;
            let detail = null;
            let type = '';
            if(code.length == 3) {
                detail = await getBusinessDetailByCode(code, 0);
                type = 'business';
            } else if(code.length == 4) {
                detail = await getCompanyDetailByCode(code, 0);
                type = 'company';
            } else if(code.length == 12) {
                type = 'death';
                detail = await getDeathDetailByCode(code, 0);
            } else if(code.length == 13) {
                type = 'duration';
                detail = await getDurationDetailByCode(code, 0);
            }
            console.log(detail);
            if(detail != null && detail.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    type: type,
                    detail: detail[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: 'not_exist'
                }));
            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    searchLikeApi: async function (req, res) {
        try {
            let type = req.body.type;
            let code = req.body.code;
            let list = [];
            if(type == 'company') {
                list = await getCompanyDetailByCode(code, 1);
            } else if(type == 'business') {
                list = await getBusinessDetailByCode(code, 1);
            } else if(type == 'death') {
                list = await getDeathDetailByCode(code, 1);
            } else if(type == 'duration') {
                list = await getDurationDetailByCode(code, 1);
            } else if(type == 'viewer') {
                list = await getViewerDetailByCode(code, 1);
            }
            if(list.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    data: list
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: 'not_exist'
                }));
            }

        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
