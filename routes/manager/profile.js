const connection = require("../../connection");


async function modifyProfile (req){
    let name = req.body.name;
    let password = req.body.new_password;
    let bank_info = req.body.bank_info;
    //let new_password = req.body.new_password;
    let id = req.user.id;

    let sqlStr = "UPDATE t_manager SET name = '" + name +
        "', password = '" + password +
        "', bank_info = '" + bank_info +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    await db.query(sqlStr);
};

async function getProfile(req) {
    let sqlStr = "SELECT * " +
        " from t_manager " +
        "WHERE id = '" + req.user.id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

module.exports = {
    modifyProfileApi: async function (req, res) {
        try {
            let result = await getProfile(req);
            if(result[0].password != req.body.password) {
                res.send(JSON.stringify({
                    status: false,
                    error: "password_invalid"
                }));
                return ;
            }
            await modifyProfile(req);
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
    getProfileApi: async function (req, res) {
        try {
            let result = await getProfile(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "manager_not_exist"
                }));
            }
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
