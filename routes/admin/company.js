const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");

async function checkCompanyExist(email) {
    let sqlStr = "SELECT * " +
        " from t_company " +
        "WHERE email = '" + email + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkCompanyExistById(id) {
    let sqlStr = "SELECT * " +
        " from t_company " +
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
        " from t_company " +
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
        let code = util.createCode(0, 4);
        let result = await checkCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}

async function createCompany (req){
    let name = req.body.name;
    let zip = req.body.zip;
    let address = req.body.address;

    let mobile = req.body.mobile;
    let fax = req.body.fax;
    let email = req.body.email;
    let password = req.body.password;
    let note = req.body.note;
    let code = await createCode();

    //password = Auth.createPassword(password);
    let sqlStr = "INSERT INTO t_company (name, code, zip, address, mobile, fax, email, password, note) VALUES('" + name + "','" + code + "','" + zip + "','" + address
        + "','" + mobile + "','" + fax + "','" + email + "','" + password + "','" + note + "')";
    console.log(sqlStr);
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);

    let id = result.insertId;

    let bank_name = req.body.bank_name;
    let bank_address = req.body.bank_address;
    let payment_type = req.body.payment_type;
    let bank_password = req.body.bank_password;

    //bank_password = Auth.createPassword(bank_password);

    sqlStr = "INSERT INTO t_company_payment (company_id, bank_name, bank_address, payment_type, bank_password) VALUES('" + id + "','" + bank_name + "','" + bank_address + "','"
        + payment_type + "','" + bank_password + "')";

    await db.query(sqlStr);
    return id;
};


async function modifyCompany (req){

    let id = req.body.id;
    let name = req.body.name;
    let zip = req.body.zip;
    let address = req.body.address;

    let mobile = req.body.mobile;
    let fax = req.body.fax;
    let email = req.body.email;
    let password = req.body.password;
    let note = req.body.note;
    console.log(req.body);

    if(password.length > 0) {
        //password = Auth.createPassword(password);
    }

    let sqlStr = "UPDATE t_company SET name = '" + name +
        "', zip = '" + zip +
        "', address = '" + address +
        "', mobile = '" + mobile +
        "', fax = '" + fax +
        "', email = '" + email;
    if(password.length > 0) {
        sqlStr = sqlStr + "', password = '" + password;
    }

    sqlStr = sqlStr + "', note = '" + note +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    await db.query(sqlStr);

    let bank_name = req.body.bank_name;
    let bank_address = req.body.bank_address;
    let payment_type = req.body.payment_type;
    let bank_password = req.body.bank_password;

    if(bank_password.length > 0) {
        //bank_password = Auth.createPassword(bank_password);
    }


    sqlStr = "UPDATE t_company_payment SET bank_name = '" + bank_name +
        "', bank_address = '" + bank_address +
        "', payment_type = '" + payment_type;
    if(bank_password.length > 0) {
        sqlStr = sqlStr + "', bank_password = '" + bank_password;
    }
    sqlStr = sqlStr + "' WHERE company_id = " + id;
    await db.query(sqlStr);

};


async function getCompanyDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_company " +
        "WHERE email = '" + req.body.email + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getCompanyDetailById(req) {
    let sqlStr = "SELECT t_company.*, t_company_payment.bank_name, t_company_payment.bank_address, t_company_payment.payment_type,  t_company_payment.bank_password " +
        " from t_company " +
        " left join t_company_payment on t_company.id = t_company_payment.company_id " +
        "WHERE t_company.id = '" + req.body.id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getCompanyList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let sqlStr = "SELECT * " +
        " from t_company " +
        "ORDER BY id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalCompany() {
    let checkSqlStr = "SELECT COUNT(id) as cnt FROM t_company ";
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}


module.exports = {
    createCompanyApi: async function (req, res) {
        try {
            let exist = await checkCompanyExist(req.body.email);
            if(exist == true) {
                res.send(JSON.stringify({
                    status: false,
                    error: "company_exist"
                }));
            } else {
                let id = await createCompany(req);
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
    modifyCompanyApi: async function (req, res) {
        try {
            let exist = await checkCompanyExistById(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "company_not_exist"
                }));
            } else {
                let companyDetail = await getCompanyDetail(req);
                if(companyDetail.length > 0 && companyDetail[0].id != req.body.id) {
                    res.send(JSON.stringify({
                        status: false,
                        error: "company_email_exist"
                    }));
                } else {
                    await modifyCompany(req);
                    res.send(JSON.stringify({
                        status: true,
                    }));
                }

            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    removeCompanyApi: async function (req, res) {
        try {
            console.log(req);
            res.send(JSON.stringify({
                status: true
            }));
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getCompanyDetailApi: async function (req, res) {
        try {
            let result = await getCompanyDetailById(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "company_not_exist"
                }));
            }


        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getCompanyListApi: async function (req, res) {
        try {
            let totalCount = await getTotalCompany();
            let companyList = await getCompanyList(req);
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
                data: companyList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
