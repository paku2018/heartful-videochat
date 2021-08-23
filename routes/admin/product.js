const connection = require("../../connection");
const multer = require('multer');
const util = require("../../util");


async function checkProductExist (id){
    let sqlStr = "SELECT id " +
        " from t_product " +
        "WHERE id = '" + id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function createProduct (req){

    let img = '';
    if(req.files && req.files.image) {
        let imgFile = req.files.image;
        img = await util.createFile(imgFile);
    }

    let business_id = req.body.business_id;
    let name = req.body.name;
    let type = req.body.type;
    let type_detail = req.body.type_detail;
    let cost = req.body.cost;
    let fee = req.body.fee;
    let note = req.body.note;


    let sqlStr = "INSERT INTO t_product (business_id, name, type, type_detail, cost, fee, img, note) VALUES('" + business_id + "','" + name + "','" + type + "','" + type_detail + "','" +
        cost + "','" + fee + "','" + img + "','" + note + "')";
    console.log(sqlStr);
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function modifyProduct (req){
    let id = req.body.id;
    let business_id = req.body.business_id;
    let name = req.body.name;
    let type = req.body.type;
    let type_detail = req.body.type_detail;
    let cost = req.body.cost;
    let fee = req.body.fee;
    let note = req.body.note;
    let img = '';
    console.log(req.files);
    if(req.files && req.files.image) {
        let imgFile = req.files.image;
        img = await util.createFile(imgFile);
    }

    let image_status = req.body.image_status;

    let sqlStr = "UPDATE t_product SET business_id = '" + business_id +
        "', name = '" + name +
        "', type = '" + type +
        "', type_detail = '" + type_detail +
        "', cost = '" + cost +
        "', fee = '" + fee +
        "', note = '" + note;
    if(img != '' || image_status == "true") {
        sqlStr = sqlStr +
            "', img = '" + img;
    }
    sqlStr = sqlStr +
        "' WHERE id = " + id + " ";
    console.log(sqlStr);
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};

async function getProductDetail(req) {
    let sqlStr = "SELECT t_product.*, t_business.name as business_name " +
        " from t_product " +
        " left join t_business on t_product.business_id = t_business.id " +
        " WHERE t_product.id = '" + req.body.id + "' AND t_product.status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}


async function getProductList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let sqlStr = "SELECT t_product.*, t_business.name as business_name " +
        " from t_product " +
        " left join t_business on t_product.business_id = t_business.id " +
        " where t_product.company_id = 0 AND t_product.status = 1 " +
        " ORDER BY id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalProduct() {
    let checkSqlStr = "SELECT COUNT(id) as cnt FROM t_product WHERE company_id = 0 AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}

async function removeProduct(req) {
    let sqlStr = "UPDATE t_product SET status = 0 " +
    " WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(sqlStr);
}


module.exports = {
    createProductApi: async function (req, res) {
        try {
            let id = await createProduct(req);
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
    modifyProductApi: async function (req, res) {
        try {
            let exist = await checkProductExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "product_not_exist"
                }));
            } else {
                await modifyProduct(req);
                res.send(JSON.stringify({
                    status: true,
                }));

            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    removeProductApi: async function (req, res) {
        try {
            let exist = await checkProductExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "product_not_exist"
                }));
            } else {
                await removeProduct(req);
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
    getProductDetailApi: async function (req, res) {
        try {
            let result = await getProductDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "product_not_exist"
                }));
            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getProductListApi: async function (req, res) {
        try {
            let totalCount = await getTotalProduct();
            let productList = await getProductList(req);
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
                data: productList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
