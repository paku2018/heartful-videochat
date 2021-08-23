const express = require('express');

//const Router = express.Router();
const connection = require("../connection");


module.exports = {
    sendManagerApi : async function(req, res) {
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

            }
        } catch(ex) {
            res.send(JSON.stringify({
                type: req.path,
                status: result,
            }));
        }

    }
}

async function login(req) {
    console.log(req.body);
    let email = req.body.email;
    let password = req.body.password;
    let sqlStr = "SELECT * " +
        " from t_manager as m " +
        "WHERE email = '" + email + "' AND password = '" + password + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
};


