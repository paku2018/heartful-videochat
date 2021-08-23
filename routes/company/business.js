const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");

async function checkBusinessExist(email) {
    let sqlStr = "SELECT * " +
        " from t_business " +
        "WHERE email = '" + email + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkBusinessExistById(id) {
    let sqlStr = "SELECT * " +
        " from t_business " +
        "WHERE id = '" + id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkCodeExist(code) {
    let sqlStr = "SELECT * " +
        " from t_business " +
        "WHERE code = '" + code + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function createCode() {
    while(true) {
        let code = util.createCode(0, 3);
        let result = await checkCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}


async function createBusiness(req){
    let name = req.body.name;
    let zip = req.body.zip;
    let state = req.body.state;
    let city = req.body.city;
    let street = req.body.street;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let email = req.body.email;
    let note = req.body.note;
    let company_id = req.user.id;
    let code = await createCode();
    let fax = req.body.fax;
    let unit = req.body.unit;
    let sqlStr = "INSERT INTO t_business (name, company_id, code, zip, state, city, street, build_name, mobile, email, fax, unit, note) VALUES('" + name + "','" + company_id + "','" + code + "','" +
        zip + "','" + state + "','" + city + "','" + street + "','" + build_name + "','" + mobile + "','" + email + "','" + fax + "','" + unit + "','" + note + "')";
    console.log(sqlStr);
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function modifyBusiness(req){
    let id = req.body.id;
    let name = req.body.name;
    let zip = req.body.zip;
    let state = req.body.state;
    let city = req.body.city;
    let street = req.body.street;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let email = req.body.email;
    let fax = req.body.fax;
    let note = req.body.note;
    let unit = req.body.unit;

    let sqlStr = "UPDATE t_business SET name = '" + name +
        "', zip = '" + zip +
        "', state = '" + state +
        "', city = '" + city +
        "', street = '" + street +
        "', build_name = '" + build_name +
        "', mobile = '" + mobile +
        "', email = '" + email +
        "', fax = '" + fax +
        "', unit = '" + unit +
        "', note = '" + note +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function getBusinessDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_business " +
        "WHERE email = '" + req.body.email + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getBusinessDetailById(req) {
    let sqlStr = "SELECT * " +
        " from t_business " +
        "WHERE id = '" + req.body.id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getBusinessList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let company_id = req.user.id;

    let start = per_page * (page - 1);
    let sqlStr = "SELECT * " +
        " from t_business " +
        " where company_id = '" + company_id + "' AND status = 1 " +
        " ORDER BY id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getAllBusinessList(req) {
    console.log(req.user);
    let company_id = req.user.id;
    let sqlStr = "SELECT * " +
        " from t_business " +
        " where company_id in (0, " + company_id + ") AND status = 1 " +
        " ORDER BY id ";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalBusiness(req) {
    let company_id = req.user.id;
    let sqlStr = "SELECT COUNT(id) as cnt FROM t_business WHERE company_id = '" + company_id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result[0].cnt;
}

async function removeBusiness(req) {
    let sqlStr = "UPDATE t_business SET status = 0 " +
        " WHERE id = " + req.body.id;
    console.log(sqlStr);
    let db = connection.makeDb();
    await db.query(sqlStr);

    sqlStr = "UPDATE t_product SET status = 0 " +
    " WHERE business_id = " + req.body.id;
    await db.query(sqlStr);
}


module.exports = {
    createBusinessApi: async function (req, res) {
        try {
            let exist = await checkBusinessExist(req.body.email);
            if(exist == true) {
                res.send(JSON.stringify({
                    status: false,
                    error: "business_exist"
                }));
            } else {
                let id = await createBusiness(req);
                res.send(JSON.stringify({
                    status: true,
                    id: id
                }));
            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    modifyBusinessApi: async function (req, res) {
        try {
            let exist = await checkBusinessExistById(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "business_not_exist"
                }));
            } else {
                let businessDetail = await getBusinessDetail(req);
                if(businessDetail.length > 0 && businessDetail[0].id != req.body.id) {
                    res.send(JSON.stringify({
                        status: false,
                        error: "business_email_exist"
                    }));
                } else {
                    await modifyBusiness(req);
                    res.send(JSON.stringify({
                        status: true,
                    }));
                }

            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    removeBusinessApi: async function (req, res) {
        try {
            let exist = await checkBusinessExistById(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "business_not_exist"
                }));
            } else {
                await removeBusiness(req);
                res.send(JSON.stringify({
                    status: true,
                }));
            }
            res.send(JSON.stringify({
                status: true
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getBusinessDetailApi: async function (req, res) {
        try {
            let result = await getBusinessDetailById(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "business_not_exist"
                }));
            }


        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getBusinessListApi: async function (req, res) {
        try {
            let totalCount = await getTotalBusiness(req);
            let businessList = await getBusinessList(req);
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
                data: businessList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    getAllBusinessListApi: async function (req, res) {
        try {
            let businessList = await getAllBusinessList(req);
            res.send(JSON.stringify({
                status: true,
                list: businessList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
