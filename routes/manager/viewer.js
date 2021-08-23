const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");
const excel = require("exceljs");

async function getDeathId(id) {
    let sqlStr = "SELECT * " +
        " from t_manager " +
        "WHERE id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result[0].death_id;
}

async function checkViewerExist(death_id, mobile) {
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE status = 1 AND mobile = '" + mobile + "' AND death_id = '" + death_id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkViewerExistById(id) {
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE status = 1 AND id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkCodeExist(uuid) {
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE uuid = '" + uuid + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function createUUID(company_id) {

    while(true) {
        let code = util.createCode(0, 5) + util.getCurrentDate();
        let result = await checkCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}

async function createViewer (req){
    let name = req.body.name;
    let company_name = req.body.company_name;
    let zip = req.body.zip;
    let address = req.body.address;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let telephone = req.body.telephone;
    let death_id = await getDeathId(req.user.id);
    let product_status = req.body.product_status;
    let product_request_date = req.body.product_request_date;
    let product_return_date = req.body.product_return_date;

    let uuid = await createUUID();

    let sqlStr = "INSERT INTO t_viewer (name, company_name, death_id, uuid, zip, address, build_name, mobile, telephone, product_status, product_request_date, product_return_date) " +
        " VALUES('" + name + "','" + company_name + "','"  + death_id + "','" + uuid + "','" + zip + "','" + address + "','"
        + build_name + "','" + mobile + "','" + telephone + "','" + product_status + "','" + product_request_date + "',";
    if(product_return_date) {
        sqlStr = sqlStr + "'" + product_return_date + "')";
    } else {
        sqlStr = sqlStr + "null)";
    }
    console.log(sqlStr);
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function modifyViewer (req){
    let id = req.body.id;
    let name = req.body.name;
    let company_name = req.body.company_name;
    let zip = req.body.zip;
    let address = req.body.address;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let telephone = req.body.telephone;
    let product_status = req.body.product_status;
    let product_request_date = req.body.product_request_date;
    let product_return_date = req.body.product_return_date;


    let sqlStr = "UPDATE t_viewer SET name = '" + name +
        "', company_name = '" + company_name +
        "', zip = '" + zip +
        "', address = '" + address +
        "', build_name = '" + build_name +
        "', mobile = '" + mobile +
        "', telephone = '" + telephone +
        "', product_status = '" + product_status +
        "', product_request_date = '" + product_request_date + "', product_return_date = ";
    if(product_return_date) {
        sqlStr = sqlStr + "'" + product_return_date + "' ";
    } else {
        sqlStr = sqlStr + "null ";
    }
    sqlStr = sqlStr + " WHERE id = " + id;
    console.log(sqlStr);
    let db = connection.makeDb();
    await db.query(sqlStr);
};


async function getViewerDetail(req) {
    let sqlStr = "SELECT t_viewer.* " +
        " from t_viewer " +
        " WHERE status = 1 AND id = '" + req.body.id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getViewerByMobile(req) {
    let death_id = await getDeathId(req.user.id);
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE status = 1 AND mobile = '" + req.body.mobile + "' AND death_id = '" + death_id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getViewerList(req) {
    let death_id = await getDeathId(req.user.id);
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let sqlStr = "SELECT t_viewer.*, payments.price, t_message.id as message_id, t_message.status as message_status " +
        " from t_viewer " +
        " left join (SELECT member_id, SUM(payment) price FROM t_payment GROUP BY member_id) AS payments on t_viewer.id = payments.member_id " +
        " LEFT JOIN t_message ON t_viewer.id = t_message.member_id  " +
        " where t_viewer.status = 1 AND t_viewer.death_id = " + death_id +
        " ORDER BY message_status DESC, t_viewer.id ASC LIMIT " + start + ", " + per_page;
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getAllViewerList(req) {
    let death_id = await getDeathId(req.user.id);
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        " left join (SELECT viewer_id, SUM(total_cost) price FROM t_payment_log GROUP BY viewer_id) AS payments on t_viewer.id = payments.viewer_id " +
        " where t_viewer.status = 1 AND t_viewer.death_id = " + death_id +
        " ORDER BY t_viewer.id ";
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalViewer(req) {
    let death_id = await getDeathId(req.user.id);
    let checkSqlStr = "SELECT COUNT(id) as cnt " +
        " FROM t_viewer " +
        " WHERE status = 1 AND death_id = " + death_id;
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}

async function removeViewer(req) {
    let sqlStr = "UPDATE t_viewer SET status = 0 " +
        " WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(sqlStr);
}


async function getMessageDetail(req) {
    let id = req.body.id;
    let sqlStr = "SELECT * FROM t_message " +
        " WHERE id = " + id;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

module.exports = {
    createViewerApi: async function (req, res) {
        try {
            let exist = await checkViewerExist(req.body.death_id, req.body.mobile);
            if(exist == true) {
                res.send(JSON.stringify({
                    status: false,
                    error: "mobile_exist"
                }));
            } else {
                let id = await createViewer(req);
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
    modifyViewerApi: async function (req, res) {
        try {
            let exist = await checkViewerExistById(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "viewer_not_exist"
                }));
            } else {
                let viewerDetail = await getViewerByMobile(req);
                if(viewerDetail.length > 0 && viewerDetail[0].id != req.body.id) {
                    res.send(JSON.stringify({
                        status: false,
                        error: "mobile_exist"
                    }));
                } else {
                    await modifyViewer(req);
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
    removeViewerApi: async function (req, res) {
        try {
            await removeViewer(req);
            res.send(JSON.stringify({
                status: true
            }));
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getViewerDetailApi: async function (req, res) {
        try {
            let result = await getViewerDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "viewer_not_exist"
                }));
            }


        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getMessageDetailApi: async function (req, res) {
        try {
            let result = await getMessageDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "message_not_exist"
                }));
            }


        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getViewerListApi: async function (req, res) {
        try {
            let totalCount = await getTotalViewer(req);
            let viewerList = await getViewerList(req);
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
                data: viewerList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    downloadViewerListApi: async function (req, res) {
        try {
            let viewerList = await getAllViewerList(req);

            let originalColumns = [
                { header: "記帳日", key: "product_request_date", width: 5 },
                { header: "弔問者ID", key: "uuid", width: 25 },
                { header: "お名前", key: "name", width: 25 },
                { header: "住所", key: "address", width: 10 },
                { header: "電話", key: "mobile", width: 10 },
                { header: "お香典", key: "price", width: 10 },
                { header: "返礼品送付可否(チェックボタン)", key: "product_status", width: 10 },
                { header: "返礼品の送付日個別指定", key: "product_return_date", width: 10 },
            ];
            let columns = [];
            originalColumns.forEach(obj => {
                columns.push(obj);
            })

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("弔問者");

            worksheet.columns = columns;

            let tutorials = [];
            viewerList.forEach((obj) => {
                tutorials.push({
                    product_request_date: obj.product_request_date,
                    uuid: obj.uuid,
                    name: obj.name,
                    address: obj.address,
                    mobile: obj.mobile,
                    price: obj.price,
                    product_status: obj.product_status == 0 ? '否':'可',
                    product_return_date: obj.product_return_date
                });
            });
            worksheet.addRows(tutorials);

            // res is a Stream object
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "tutorials.xlsx"
            );
            await workbook.xlsx.write(res);
            res.status(200).end();
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
