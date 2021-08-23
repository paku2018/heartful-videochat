const connection = require("../connection");

module.exports = {
    sendChannelApi: async function (req, res) {
        try {
            if(req.path == 'get_detail') {
                let result = await getDetail(req);
                res.send(JSON.stringify({
                    type: 'api',
                    status: true,
                    content: result
                }))
            } else if(req.path == 'update') {
                let result = await update(req);
                res.send(JSON.stringify({
                    type: 'api',
                    path: req.path,
                    status: true,
                    content: result
                }))
            } else if(req.path == 'get_status') {
                let result = await getStatus(req);
                console.log(result);
                res.send(JSON.stringify({
                    type: 'api',
                    path: req.path,
                    status: true,
                    content: result
                }))
            } else if(req.path == 'get_password_status') {
                let result = await getPasswordStatus(req);
                res.send(JSON.stringify({
                    type: 'api',
                    path: req.path,
                    status: true,
                    content: result
                }))
            }
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
                type: req.path,
            }));
        }

    }
};

async function getDetail(req) {
    let data = {
        status: 3,
    };
    let type = req.body.type;
    let mobile = req.body.mobile;
    let code = req.body.code;
    let db = connection.makeDb();

    if(type == 1) {
        let sqlStr = "SELECT t_death.*, t_manager.name FROM t_death LEFT JOIN t_manager ON t_death.id = t_manager.death_id WHERE t_death.code = ?";
        let result = await db.query(sqlStr, [code]);
        if(result.length > 0) {
            data = {
                status: 1,
                info: result[0]
            };
            return data;
        }
    } else if(type == 2) {
        let sqlStr = "SELECT * FROM t_death WHERE t_death.code = ?";
        let result = await db.query(sqlStr, [code]);
        console.log(sqlStr);
        let index = req.body.id;
        let status = 0;
        console.log(result);
        if(result.length > 0) {
            if(result[0].camera_email == mobile) {
                status = 1;
            }
            if(result[0].camera1 == mobile && index == 1) {
                status = 1;
            }
            if(result[0].camera2 == mobile && index == 2) {
                status = 1;
            }
            if(result[0].camera3 == mobile && index == 3) {
                status = 1;
            }
        }
        if(status == 1) {
            data.status = 2;
            data.info = {
                port: result[0].port
            }
            return data;
        }
    }



    return data;
}

async function getStatus(req) {
    let death_id = req.body.id;
    let sqlStr = "SELECT * FROM t_death WHERE id = " + death_id;
    let db = connection.makeDb();
    let deathResult = await db.query(sqlStr);

    sqlStr = "SELECT * FROM t_death_img WHERE death_id = " + death_id;
    let imgResult = await db.query(sqlStr);

    sqlStr = "SELECT * FROM t_duration WHERE death_id = " + death_id;
    let durationResult = await db.query(sqlStr);
    let status = false;

    for(var i = 0; i < durationResult.length; i ++) {
        let start_time = new Date(durationResult[i].start_time);
        let end_time = new Date(durationResult[i].end_time);
        let now = new Date();
        if(now <= end_time && now >= start_time) {
            status = true;
        }
    }

    if(status == true && deathResult[0].live_status == 0) {
        status = false;
    }

    return {
        show_status: status,
        public_status: deathResult[0].public_status == 1? true: false,
        slide_speed: deathResult[0].slide_speed,
        imgList: imgResult,
        music: deathResult[0].music
    }
}

async function getPasswordStatus(req) {
    let death_id = req.body.id;
    let sqlStr = "SELECT * FROM t_death WHERE id = " + death_id;
    let db = connection.makeDb();
    let deathResult = await db.query(sqlStr);
    return deathResult[0];
}

async function update(req) {

    let camera = req.body.camera;
    let id = req.body.id;
    let cameras = camera.split(',');
    let camera_arr = [];
    let db = connection.makeDb();
    try {
        for(var i = 0; i < cameras.length; i ++) {
            let sqlStr = "SELECT id from t_camera where mobile = ?";
            let result = await db.query(sqlStr, [cameras[i]]);
            if(result.length > 0) {
                camera_arr.push(result[0].id);
            } else {
                sqlStr = "INSERT INTO t_camera (mobile) VALUES(?)";
                result = await db.query(sqlStr, [cameras[i]]);
                camera_arr.push(result.insertId);
            }
        }
        let sqlStr = "UPDATE t_funeral SET ";
        if(camera_arr.length > 0) {
            sqlStr = sqlStr + " camera_first_id = " + camera_arr[0];
        }
        if(camera_arr.length > 1) {
            sqlStr = sqlStr + ", camera_second_id = " + camera_arr[1];
        }
        if(camera_arr.length > 2) {
            sqlStr = sqlStr + ", camera_third_id = " + camera_arr[2];
        }
        sqlStr = sqlStr + " WHERE id = ?";
        console.log(sqlStr);
        await db.query(sqlStr, [id]);
        return camera_arr;
        // do something with someRows and otherRows
    } catch ( err ) {
        console.log(err);
        // handle the error
    } finally {
        //db.close();
    }
    return [];

};
