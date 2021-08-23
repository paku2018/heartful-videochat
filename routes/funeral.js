const express = require('express');
//const Router = express.Router();
const connection = require("../connection");

async function getDetail(req) {
    let code = req.body.code;
    // let sqlStr = "SELECT f.*, p.name as place_name, p.address as place_address, p.mobile as place_mobile, c.name as company_name, c.mobile as company_mobile, m.name as manager_name, m.surname as manager_surname" +
    //     " from t_funeral as f " +
    //     "LEFT JOIN t_decease as d ON f.decease_id = d.id " +
    //     "LEFT JOIN t_manager as m ON f.manager_id = m.id " +
    //     "LEFT JOIN t_company as c ON f.company_id = c.id " +
    //     "LEFT JOIN t_place as p ON f.place_id = p.id " +
    //     "WHERE d.name = '" + name + "' AND d.surname = '" + surname + "'";

    let sqlStr = "SELECT t_death.*, t_company.name as company_name FROM t_death LEFT JOIN t_company ON t_death.company_id = t_company.id WHERE t_death.code = '" + code + "'";
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getIncense(req) {
    let id = req.body.id;
    let sqlStr = "SELECT f.*, t_flower.name as flower_name, t_flower.sell_price, t_flower.cost, c.name as company_name " +
        " FROM t_funeral as f " +
        " LEFT JOIN t_company as c ON f.company_id = c.id " +
        " LEFT JOIN t_flower ON f.flower_id = t_flower.id " +
        " WHERE f.id = ?";
    console.log(sqlStr + ":" + id);
    let db = connection.makeDb();
    let result = await db.query(sqlStr, id);
    return result;
};

async function getManager(req) {
    let id = req.body.id;
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name " +
        " FROM t_death  " +
        " LEFT JOIN t_manager  ON t_manager.death_id = t_death.id " +
        " WHERE t_death.id = ?";
    let db = connection.makeDb();
    let result = await db.query(sqlStr, id);
    return result;
};

async function getDeathDetail(req) {
    let death_id = req.body.id;
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.relation, t_manager.bank_info, t_place.name as place_name, " +
        " t_business.name as business_name, t_business.code as business_code, t_business.fax as business_fax, t_business.state, t_business.city, t_business.street, t_business.build_name, t_business.mobile as business_mobile, t_business.email as business_email, t_business.unit, " +
        " t_company.name as company_name, t_company.address as company_address, t_company.zip as company_zip, t_company.mobile as company_mobile, t_company.email as company_email " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " left join t_place on t_place.id = t_death.place_id " +
        " left join t_business on t_business.id = t_death.business_id " +
        " left join t_company on t_company.id = t_death.company_id " +
        "WHERE t_death.id = '" + death_id + "' ";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);

    sqlStr = "SELECT *, t_schedule.id as schedule_id " +
        " from t_schedule " +
        " left join t_place on t_schedule.place_id = t_place.id " +
        " where death_id = '" + death_id + "'";
    let scheduleList = await db.query(sqlStr);

    sqlStr = "SELECT * FROM t_duration WHERE death_id = " + death_id;
    let durationList = await db.query(sqlStr);
    let detail = result[0];
    detail.schedules = scheduleList;
    detail.durations = durationList;
    return detail;
}

async function getDeathProducts(req) {
    let death_id = req.body.id;
    let db = connection.makeDb();
    let deathProductSqlStr = "SELECT * " +
        " FROM t_death_product " +
        " LEFT JOIN t_product ON t_product.id = t_death_product.product_id " +
        " WHERE t_death_product.death_id = " + death_id + " AND t_product.status = 1 " +
        " ORDER BY t_product.type"
    ;
    let deathProductList = await db.query(deathProductSqlStr);

    return deathProductList;

}

module.exports = {
    sendFuneralApi : async function(req, res) {
        try {
            let result = {};
            switch (req.path) {
                case 'get_detail':
                    result = await getDetail(req);
                    if(result.length > 0) {
                        res.send(JSON.stringify({
                            status: true,
                            type: req.path,
                            data: result[0]
                        }));
                    } else {
                        res.send(JSON.stringify({
                            status: false,
                            type: req.path,
                        }));
                    }

                    break;
                case 'get_incense':
                    result = await getIncense(req);
                    if(result.length > 0) {
                        res.send(JSON.stringify({
                            status: true,
                            type: req.path,
                            content: result[0]
                        }));
                    } else {
                        res.send(JSON.stringify({
                            status: false,
                            type: req.path,
                        }));
                    }
                    break;
                case 'get_manager':
                    result = await getManager(req);
                    if(result.length > 0) {
                        res.send(JSON.stringify({
                            status: true,
                            type: req.path,
                            data: result[0]
                        }));
                    } else {
                        res.send(JSON.stringify({
                            status: false,
                            type: req.path,
                        }));
                    }
                    break;
                case 'get_info':
                    result = await getDeathDetail(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        detail: result
                    }));
                    break;
                case 'get_product':
                    result = await getDeathProducts(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        detail: result
                    }));
                    break;
            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
                type: req.path,
            }));
        }

    }
};
