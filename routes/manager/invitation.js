const connection = require("../../connection");

async function getDeathId(id) {
    let sqlStr = "SELECT * " +
        " from t_manager " +
        "WHERE id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result[0].death_id;
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

async function modifyInvitation (req, id){
    let detail = req.body.detail;
    let place_status = req.body.place_status;

    let sqlStr = "UPDATE t_death SET detail = '" + detail +
        "', place_status = '" + place_status +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    await db.query(sqlStr);
};

module.exports = {
    modifyInvitationApi: async function (req, res) {
        try {
            let id = await getDeathId(req.user.id);
            let exist = await checkDeathExist(id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "death_not_exist"
                }));
            } else {

                await modifyInvitation(req, id);
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

};
