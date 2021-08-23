const connection = require("../connection");

module.exports = {
    sendInquiryApi: async function (req, res) {
        try {
            let email = req.body.email;
            let member_id = req.body.member_id;
            let content = req.body.content;
            let type = req.body.type;
            let sqlStr = "";
            if(email != 'null' && email != '') {
                sqlStr = "INSERT INTO t_email_inquiry (email, contents, type) VALUES('" + email + "','" + content + "','" + type + "')";
            } else {
                sqlStr = "INSERT INTO t_inquiry (member_id, contents, type) VALUES('" + member_id + "','" + content + "','" + type + "')";
            }
            let db = connection.makeDb();
            let result = await db.query(sqlStr);
            res.send(JSON.stringify({
                status: true,
            }));
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }

    }
};
