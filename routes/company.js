const connection = require("../connection");

module.exports = {
    sendCompanyApi: async function (req, res) {
        try {

            let id = req.body.id;
            let sqlStr = "SELECT *" +
                " from t_company as c " +
                "WHERE c.id = '" + id + "'";
            let db = connection.makeDb();
            let result = await db.query(sqlStr);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    content: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                }));
            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }

    },
    getScheduleApi: async function(req, res) {
        try {

        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    }
};
