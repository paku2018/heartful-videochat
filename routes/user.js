const express = require('express');

//const Router = express.Router();
const connection = require("../connection");
const util = require("../util");
const fs = require("fs");

const max = 1000;
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

const Client = require('@amazonpay/amazon-pay-api-sdk-nodejs');
const awsConfig = {


    'publicKeyId': config.client.aws_public_key,                 // RSA Public Key ID (this is not the Merchant or Seller ID)
    'privateKey': fs.readFileSync('./lib/private_product.pem'), // Path to RSA Private Key (or a string representation)
    'region': 'jp',                                   // Must be one of: 'us', 'eu', 'jp'
    // 'sandbox': true                                   // true (Sandbox) or false (Production) boolean
};

const paymentClient = new Client.AmazonPayClient(awsConfig);
const webStoreClient = new Client.WebStoreClient(awsConfig);

var nodemailer = require('nodemailer');
const mailUser = config.client.mail_user;
const mailPassword = config.client.mail_password;


const uuid_maxAge = 60 * 60;

let text_pool = [];
let text_index = 0;



const multer = require("multer");

function getExtension(name) {
    let split = name.split(".");
    if(split.length == 2) {
        return split[1];
    }
    return "";
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'media/avatar')
    },
    filename: function (req, file, cb) {
        let time = new Date().getTime();
        let rand = Math.floor(Math.random() * Math.floor(max));
        let filename = rand + "_" + time + "." + getExtension(file.originalname);
        cb(null, filename);
    }
});

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

async function createUUID() {

    while(true) {
        let code = util.createCode(0, 5) + util.getCurrentDate();
        let result = await checkCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}

var upload = multer({ storage: storage });

module.exports = {
    sendUserApi : async function(req, res) {

        let result = {};
        try {
            switch (req.path) {
                case 'send_code':
                    result = await sendCode(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: result,
                    }));
                    break;
                case 'check_code':
                    result = await checkCode(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        content: result
                    }));
                    break;
                case 'register':
                    result = await register(req);
                    res.send(JSON.stringify(result));
                    break;
                case 'register_member':
                    await registerMember(req);
                    res.send(JSON.stringify({
                        status: true
                    }));
                    break;
                case 'get_member':
                    result = await getMember(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        content: result
                    }));
                    break;
                case 'login':
                    result = await login(req);
                    if(result.length > 0) {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: true,
                            content: result[0]
                        }));
                    } else {
                        res.send(JSON.stringify({
                            status: false,
                        }));
                    }
                    break;
                case 'login_code':
                    result = await loginCode(req);
                    if(result.status == true) {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: true,
                            data: result.data
                        }));
                    } else {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: false,
                            data: result.message
                        }));
                    }
                    break;
                case 'change_profile':
                    result = await changeProfile(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: result
                    }));
                    break;
                case 'send_money':
                    result = await sendMoney(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true
                    }));
                    break;
                case 'get_message':
                    result = await getMessage(req);
                    if(result.length == 0) {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: true
                        }));
                    } else {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: true,
                            data: result[0]
                        }));
                    }

                    break;
                case 'send_message':
                    result = await sendMessage(req);
                    let message = '';
                    if(result == false) {
                        message = 'already_send';
                    }
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        message: message
                    }));
                    break;
                case 'remove_message':
                    result = await removeMessage(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true
                    }));
                    break;
                case 'get_offer':
                    result = await getOffer(req);
                    if(result.length == 0) {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: true
                        }));
                    } else {
                        res.send(JSON.stringify({
                            type: req.path,
                            status: true,
                            data: result[0]
                        }));
                    }

                    break;
                case 'send_offer':
                    result = await sendOffer(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                    }));
                    break;
                case 'modify_product_status':
                    await modifyProductStatus(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                    }));
                    break;
                case 'get_payment':
                    result = await getUserPaymentLog(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        data: result
                    }));
                    break;
                case 'get_history':
                    result = await getUserHistory(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        data: result
                    }));
                    break;
                case 'send_offer_mail':
                    await sendOfferMail(req);
                    break;
                case 'get_payment_signature':
                    let data = await getPaymentSignature(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        data: data
                    }));
                    break;
                case 'complete_payment':
                    await completePayment(req, res);
                    break;
                case 'get_last_payment':
                    result = await getLastPayment(req);
                    res.send(JSON.stringify({
                        type: req.path,
                        status: true,
                        data: result[0]
                    }));
                    break;
            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                type: req.path,
                status: result,
            }));
        }

    }
}

async function sendCode(req) {
    let mobile = req.body.mobile;
    let full_mobile = '+81' + mobile;
    let min = 100000;
    let range = 900000;
    let code = Math.floor(Math.random() * Math.floor(range)) + min;

    let id = req.body.id;

    client.api.messages
        .create({
            body: code,
            to: full_mobile,
            from: sender,
        }).then(function(data) {
        console.log('Administrator notified');
    }).catch(function(err) {
        console.error('Could not notify administrator');
        console.error(err);
    });
    let db = connection.makeDb();
    try {

        let sqlStr = "SELECT id from t_verification where mobile = ?";
        let result = await db.query(sqlStr, mobile);
        if(result.length > 0) {
            let sqlStr = "UPDATE t_verification SET code = ? WHERE mobile = ?";
            result = await db.query(sqlStr, [code, mobile]);
        } else {
            sqlStr = "INSERT INTO t_verification (mobile, code) VALUES(?, ?)";
            result = await db.query(sqlStr, [mobile, code]);
        }
        return true;
        // do something with someRows and otherRows
    } catch ( err ) {
        console.log(err);
        // handle the error
    } finally {
        //db.close();
    }
    return false;
}

async function checkCode(req) {
    let mobile = req.body.mobile;
    let code = req.body.code;

    let db = connection.makeDb();
    let sqlStr = "SELECT * from t_verification where mobile = ? AND code = ?";
    let result = await db.query(sqlStr, [mobile, code]);
    if(result.length > 0) {
        let dateStr = result[0].create_time;
        let date = new Date(Date.parse(dateStr));
        let cur = new Date();
        let dif = cur.getTime() - date.getTime();
        // if(dif > 1000 * 60 * 5) {
        //     return {
        //         status: false,
        //         message: 'Expired verification code',
        //     };
        // } else {
            return {
                status: true,
            };
        //}
    } else {
        return {
            status: false,
            message: 'Invalid Code',
        };
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

async function register(req) {
    let checkResult = await checkCode(req);
    if(checkResult.status == false) {
        return checkResult;
    }
    let name = req.body.name;
    let imageBuffer = null;
    if(req.body.file) {
        imageBuffer = decodeBase64Image(req.body.file);
    }

    let avatar = new Date().getTime() + ".png";
    let id = req.body.id;
    if(imageBuffer) {
        await fs.promises.writeFile("./uploads/" + avatar, imageBuffer.data);
    } else {
        avatar = "";
    }
    console.log(avatar);

    //Use the mv() method to place the file in upload directory (i.e. "uploads")
    //avatar.mv('./uploads/' + filename);

    let uuid = await createUUID();

    let db = connection.makeDb();

    let sqlStr = "INSERT INTO t_viewer (uuid, name, img, death_id) VALUES('" + uuid + "','" + name + "','" + avatar + "','" + id + "')";
    let result = await db.query(sqlStr);
    let user_id = result.insertId;
    req.body.user_id = user_id;
    await registerMember(req);
    await updateHistory(user_id, 'register', 0);
    return {
        status: true,
        uuid: uuid,
        id: user_id
    };
};



async function registerMember (req){
    console.log(req.body);
    let user_id = req.body.user_id;
    let company_name = req.body.company_name;
    let zip = req.body.zip;
    let address = req.body.address;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let telephone = req.body.telephone;
    let date = new Date();
    let product_request_date = date.getFullYear() + "-" + util.getTwoDigit(date.getMonth() + 1) + "-" + util.getTwoDigit(date.getDate());
    let sqlStr = "UPDATE t_viewer SET company_name = '" + company_name +
        "', zip = '" + zip +
        "', address = '" + address +
        "', build_name = '" + build_name +
        "', mobile = '" + mobile +
        "', product_request_date = '" + product_request_date +
        "', telephone = '" + telephone;
    sqlStr = sqlStr + "' WHERE id = " + user_id;
    console.log(sqlStr);
    let db = connection.makeDb();
    await db.query(sqlStr);
    return ;
};

async function getMember (req) {
    let member_id = req.body.member_id;
    let id = req.body.id;
    console.log(req.body);
    let sqlStr = "SELECT *" +
        " from t_viewer as m " +
        "WHERE m.id = ?;"

    let sqlStrMoney = "SELECT SUM(amount) as sum from t_incense WHERE member_id = ?;";
    let sqlStrProductMoney = "SELECT SUM(total_cost) as sum, t_product.type from t_payment_log LEFT JOIN t_product ON t_payment_log.product_id = t_product.id WHERE viewer_id = ? GROUP BY t_product.type;";
    let db = connection.makeDb();
    let results = await db.query(sqlStr + sqlStrMoney + sqlStrProductMoney, [member_id, member_id, member_id]);
    let data = {
        user: results[0],
        money: results[1],
        products: results[2],
    }
    return data;
};

async function login(req) {
    console.log(req.body);
    let id = req.body.id;
    let email = req.body.email;
    let password = req.body.password;
    let sqlStr = "SELECT m.*, v.uuid" +
        " from t_member as m " +
        " LEFT JOIN t_viewer as v ON m.viewer_id = v.id " +
        "WHERE m.email = '" + email + "' AND m.password = '" + password + "' AND v.funeral_id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
};

async function loginCode(req) {
    let id = req.body.id;
    let checkResult = await checkCode(req);

    if(checkResult.status == false) {
        return checkResult;
    }
    let sqlStr = "SELECT t_viewer.* " +
        " from t_viewer " +
        "WHERE mobile = '" + req.body.mobile + "' AND death_id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return {
            status: true,
            data: result[0]
        }
    }
    return {
        status: false,
        message: "User not exist"
    }
};

async function changeProfile(req) {
    let id = req.body.member_id;

    let checkSqlStr = "SELECT COUNT(id) as cnt FROM t_viewer WHERE id = " + id;
    let db = connection.makeDb();
    let checkResult = await db.query(checkSqlStr);
    if(checkResult[0].cnt == 0) {
        return false;
    }
    let name = req.body.name;
    let company_name = req.body.company_name;
    let zip = req.body.zip;
    let address = req.body.address;
    let build_name = req.body.build_name;
    let mobile = req.body.mobile;
    let telephone = req.body.telephone;


    let sqlStr = "UPDATE t_viewer SET name = '" + name +
        "', company_name = '" + company_name +
        "', zip = '" + zip +
        "', address = '" + address +
        "', build_name = '" + build_name +
        "', mobile = '" + mobile +
        "', telephone = '" + telephone +
        "' WHERE id = " + id;
    let result = await db.query(sqlStr);
    await updateHistory(id, 'change_profile', 0);
    return true;
};

async function sendMoney(req) {
    console.log(req.body);
    let id = req.body.id;
    let member_id = req.body.member_id;
    let products = req.body.products;
    let payment = req.body.payment;
    let status = req.body.status;
    let sqlStr = "INSERT INTO t_incense (death_id, member_id, amount, status) VALUES('" + id + "','" + member_id + "','" + payment + "','" + status + "')";
    let db = connection.makeDb();
    await db.query(sqlStr);
    for(var i = 0; i < products.length; i ++) {
        let product_id = products[i].product_id;
        let count = products[i].count;
        if(count > 0) {
            let total_cost = products[i].cost * count;
            let cost = parseInt(total_cost * (parseInt(products[i].fee) + 7) / 100);
            sqlStr = "INSERT INTO t_payment_log (viewer_id, product_id, count, total_cost, cost) VALUES('" + member_id + "','" + product_id + "','" + count
                + "','" + total_cost + "','" + cost + "')";
            await db.query(sqlStr);
        }

    }
}

async function getMessage(req) {
    let id = req.body.id;
    let member_id = req.body.member_id;

    let sqlStr = "SELECT * FROM t_message WHERE death_id = " + id + " AND member_id = " + member_id;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function sendMessage(req) {
    let id = req.body.id;
    let member_id = req.body.member_id;
    let content = req.body.content;
    let status = req.body.status;
    let direction = req.body.direction;

    let sqlStr = "SELECT * FROM t_message WHERE death_id = " + id + " AND member_id = " + member_id;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    let messageId;
    if(result.length > 0) {
        messageId = result[0].id;
        sqlStr = "UPDATE t_message SET content = '" + content + "', status = " + status + ", direction = " + direction + " WHERE id = " + result[0].id;
        await db.query(sqlStr);
    } else {
        sqlStr = "INSERT INTO t_message (death_id, member_id, content, status, direction) VALUES('" + id + "','" + member_id + "','" + content + "','" + status + "','" + direction + "')";
        result = await db.query(sqlStr);
        messageId = result.insertId;
    }

    if(status == 1) {
        await updateHistory(member_id, 'send_message', messageId);
    } else {
        await updateHistory(member_id, 'save_message', messageId);
    }
    return true;
}

async function removeMessage(req) {
    let id = req.body.id;
    let member_id = req.body.member_id;

    let db = connection.makeDb();
    let sqlStr = "DELETE FROM t_message WHERE death_id = " + id + " AND member_id = " + member_id;
    await db.query(sqlStr);
    await updateHistory(member_id, 'remove_message', 0);
    return true;
}

async function checkOfferCodeExist(code) {
    let sqlStr = "SELECT * " +
        " from t_offer " +
        "WHERE code = '" + code + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function createOfferCode(business_code) {

    while(true) {
        let code = business_code + util.getCurrentMonth() + util.createCode(0, 4);
        let result = await checkOfferCodeExist(code);
        if(result == false) {
            return code;
        }
    }
}

async function sendOffer(req) {
    let id = req.body.id;
    let member_id = req.body.member_id;
    let payment = req.body.payment;
    let flower_content = req.body.flower_content;
    let type = req.body.type;
    let business_code = req.body.business_code;
    let status = req.body.status;

    let offerCode = await createOfferCode(business_code);

    let sqlStr = "DELETE FROM t_offer WHERE death_id = " + id + " AND member_id = " + member_id  + " AND status = 1";
    let db = connection.makeDb();
    await db.query(sqlStr);
    sqlStr = "INSERT INTO t_offer (death_id, member_id, code, flower_content, payment, status, type) VALUES('" + id + "','" + member_id + "','" + offerCode + "','" + flower_content +
        "','" + payment + "','" + status + "','" + type + "')";
    let result = await db.query(sqlStr);
    if(status == 2) {
        await updateHistory(member_id, 'send_offer', result.insertId);
    }
    return true;
}

async function updateHistory(viewer_id, type, detail_id) {
    let db = connection.makeDb();
    let sqlStr = "INSERT INTO t_history (viewer_id, type, detail_id) VALUES('" + viewer_id + "','" + type + "','" + detail_id + "')";
    await db.query(sqlStr);
}

async function getOffer(req) {
    let id = req.body.id;
    let member_id = req.body.member_id;

    let sqlStr = "SELECT * FROM t_offer WHERE death_id = " + id + " AND member_id = " + member_id + " AND status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

function sendPaymentWithEmail(id, business_email, company_email, blob) {

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



    let path = './uploads/' + id + "_" + (new Date()).getTime() + ".jpg";

    var mailOptions = {
        from: mailUser,
        to: business_email,
        subject: 'HeartWarming Payment',
        attachments: [
            {   // utf-8 string as an attachment
                filename: '申込.jpg',
                path: path
            }]
    };
    fs.appendFile(path, Buffer.from(blob), function (err) {
        if (err) {
            console.log(err);
        } else {
            setTimeout(function() {
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Business Email sent: ' + info.response);
                    }
                });

                mailOptions.to = company_email;
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Company Email sent: ' + info.response);
                    }
                });
            }, 1000 * 3);

        }
    });


}

async function sendOfferMail(req) {
    let business_email = req.body.business_email;
    let company_email = req.body.company_email;
    // business_email = 'ameymax8@gmail.com';
    // company_email = 'cksong11@outlook.com';
    sendPaymentWithEmail(req.body.member_id, business_email, company_email, req.body.file);
}

async function getUserPaymentLog(req) {
    let member_id = req.body.member_id;
    let db = connection.makeDb();
    let sqlStr = "SELECT * FROM t_payment WHERE member_id = " + member_id + " AND status = 2 ORDER BY create_time";
    let payments = await db.query(sqlStr);
    sqlStr = "SELECT * FROM t_offer WHERE member_id = " + member_id + " ORDER BY create_time";
    let offers = await db.query(sqlStr);
    return {
        payments: payments,
        offers: offers
    }
}

async function getUserHistory(req) {
    let member_id = req.body.member_id;
    let db = connection.makeDb();
    let sqlStr = "SELECT * FROM t_history WHERE viewer_id = " + member_id + " ORDER BY create_time DESC";
    let result = await db.query(sqlStr);
    return result;
}

async function modifyProductStatus(req) {
    let member_id = req.body.member_id;
    let product_status = req.body.product_status;
    console.log(member_id + ":" + product_status);
    let db = connection.makeDb();
    let sqlStr = "UPDATE t_viewer SET product_status = ? WHERE id = ?";
    await db.query(sqlStr, [product_status, member_id]);
}

async function getPaymentSignature(req) {
    let amount = req.body.amount;
    let member_id = req.body.member_id;
    let id = req.body.id;
    let db = connection.makeDb();
    let sqlStr = "INSERT INTO t_payment (death_id, member_id, payment, type, status) VALUES('" + id + "','" + member_id + "','" + amount + "','" + "amazon" +
        "','" + 1 + "')";
    await db.query(sqlStr);
    let payload = req.body.payload;
    console.log(payload.addressDetails);
    let signature = paymentClient.generateButtonSignature(payload);
    return {
        signature: signature,
        public_key: config.client.aws_public_key
    };
}

async function getLastPayment(req) {
    let member_id = req.body.member_id;
    let sqlStr = "SELECT * FROM t_payment WHERE member_id = " + member_id + " AND status = 1 ORDER BY create_time DESC LIMIT 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

function completePayment(req, res) {
    let checkoutSessionId = req.body.checkoutSessionId;
    let amount = req.body.amount;
    let payment_id = req.body.payment_id;
    let member_id = req.body.member_id;
    const completeCheckoutSessionPayload = {
        chargeAmount: {
            amount: amount,
            currencyCode: 'JPY'
        }
    }
    webStoreClient.completeCheckoutSession(checkoutSessionId, completeCheckoutSessionPayload).then(async function (result) {
        let db = connection.makeDb();
        let sqlStr = "UPDATE t_payment SET status = 2 WHERE id = ?";
        await db.query(sqlStr, [payment_id]);
        await updateHistory(member_id, 'send_money', payment_id);
        res.send(JSON.stringify({
            type: req.path,
            status: true,
        }));
    }).catch(err => {
        res.send(JSON.stringify({
            type: req.path,
            status: false,
        }));
    });
}
//
// Router.post("/get-payment-detail", (req, res) => {
//
// });

//module.exports = Router;
