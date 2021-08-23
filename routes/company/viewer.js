const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");
const fs = require("fs");

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

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return null;
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

async function createViewer (req){
    let name = req.body.name;
    let company_name = req.body.company_name;
    let zip = req.body.zip;
    let address = req.body.address;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let telephone = req.body.telephone;
    let death_id = req.body.death_id;
    let uuid = await createUUID();
    let imageBuffer = decodeBase64Image(req.body.img);
    let img = new Date().getTime() + ".png";
    if(imageBuffer) {
        await fs.promises.writeFile("./uploads/" + img, imageBuffer.data);
    } else {
        img = "";
    }

    let sqlStr = "INSERT INTO t_viewer (name, company_name, death_id, uuid, zip, address, build_name, mobile, telephone, img) VALUES('" + name + "','" + company_name + "','"
        + death_id + "','" + uuid + "','" + zip + "','" + address + "','" + build_name + "','" + mobile + "','" + telephone + "','" + img + "')";
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
    let imageBuffer = decodeBase64Image(req.body.img);
    let img = new Date().getTime() + ".png";
    if(imageBuffer) {
        await fs.promises.writeFile("./uploads/" + img, imageBuffer.data);
    } else {
        img = "";
    }

    let sqlStr = "UPDATE t_viewer SET name = '" + name +
        "', company_name = '" + company_name +
        "', zip = '" + zip +
        "', address = '" + address +
        "', build_name = '" + build_name +
        "', mobile = '" + mobile +
        "', telephone = '" + telephone;

    if(img != '') {
        sqlStr = sqlStr + "', img = '" + img;
    }
    sqlStr = sqlStr + "' WHERE id = " + id;
    let db = connection.makeDb();
    await db.query(sqlStr);
};


async function getViewerDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE status = 1 AND id = '" + req.body.id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getViewerByMobile(req) {
    let sqlStr = "SELECT * " +
        " from t_viewer " +
        "WHERE status = 1 AND mobile = '" + req.body.mobile + "' AND death_id = '" + req.body.death_id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getViewerList(req) {
    let death_id = req.body.death_id;
    let sqlStr = "SELECT t_viewer.* " +
        " from t_viewer " +
        " where t_viewer.status = 1 AND t_viewer.death_id = " + death_id +
        " ORDER BY t_viewer.death_id ";
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalViewer(req) {
    let company_id = req.user.id;
    let checkSqlStr = "SELECT COUNT(t_viewer.id) as cnt " +
        " FROM t_viewer " +
        " left join t_death on t_death.id = t_viewer.death_id " +
        " WHERE t_viewer.status = 1 AND t_death.status = 1 AND t_death.company_id = " + company_id;
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
    getViewerListApi: async function (req, res) {
        try {
            let viewerList = await getViewerList(req);
            res.send(JSON.stringify({
                status: true,
                data: viewerList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    }
};
