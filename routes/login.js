const connection = require("../connection");

const Auth = require('../lib/auth');

async function managerLogin(email) {
    let sqlStr = "SELECT t_manager.* " +
        " from t_manager " +
        " left join t_death on t_death.id = t_manager.death_id " +
        " WHERE email = '" + email + "' AND t_death.status = 1";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
};

async function companyLogin(email) {
    let sqlStr = "SELECT * " +
        " from t_company " +
        "WHERE email = '" + email + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
};

async function adminLogin(email) {
    let sqlStr = "SELECT * " +
        " from t_admin " +
        "WHERE email = '" + email + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
};

async function checkToken(req) {

}

async function refreshToken() {

}

async function updateToken(type, user_id, token) {
    let sqlStr = "INSERT INTO t_token (type, user_id, token) VALUES('" + type + "','" + user_id + "','" + token + "')";
    let db = connection.makeDb();
    await db.query(sqlStr);
}

module.exports = {
    sendAdminApi: async function (req, res) {
        try {
            let result;
            let email = req.body.email;
            let type = req.body.type;
            switch(type) {
                case 'admin':
                    result = await adminLogin(email);
                    break;
                case 'company':
                    result = await companyLogin(email);
                    break;
                case 'manager':
                    result = await managerLogin(email);
                    break;
            }
            if(result.length > 0) {
                if(req.body.password == result[0].password) {
                    let token = Auth.getAccessToken(type, result[0].id);
                    //await updateToken(req.type, result[0].id, token);
                    res.send(JSON.stringify({
                        status: true,
                        content: result[0],
                        token: token
                    }));
                } else {
                    res.send(JSON.stringify({
                        status: false,
                        error: "password_incorrect"
                    }));
                }

            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "user_not_exist"
                }));
            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }

    },

    createTokenApi: async function(req, res) {
        let type = req.body.type;
        let id = req.body.id;
        let token = Auth.getAccessToken(type, id);
        console.log('Create token is ' + token + ":" + type + ":" + id);
        res.send(JSON.stringify({
            status: true,
            token: token
        }));
    }
};
