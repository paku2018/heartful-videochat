const connection = require("../../connection");
const util = require("../../util");

async function checkScheduleExist (id){
    let sqlStr = "SELECT id " +
        " from t_schedule " +
        "WHERE id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}

async function createSchedule (req){
    let death_id = req.body.death_id;
    let start_date = req.body.start_date;
    let start_time = req.body.start_time;
    let end_time = req.body.end_time;
    let type = req.body.type;
    let place_id = req.body.place_id;
    let event_name = req.body.event_name;

    let sqlStr = "INSERT INTO t_schedule (death_id, start_date, start_time, end_time, type, place_id, event_name) VALUES('" + death_id + "','" + start_date + "','" + start_time + "','" + end_time + "','" +
        type + "','" + place_id + "','" + event_name + "')";
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function modifySchedule (req){
    let id = req.body.id;
    let start_date = req.body.start_date;
    let start_time = req.body.start_time;
    let end_time = req.body.end_time;
    let type = req.body.type;
    let place_id = req.body.place_id;
    let event_name = req.body.event_name;

    let sqlStr = "UPDATE t_schedule SET type = '" + type +
        "', start_date = '" + start_date +
        "', start_time = '" + start_time +
        "', end_time = '" + end_time +
        "', place_id = '" + place_id +
        "', event_name = '" + event_name +
        "' WHERE id = " + id;
    let db = connection.makeDb();
    let  result = await db.query(sqlStr);
    return result.insertId;
};


async function getScheduleDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_schedule " +
        "WHERE id = '" + req.body.id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}


async function getScheduleList(req) {
    let death_id = req.body.death_id;
    let sqlStr = "SELECT t_schedule.*, t_place.name as place_name, t_place.zip, t_place.state, t_place.city, t_place.street, t_place.build_name " +
        " from t_schedule " +
        " left join t_place on t_schedule.place_id = t_place.id " +
        " where death_id = '" + death_id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}


async function removeSchedule(req) {
    let checkSqlStr = "DELETE FROM t_schedule WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(checkSqlStr);
}


module.exports = {
    createScheduleApi: async function (req, res) {
        try {

            let id = await createSchedule(req);
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
    modifyScheduleApi: async function (req, res) {
        try {
            let exist = await checkScheduleExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "schedule_not_exist"
                }));
            } else {
                await modifySchedule(req);
                res.send(JSON.stringify({
                    status: true,
                }));

            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    removeScheduleApi: async function (req, res) {
        try {
            let exist = await checkScheduleExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "schedule_not_exist"
                }));
            } else {
                await removeSchedule(req);
                res.send(JSON.stringify({
                    status: true,
                }));

            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getScheduleDetailApi: async function (req, res) {
        try {
            let result = await getScheduleDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "schedule_not_exist"
                }));
            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getScheduleListApi: async function (req, res) {
        try {
            let scheduleList = await getScheduleList(req);
            res.send(JSON.stringify({
                status: true,
                data: scheduleList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
