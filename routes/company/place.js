const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");


async function checkPlaceExist(id) {
    let sqlStr = "SELECT * " +
        " from t_place " +
        "WHERE id = '" + id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkPlaceUsed(id) {
    let sqlStr = "SELECT * " +
        " from t_death " +
        "WHERE place_id = '" + id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkCodeExist(code) {
    let sqlStr = "SELECT * " +
        " from t_place " +
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

async function createPlace(req){
    let img1 = '';
    let img2 = '';
    if(req.files && req.files.img1) {
        let imgFile = req.files.img1;
        img1 = await util.createFile(imgFile);
    }

    if(req.files && req.files.img2) {
        let imgFile = req.files.img2;
        img2 = await util.createFile(imgFile);
    }

    let name = req.body.name;
    let zip = req.body.zip;
    let state = req.body.state;
    let city = req.body.city;
    let street = req.body.street;
    let build_name = req.body.build_name;
    let note = req.body.note;
    let company_id = req.user.id;
    let code = await createCode();

    let sqlStr = "INSERT INTO t_place (name, company_id, code, zip, state, city, street, build_name, img1, img2, note) VALUES('" + name + "','" + company_id + "','" + code + "','" + zip + "','" + state + "','" + city + "','"
        + street + "','" + build_name + "','" + img1 + "','" + img2 + "','" + note + "')";
    console.log(sqlStr);
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};



async function modifyPlace(req){
    let id = req.body.id;
    let name = req.body.name;
    let zip = req.body.zip;
    let state = req.body.state;
    let city = req.body.city;
    let street = req.body.street;
    let build_name = req.body.build_name;
    let note = req.body.note;

    let img1 = '';
    let img2 = '';
    if(req.files && req.files.img1) {
        let imgFile = req.files.img1;
        img1 = await util.createFile(imgFile);
    }

    if(req.files && req.files.img2) {
        let imgFile = req.files.img2;
        img2 = await util.createFile(imgFile);
    }

    let img1_status = req.body.img_status1;

    let img2_status = req.body.img_status2;

    let sqlStr = "UPDATE t_place SET name = '" + name +
        "', zip = '" + zip +
        "', state = '" + state +
        "', city = '" + city +
        "', street = '" + street +
        "', build_name = '" + build_name +
        "', note = '" + note;

    if(img1 != '' || img1_status == "true") {
        sqlStr = sqlStr +
            "', img1 = '" + img1;
    }

    if(img2 != '' || img2_status == "true") {
        sqlStr = sqlStr +
            "', img2 = '" + img2;
    }
    sqlStr = sqlStr +
        "' WHERE id = " + id + " ";
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};




async function getPlaceDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_place " +
        "WHERE id = '" + req.body.id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getPlaceList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let company_id = req.user.id;
    let sqlStr = "SELECT * " +
        " from t_place " +
        " where company_id = '" + company_id + "' AND status = 1 " +
        " ORDER BY id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getAllPlaceList(req) {
    let company_id = req.user.id;
    let sqlStr = "SELECT * " +
        " from t_place " +
        " where company_id  = '" + company_id + "' AND status = 1 " +
        " ORDER BY id ";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalPlace(req) {
    let company_id = req.user.id;
    let sqlStr = "SELECT COUNT(id) as cnt FROM t_place WHERE company_id  = '" + company_id + "' AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result[0].cnt;
}

async function removePlace(req) {
    let sqlStr = "UPDATE t_place SET status = 0 " +
        " WHERE id = " + req.body.id;
    console.log(sqlStr);
    let db = connection.makeDb();
    await db.query(sqlStr);
}


module.exports = {
    createPlaceApi: async function (req, res) {
        try {

            let id = await createPlace(req);
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
    modifyPlaceApi: async function (req, res) {
        try {
            let exist = await checkPlaceExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "place_not_exist"
                }));
            } else {

                await modifyPlace(req);
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
    removePlaceApi: async function (req, res) {
        try {
            let exist = await checkPlaceExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "place_not_exist"
                }));
            } else {
                let used = await checkPlaceUsed(req.body.id);
                if(used == true) {
                    res.send(JSON.stringify({
                        status: false,
                        error: "place_used"
                    }));
                } else {
                    await removePlace(req);
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
    getPlaceDetailApi: async function (req, res) {
        try {
            let result = await getPlaceDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "place_not_exist"
                }));
            }


        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getPlaceListApi: async function (req, res) {
        try {
            let totalCount = await getTotalPlace(req);
            let placeList = await getPlaceList(req);
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
                data: placeList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    getAllPlaceListApi: async function (req, res) {
        try {
            let placeList = await getAllPlaceList(req);
            res.send(JSON.stringify({
                status: true,
                list: placeList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
