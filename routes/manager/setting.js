const connection = require("../../connection");
const util = require("../../util");

async function getDeathId(id) {
    let sqlStr = "SELECT * " +
        " from t_manager " +
        "WHERE id = '" + id + "'";
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result[0].death_id;
}

async function modifyMusic (req){
    let death_id = await getDeathId(req.user.id);
    let music = '';
    let original_music = '';
    if(req.files && req.files.music) {
        let musicFile = req.files.music;
        original_music = musicFile.name;
        music = await util.createFile(musicFile);
    }
    console.log("Music file name is " + music);
    let sqlStr = "UPDATE t_death SET music = ?, original_music = ? WHERE id = ?";
    let db = connection.makeDb();
    await db.query(sqlStr, [music, original_music, death_id]);
    return music;
};

async function modifyShowStatus (req){
    let death_id = await getDeathId(req.user.id)
    let public_status = req.body.public_status;
    let slide_status = req.body.slide_status;
    let slide_speed = req.body.slide_speed;


    let sqlStr = "UPDATE t_death SET public_status = '" + public_status +
        "', slide_status = '" + slide_status +
        "', slide_speed = '" + slide_speed +
        "' WHERE id = " + death_id;
    let db = connection.makeDb();
    await db.query(sqlStr);
};

async function checkImageExist(id) {
    let sqlStr = "SELECT * " +
        " from t_death_img " +
        "WHERE id = '" + id + "'";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    if(result.length > 0) {
        return true;
    }
    return false;
}


async function createDeathImage (req){
    let death_id = await getDeathId(req.user.id);
    let img = '';
    if(req.files && req.files.image) {
        let imgFile = req.files.image;
        img = await util.createFile(imgFile);
    }
    let title = req.body.title;
    let sqlStr = "INSERT INTO t_death_img (death_id, img, title) VALUES(?, ?, ?)";
    let db = connection.makeDb();
    let result = await db.query(sqlStr, [death_id, img, title]);
    return {
        id: result.insertId,
        img: img
    }
};

async function modifyImage (req){
    let id = req.body.id;

    let title = req.body.title;
    let sqlStr = "UPDATE t_death_img SET title = ? WHERE id = ?";
    let db = connection.makeDb();
    await db.query(sqlStr, [title, id]);
};

async function removeImage(req) {
    let checkSqlStr = "DELETE FROM t_death_img WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(checkSqlStr);
}


async function getImageDetail(req) {
    let sqlStr = "SELECT * " +
        " from t_death_img " +
        "WHERE id = '" + req.body.id + "' ";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}


async function getAllImageList(req) {
    let death_id = await getDeathId(req.user.id);
    let sqlStr = "SELECT * " +
        " from t_death_img " +
        " where death_id  = '" + death_id + "' " +
        " ORDER BY id ";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getDeathDetail(req) {
    let death_id = await getDeathId(req.user.id);
    let sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.relation, t_place.name as place_name " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " left join t_place on t_place.id = t_death.place_id " +
        "WHERE t_death.id = '" + death_id + "' ";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);

    sqlStr = "SELECT *, t_schedule.id as schedule_id " +
        " from t_schedule " +
        " left join t_place on t_schedule.place_id = t_place.id " +
        " where death_id = '" + death_id + "'";
    console.log(sqlStr);
    let scheduleList = await db.query(sqlStr);
    let detail = result[0];
    detail.schedules = scheduleList;
    return detail;
}

module.exports = {
    modifyMusicApi: async function (req, res) {
        try {
            let music = await modifyMusic(req);
            res.send(JSON.stringify({
                status: true,
                music: music
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    modifyShowStatusApi: async function (req, res) {
        try {
            await modifyShowStatus(req);
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
    createImageApi: async function (req, res) {
        try {
            let result = await createDeathImage(req);
            res.send(JSON.stringify({
                status: true,
                id: result.id,
                img: result.img
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    modifyImageApi: async function (req, res) {
        try {
            let exist = await checkImageExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "image_not_exist"
                }));
            } else {

                await modifyImage(req);
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

    removeImageApi: async function (req, res) {
        try {
            let exist = await checkImageExist(req.body.id);
            if(exist == false) {
                res.send(JSON.stringify({
                    status: false,
                    error: "image_not_exist"
                }));
            } else {
                await removeImage(req);
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

    getImageDetailApi: async function (req, res) {
        try {
            let result = await getImageDetail(req);
            if(result.length > 0) {
                res.send(JSON.stringify({
                    status: true,
                    detail: result[0]
                }));
            } else {
                res.send(JSON.stringify({
                    status: false,
                    error: "image_not_exist"
                }));
            }


        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getAllImageListApi: async function (req, res) {
        try {
            let imageList = await getAllImageList(req);
            res.send(JSON.stringify({
                status: true,
                list: imageList
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    getDeathDetailApi: async function (req, res) {
        try {
            let detail = await getDeathDetail(req);
            res.send(JSON.stringify({
                status: true,
                detail: detail
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

};
