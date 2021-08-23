const connection = require("../../connection");
const Auth = require("../../lib/auth");
const util = require("../../util");
const fs = require("fs");
var nodemailer = require('nodemailer');

const CONFIG_FILE = './config.json';
if (!fs.existsSync(CONFIG_FILE)) {
    console.error('The config file not found.');
    return;
}
const jsonc = require('jsonc').safe; // json with comment
const [err, config] = jsonc.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
const accountSid = config.client.twilio_sid;
const authToken = config.client.twilio_token;
const client = require('twilio')(accountSid, authToken);
const sender = config.client.twilio_sender_number;
const mailUser = config.client.mail_user;
const mailPassword = config.client.mail_password;
const frontUrl = config.server.front_origin;

async function checkManagerExist(email) {
    let sqlStr = "SELECT * " +
        " from t_manager " +
        "WHERE email = '" + email + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function checkDeathExist(id) {
    let sqlStr = "SELECT * " +
        " from t_death " +
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
        " from t_death " +
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
        let code = company_code + util.getCurrentDate() + util.createCode(1, 2);
        let result = await checkCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}

async function createDeath (req){
    let name = req.body.name;
    let first_name = req.body.first_name;
    let age = req.body.age;
    let end_date = req.body.end_date;
    let note = req.body.note;
    let place_id = req.body.place_id;
    let place_note = req.body.place_note;
    let company_id = req.user.id;
    let business_id = req.body.business_id;
    let code = await createCode(company_id);
    let camera1 = req.body.camera1;
    let camera2 = req.body.camera2;
    let camera3 = req.body.camera3;
    let camera_email = req.body.camera_email;

    let live_password = req.body.live_password;
    let live_status = req.body.live_status;
    let image_status = 0;

    note = note.replace(/訃報ID/g, code);
    let sqlStr = "INSERT INTO t_death (name, first_name, company_id, business_id, code, age, end_date, note, camera_email, camera1, camera2, camera3, place_id, place_note, image_status, live_status, live_password) VALUES('"
        + name + "','" + first_name + "','" + company_id + "','" + business_id + "','" + code + "','" + age + "','" + end_date + "','" + note + "','" + camera_email + "','"
        + camera1 + "','" + camera2 + "','" + camera3 + "','" + place_id + "','" + place_note + "','" + image_status + "','" + live_status + "','" + live_password + "')";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);

    let id = result.insertId;

    let manager_name = req.body.manager_name;
    let email = req.body.email;
    let password = req.body.password;
    let relation = req.body.relation;
    // password = Auth.createPassword(password);
    sqlStr = "INSERT INTO t_manager (name, email, password, death_id, relation) VALUES('" + manager_name + "','" + email + "','" + password + "','" + id + "','" + relation + "')";
    result = await db.query(sqlStr);


    return id;
};


async function modifyDeath (req){
    let id = req.body.id;
    let name = req.body.name;
    let first_name = req.body.first_name;
    let age = req.body.age;
    let end_date = req.body.end_date;
    let note = req.body.note;
    let place_id = req.body.place_id;
    let business_id = req.body.business_id;
    let place_note = req.body.place_note;
    let camera1 = req.body.camera1;
    let camera2 = req.body.camera2;
    let camera3 = req.body.camera3;
    let camera_email = req.body.camera_email;

    let live_password = req.body.live_password;
    let live_status = req.body.live_status;


    let sqlStr = "UPDATE t_death SET name = '" + name +
        "', first_name = '" + first_name +
        "', age = '" + age +
        "', end_date = '" + end_date +
        "', note = '" + note +
        "', camera1 = '" + camera1 +
        "', camera2 = '" + camera2 +
        "', camera3 = '" + camera3 +
        "', camera_email = '" + camera_email +
        "', place_id = '" + place_id +
        "', business_id = '" + business_id +
        "', place_note = '" + place_note +
        "', live_status = '" + live_status +
        "', live_password = '" + live_password +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    await db.query(sqlStr);

    let manager_name = req.body.manager_name;
    let email = req.body.email;
    let password = req.body.password;
    let relation = req.body.relation;
    if(password.length > 0) {
        //password = Auth.createPassword(password);
    }


    sqlStr = "UPDATE t_manager SET name = '" + manager_name +
        "', email = '" + email;

    if(password.length > 0) {
        sqlStr = sqlStr + "', password = '" + password;
    }

    sqlStr = sqlStr + "', relation = '" + relation +
        "' WHERE death_id = " + id;
    await db.query(sqlStr);
};

async function modifyDeathImageStatus (req){
    let id = req.body.id;

    let image_status = req.body.image_status;


    let sqlStr = "UPDATE t_death SET image_status = '" + image_status +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    await db.query(sqlStr);
};


async function getDeathDetail(req) {
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.email, t_manager.relation, t_manager.password as manager_password, t_place.name as place_name " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " left join t_place on t_place.id = t_death.place_id " +
        "WHERE t_death.id = '" + req.body.id + "'";

    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getDeathDetailByEmail(req) {
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        "WHERE t_manager.email = '" + req.body.email + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getDeathList(req) {
    let company_id = req.user.id;
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.password, t_manager.email, t_manager.relation, t_manager.id as manager_id  " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " where t_death.status = 1 AND t_death.company_id = " + company_id +
        " ORDER BY t_death.id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getAllDeathList(req) {
    let company_id = req.user.id;
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.password, t_manager.email, t_manager.relation  " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " where t_death.status = 1 AND t_death.company_id = " + company_id;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalDeath(req) {
    let company_id = req.user.id;
    let checkSqlStr = "SELECT COUNT(id) as cnt FROM t_death WHERE t_death.status = 1 AND t_death.company_id = " + company_id;
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}

async function removeDeath(req) {
    let sqlStr = "UPDATE t_death SET delete_request = 1 " +
        " WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(sqlStr);
}

async function createDeathProduct(req) {

    let id = req.body.id;
    let productListStr = req.body.products;
    let productList = productListStr.split(",");
    let removeSqlStr = "DELETE FROM t_death_product WHERE death_id = " + id;
    let db = connection.makeDb();
    await db.query(removeSqlStr);
    for(var i = 0; i < productList.length; i ++) {
        let sqlStr = "INSERT INTO t_death_product (death_id, product_id) VALUES('" + id + "','" + productList[i] + "')";
        await db.query(sqlStr);
    }
}

async function getDeathProducts(req) {
    let company_id = req.user.id;
    let id = req.body.id;
    let productSqlStr = "SELECT * FROM t_product WHERE company_id in (0, " + company_id + ") AND status = 1 ORDER BY type";
    let db = connection.makeDb();
    let productList = await db.query(productSqlStr);
    let deathProductSqlStr = "SELECT * FROM t_death_product WHERE death_id = " + id;
    let deathProductList = await db.query(deathProductSqlStr);
    for(var i = 0; i < productList.length; i ++) {
        var status = false;
        for(var j = 0; j < deathProductList.length; j ++) {
            if(productList[i]["id"] == deathProductList[j]["product_id"]) {
                status = true;
            }
        }
        productList[i]["status"] = status;
    }
    return productList;

}

async function getDeathCameras(req) {
    let company_id = req.user.id;

    let productSqlStr = "SELECT * FROM t_death WHERE company_id in (0, " + company_id + ") AND status = 1";
    let db = connection.makeDb();
    let deathList = await db.query(productSqlStr);
    let cameraList = [];
    let emailList = [];
    for(var i = 0; i < deathList.length; i ++) {
        if(deathList[i]["camera1"] && deathList[i]["camera1"] != '') {
            cameraList.push(deathList[i]["camera1"]);
        }
        if(deathList[i]["camera2"] && deathList[i]["camera2"] != '') {
            cameraList.push(deathList[i]["camera2"]);
        }
        if(deathList[i]["camera3"] && deathList[i]["camera3"] != '') {
            cameraList.push(deathList[i]["camera3"]);
        }

        if(deathList[i]["camera_email"] && deathList[i]["camera_email"] != '') {
            emailList.push(deathList[i]["camera_email"]);
        }

    }
    cameraList = cameraList.sort();
    emailList = emailList.sort();
    var answerCameraList = [];
    var answerEmailList = [];
    for(var i = 0; i < cameraList.length; i ++) {
        if(i > 0 && cameraList[i] == cameraList[i - 1]) {
            continue;
        }
        answerCameraList.push(cameraList[i]);
    }

    for(var i = 0; i < emailList.length; i ++) {
        if(i > 0 && emailList[i] == emailList[i - 1]) {
            continue;
        }
        answerEmailList.push(emailList[i]);
    }
    return {
        cameras: answerCameraList,
        emails: answerEmailList
    };
}

function sendUrl(mobile, code, index) {
    if(!mobile || mobile == '') {
        return ;
    }
    let full_mobile = '+81' + mobile;
    let body = "次のurlにアクセスしてください(訃報ID:" + code + "). " + frontUrl + "/user/#/live/login/camera/" + index;
    client.api.messages
        .create({
            body: body,
            to: full_mobile,
            from: sender,
        }).then(function(data) {
        console.log('Administrator notified to camera sms');
    }).catch(function(err) {
        console.error('Could not notify administrator');
        console.error(err);
    });
}

function sendUrlWithEmail(email, code) {
    if(!email || email == '') {
        return ;
    }

    let body = "次のurlにアクセスしてください(訃報ID:" + code + ").\n "
        + frontUrl + "/user/#/live/login/camera/" + 1 + "\n"
        + frontUrl + "/user/#/live/login/camera/" + 2 + "\n"
        + frontUrl + "/user/#/live/login/camera/" + 3 + "\n";

    var transporter = nodemailer.createTransport({
        // service: 'gmail',
        host: "smtp.gmail.com",
        secure: true,
        port: 465,
        auth: {
            user: mailUser,
            pass: mailPassword
        }
    });

    var mailOptions = {
        from: mailUser,
        to: email,
        subject: 'HeartWarming Camera Login',
        text: body
    };
    console.log(mailOptions);

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

async function sendUrlToCamera(req) {
    let id = req.body.id;
    let sqlStr = "SELECT * FROM t_death WHERE id = " + id;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    let camera1 = result[0]["camera1"];
    let camera2 = result[0]["camera2"];
    let camera3 = result[0]["camera3"];
    let code = result[0].code;
    if(result[0].camera_email && result[0].camera_email != '') {
        sendUrlWithEmail(result[0].camera_email, code);

    } else {
        sendUrl(camera1, code, 1);
        sendUrl(camera2, code, 2);
        sendUrl(camera3, code, 3);
    }

}


module.exports = {
    createDeathApi: async function (req, res) {
        try {
            let exist = await checkManagerExist(req.body.email);
            if(exist == true) {
                res.send(JSON.stringify({
                    status: false,
                    error: "email_exist"
                }));
            } else {
                let id = await createDeath(req);
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
    modifyDeathApi: async function (req, res) {
        try {
            let exist = await checkDeathExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "death_not_exist"
                }));
            } else {
                let deathDetail = await getDeathDetailByEmail(req);
                if(deathDetail.length > 0 && deathDetail[0].id != req.body.id) {
                    res.send(JSON.stringify({
                        status: false,
                        error: "manager_email_exist"
                    }));
                } else {
                    await modifyDeath(req);
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
    modifyDeathImageStatusApi: async function (req, res) {
        try {
            let exist = await checkDeathExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "death_not_exist"
                }));
            } else {
                await modifyDeathImageStatus(req);
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
    createDeathProductApi: async function (req, res) {
        try {
            await createDeathProduct(req);
            res.send(JSON.stringify({
                status: true,
            }));

        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getDeathProductApi: async function (req, res) {
        try {
            let result = await getDeathProducts(req);
            res.send(JSON.stringify({
                status: true,
                detail: result
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getDeathCameraApi: async function (req, res) {
        try {
            let result = await getDeathCameras(req);
            res.send(JSON.stringify({
                status: true,
                detail: result
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
    getDeathDetailApi: async function (req, res) {
        try {
            let result = await getDeathDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "death_not_exist"
                }));
            }


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
    sendUrlApi: async function (req, res) {
        try {
            await sendUrlToCamera(req);
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
};
