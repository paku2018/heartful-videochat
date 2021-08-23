'use strict'
const { performance } = require('perf_hooks');
const fs = require("fs");
const connection = require("./connection");

const {
    threadId,
    isMainThread,
    Worker,
    workerData,
    parentPort,
    MessageChannel,
    MessagePort
} = require('worker_threads');

const express = require('express');
const bodyParser = require('body-parser');

const FuneralRoutes = require("./routes/funeral");
const UserRoutes = require("./routes/user");
const CompanyRoutes = require("./routes/company");
const InquiryRoutes = require("./routes/inquiry");
const ChannelRoutes = require("./routes/channel");
const LoginRoutes = require("./routes/login");
const AdminCompanyRoutes = require("./routes/admin/company");
const AdminBusinessRoutes = require("./routes/admin/business");
const AdminProductRoutes = require("./routes/admin/product");
const AdminPaymentRoutes = require("./routes/admin/payment");
const AdminOfferRoutes = require("./routes/admin/offer");
const AdminSearchRoutes = require("./routes/admin/search");
const AdminDeathRoutes = require("./routes/admin/death");
const CompanyDeathRoutes = require("./routes/company/death");
const CompanyDurationRoutes = require("./routes/company/duration");
const CompanyPlaceRoutes = require("./routes/company/place");
const CompanyBusinessRoutes = require("./routes/company/business");
const CompanyProductRoutes = require("./routes/company/product");
const CompanyPaymentRoutes = require("./routes/company/payment");
const CompanyOfferRoutes = require("./routes/company/offer");
const CompanyScheduleRoutes = require("./routes/company/schedule");
const CompanyViewerRoutes = require("./routes/company/viewer");
const CompanyProfileRoutes = require("./routes/company/profile");
const ManagerInvitationRoutes = require("./routes/manager/invitation");
const ManagerSettingRoutes = require("./routes/manager/setting");
const ManagerViewerRoutes = require("./routes/manager/viewer");
const ManagerProfileRoutes = require("./routes/manager/profile");
const certPath = '/etc/letsencrypt/live/test-heartful-talks.com/fullchain.pem';
const keyPath = '/etc/letsencrypt/live/test-heartful-talks.com/privkey.pem';
const Auth = require("./lib/auth");
const jwt = require('jsonwebtoken');
// const http = require("https");
const http = require("http");
var cors = require('cors');
// Config file
const CONFIG_FILE = './config.json';
if (!fs.existsSync(CONFIG_FILE)) {
    console.error('The config file not found.');
    return;
}
const jsonc = require('jsonc').safe; // json with comment
const [err, config] = jsonc.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
if (err) {
    console.error(`Failed to parse config file: ${err.message}`);
} else if (isMainThread) {
    console.info(config);
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, Auth.getAuthSecret(), (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            console.log(user);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};




if(isMainThread) {

    process.env.TZ = 'Asia/Tokyo';
    const fileUpload = require('express-fileupload');
    var app = express();

    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    var publicDir = require('path').join(__dirname,'/uploads');
    app.use(express.static(publicDir));
    app.use(fileUpload({
        limits: { fileSize: 5 * 1024 * 1024 },
    }));
    app.use(cors());

    //app.use(upload.array());


    app.use((req, res, next) => {
        next()
    });

    app.post("/api/admin/login", (req, res) => {
        LoginRoutes.sendAdminApi(req, res);
    });

    app.post("/api/admin/createToken", authenticateJWT, (req, res) => {
        LoginRoutes.createTokenApi(req, res);
    });



    app.post('/api/admin/company/create', authenticateJWT, (req, res) => {
        AdminCompanyRoutes.createCompanyApi(req, res);
    });
    app.post('/api/admin/company/modify', authenticateJWT, (req, res) => {
        AdminCompanyRoutes.modifyCompanyApi(req, res);
    });
    app.post('/api/admin/company/remove', authenticateJWT, (req, res) => {
        AdminCompanyRoutes.removeCompanyApi(req, res);
    });
    app.post('/api/admin/company/get-info', authenticateJWT, (req, res) => {
        AdminCompanyRoutes.getCompanyDetailApi(req, res);
    });
    app.post('/api/admin/company/list', authenticateJWT, (req, res) => {
        AdminCompanyRoutes.getCompanyListApi(req, res);
    });


    app.post('/api/admin/business/create', authenticateJWT, (req, res) => {
        AdminBusinessRoutes.createBusinessApi(req, res);
    });
    app.post('/api/admin/business/modify', authenticateJWT, (req, res) => {
        AdminBusinessRoutes.modifyBusinessApi(req, res);
    });
    app.post('/api/admin/business/remove', authenticateJWT, (req, res) => {
        AdminBusinessRoutes.removeBusinessApi(req, res);
    });
    app.post('/api/admin/business/get-info', authenticateJWT, (req, res) => {
        AdminBusinessRoutes.getBusinessDetailApi(req, res);
    });
    app.post('/api/admin/business/list', authenticateJWT, (req, res) => {
        AdminBusinessRoutes.getBusinessListApi(req, res);
    });

    app.post('/api/admin/business/all', authenticateJWT, (req, res) => {
        AdminBusinessRoutes.getAllBusinessListApi(req, res);
    });




    app.post('/api/admin/product/create', authenticateJWT, (req, res) => {
        AdminProductRoutes.createProductApi(req, res);
    });
    app.post('/api/admin/product/modify', authenticateJWT, (req, res) => {
        AdminProductRoutes.modifyProductApi(req, res);
    });
    app.post('/api/admin/product/remove', authenticateJWT, (req, res) => {
        AdminProductRoutes.removeProductApi(req, res);
    });
    app.post('/api/admin/product/get-info', authenticateJWT, (req, res) => {
        AdminProductRoutes.getProductDetailApi(req, res);
    });
    app.post('/api/admin/product/list', authenticateJWT, (req, res) => {
        AdminProductRoutes.getProductListApi(req, res);
    });

    app.post('/api/admin/payment/list', authenticateJWT, (req, res) => {
        AdminPaymentRoutes.getPaymentListApi(req, res);
    });

    app.post('/api/admin/payment/download', authenticateJWT, (req, res) => {
        AdminPaymentRoutes.downloadPaymentListApi(req, res);
    });

    app.post('/api/admin/offer/list', authenticateJWT, (req, res) => {
        AdminOfferRoutes.getOfferListApi(req, res);
    });

    app.post('/api/admin/offer/download', authenticateJWT, (req, res) => {
        AdminOfferRoutes.downloadOfferListApi(req, res);
    });

    app.post('/api/admin/offer/detail', authenticateJWT, (req, res) => {
        AdminOfferRoutes.getOfferDetailApi(req, res);
    });

    app.post('/api/admin/offer/remove', authenticateJWT, (req, res) => {
        AdminOfferRoutes.removeOfferApi(req, res);
    });

    app.post('/api/admin/search/equal', authenticateJWT, (req, res) => {
        AdminSearchRoutes.searchEqualApi(req, res);
    });

    app.post('/api/admin/search/like', authenticateJWT, (req, res) => {
        AdminSearchRoutes.searchLikeApi(req, res);
    });

    app.post('/api/admin/death/all', authenticateJWT, (req, res) => {
        AdminDeathRoutes.getAllDeathListApi(req, res);
    });

    app.post('/api/admin/death/remove', authenticateJWT, (req, res) => {
        AdminDeathRoutes.removeDeathApi(req, res);
    });

    app.post('/api/admin/death/list', authenticateJWT, (req, res) => {
        AdminDeathRoutes.getDeathListApi(req, res);
    });

    app.post('/api/company/death/create', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.createDeathApi(req, res);
    });
    app.post('/api/company/death/modify', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.modifyDeathApi(req, res);
    });
    app.post('/api/company/death/remove', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.removeDeathApi(req, res);
    });
    app.post('/api/company/death/get-info', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.getDeathDetailApi(req, res);
    });
    app.post('/api/company/death/list', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.getDeathListApi(req, res);
    });
    app.post('/api/company/death/all', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.getAllDeathListApi(req, res);
    });
    app.post('/api/company/death/send_url', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.sendUrlApi(req, res);
    });
    app.post('/api/company/death/modify_image_status', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.modifyDeathImageStatusApi(req, res);
    });
    app.post('/api/company/death/product/create', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.createDeathProductApi(req, res);
    });
    app.post('/api/company/death/product/all', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.getDeathProductApi(req, res);
    });

    app.post('/api/company/death/camera/all', authenticateJWT, (req, res) => {
        CompanyDeathRoutes.getDeathCameraApi(req, res);
    });

    app.post('/api/company/duration/create', authenticateJWT, (req, res) => {
        CompanyDurationRoutes.createDurationApi(req, res);
    });
    app.post('/api/company/duration/modify', authenticateJWT, (req, res) => {
        CompanyDurationRoutes.modifyDurationApi(req, res);
    });
    app.post('/api/company/duration/remove', authenticateJWT, (req, res) => {
        CompanyDurationRoutes.removeDurationApi(req, res);
    });
    app.post('/api/company/duration/get-info', authenticateJWT, (req, res) => {
        CompanyDurationRoutes.getDurationDetailApi(req, res);
    });
    app.post('/api/company/duration/list', authenticateJWT, (req, res) => {
        CompanyDurationRoutes.getDurationListApi(req, res);
    });


    app.post('/api/company/place/create', authenticateJWT, (req, res) => {
        CompanyPlaceRoutes.createPlaceApi(req, res);
    });
    app.post('/api/company/place/modify', authenticateJWT, (req, res) => {
        CompanyPlaceRoutes.modifyPlaceApi(req, res);
    });
    app.post('/api/company/place/remove', authenticateJWT, (req, res) => {
        CompanyPlaceRoutes.removePlaceApi(req, res);
    });
    app.post('/api/company/place/get-info', authenticateJWT, (req, res) => {
        CompanyPlaceRoutes.getPlaceDetailApi(req, res);
    });
    app.post('/api/company/place/list', authenticateJWT, (req, res) => {
        CompanyPlaceRoutes.getPlaceListApi(req, res);
    });

    app.post('/api/company/place/all', authenticateJWT, (req, res) => {
        CompanyPlaceRoutes.getAllPlaceListApi(req, res);
    });

    app.post('/api/company/business/create', authenticateJWT, (req, res) => {
        CompanyBusinessRoutes.createBusinessApi(req, res);
    });
    app.post('/api/company/business/modify', authenticateJWT, (req, res) => {
        CompanyBusinessRoutes.modifyBusinessApi(req, res);
    });
    app.post('/api/company/business/remove', authenticateJWT, (req, res) => {
        CompanyBusinessRoutes.removeBusinessApi(req, res);
    });
    app.post('/api/company/business/get-info', authenticateJWT, (req, res) => {
        CompanyBusinessRoutes.getBusinessDetailApi(req, res);
    });
    app.post('/api/company/business/list', authenticateJWT, (req, res) => {
        CompanyBusinessRoutes.getBusinessListApi(req, res);
    });

    app.post('/api/company/business/all', authenticateJWT, (req, res) => {
        CompanyBusinessRoutes.getAllBusinessListApi(req, res);
    });

    app.post('/api/company/product/create', authenticateJWT, (req, res) => {
        CompanyProductRoutes.createProductApi(req, res);
    });
    app.post('/api/company/product/modify', authenticateJWT, (req, res) => {
        CompanyProductRoutes.modifyProductApi(req, res);
    });
    app.post('/api/company/product/remove', authenticateJWT, (req, res) => {
        CompanyProductRoutes.removeProductApi(req, res);
    });
    app.post('/api/company/product/get-info', authenticateJWT, (req, res) => {
        CompanyProductRoutes.getProductDetailApi(req, res);
    });
    app.post('/api/company/product/list', authenticateJWT, (req, res) => {
        CompanyProductRoutes.getProductListApi(req, res);
    });

    app.post('/api/company/payment/list', authenticateJWT, (req, res) => {
        CompanyPaymentRoutes.getPaymentListApi(req, res);
    });

    app.post('/api/company/payment/download', authenticateJWT, (req, res) => {
        CompanyPaymentRoutes.downloadPaymentListApi(req, res);
    });

    app.post('/api/company/offer/list', authenticateJWT, (req, res) => {
        CompanyOfferRoutes.getOfferListApi(req, res);
    });

    app.post('/api/company/offer/download', authenticateJWT, (req, res) => {
        CompanyOfferRoutes.downloadOfferListApi(req, res);
    });

    app.post('/api/company/offer/detail', authenticateJWT, (req, res) => {
        CompanyOfferRoutes.getOfferDetailApi(req, res);
    });

    app.post('/api/company/offer/remove', authenticateJWT, (req, res) => {
        CompanyOfferRoutes.removeOfferApi(req, res);
    });


    app.post('/api/company/schedule/create', authenticateJWT, (req, res) => {
        CompanyScheduleRoutes.createScheduleApi(req, res);
    });
    app.post('/api/company/schedule/modify', authenticateJWT, (req, res) => {
        CompanyScheduleRoutes.modifyScheduleApi(req, res);
    });
    app.post('/api/company/schedule/remove', authenticateJWT, (req, res) => {
        CompanyScheduleRoutes.removeScheduleApi(req, res);
    });
    app.post('/api/company/schedule/get-info', authenticateJWT, (req, res) => {
        CompanyScheduleRoutes.getScheduleDetailApi(req, res);
    });
    app.post('/api/company/schedule/list', authenticateJWT, (req, res) => {
        CompanyScheduleRoutes.getScheduleListApi(req, res);
    });

    app.post('/api/company/viewer/create', authenticateJWT, (req, res) => {
        CompanyViewerRoutes.createViewerApi(req, res);
    });
    app.post('/api/company/viewer/modify', authenticateJWT, (req, res) => {
        CompanyViewerRoutes.modifyViewerApi(req, res);
    });
    app.post('/api/company/viewer/remove', authenticateJWT, (req, res) => {
        CompanyViewerRoutes.removeViewerApi(req, res);
    });
    app.post('/api/company/viewer/get-info', authenticateJWT, (req, res) => {
        CompanyViewerRoutes.getViewerDetailApi(req, res);
    });
    app.post('/api/company/viewer/list', authenticateJWT, (req, res) => {
        CompanyViewerRoutes.getViewerListApi(req, res);
    });

    app.post('/api/company/profile/modify', authenticateJWT, (req, res) => {
        CompanyProfileRoutes.modifyProfileApi(req, res);
    });

    app.post('/api/company/profile/get-info', authenticateJWT, (req, res) => {
        CompanyProfileRoutes.getProfileApi(req, res);
    });

    app.post('/api/manager/invitation/modify', authenticateJWT, (req, res) => {
        ManagerInvitationRoutes.modifyInvitationApi(req, res);
    });

    app.post('/api/manager/music/modify', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.modifyMusicApi(req, res);
    });

    app.post('/api/manager/show_status/modify', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.modifyShowStatusApi(req, res);
    });

    app.post('/api/manager/image/create', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.createImageApi(req, res);
    });

    app.post('/api/manager/image/modify', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.modifyImageApi(req, res);
    });

    app.post('/api/manager/image/remove', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.removeImageApi(req, res);
    });

    app.post('/api/manager/image/get-info', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.getImageDetailApi(req, res);
    });

    app.post('/api/manager/image/all', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.getAllImageListApi(req, res);
    });

    app.post('/api/manager/get-info', authenticateJWT, (req, res) => {
        ManagerSettingRoutes.getDeathDetailApi(req, res);
    });

    app.post('/api/manager/viewer/create', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.createViewerApi(req, res);
    });
    app.post('/api/manager/viewer/modify', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.modifyViewerApi(req, res);
    });
    app.post('/api/manager/viewer/remove', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.removeViewerApi(req, res);
    });
    app.post('/api/manager/viewer/get-info', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.getViewerDetailApi(req, res);
    });
    app.post('/api/manager/message/get-info', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.getMessageDetailApi(req, res);
    });
    app.post('/api/manager/viewer/list', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.getViewerListApi(req, res);
    });

    app.post('/api/manager/viewer/download', authenticateJWT, (req, res) => {
        ManagerViewerRoutes.downloadViewerListApi(req, res);
    });

    app.post('/api/manager/profile/modify', authenticateJWT, (req, res) => {
        ManagerProfileRoutes.modifyProfileApi(req, res);
    });

    app.post('/api/manager/profile/get-info', authenticateJWT, (req, res) => {
        ManagerProfileRoutes.getProfileApi(req, res);
    });

    // http.createServer({
    //     cert: fs.readFileSync(certPath),
    //     key: fs.readFileSync(keyPath)
    // }, app).listen(config.server.admin_api_port);
    app.listen(config.server.admin_api_port);
}

// Worker thread
let workers = [];
let ports = [];
const PORT = (workerData && workerData.port) || config.server.channel_port;

// Log
const log4js = require('log4js');
log4js.configure({
    appenders: {
        print: { type: 'stdout' },
        logfile: { type: 'file', filename: 'server' + PORT + '.log' }
    },
    categories: {
        default: { appenders: ['logfile', 'print'], level: config.server.log_level },
        file: { appenders: ['logfile'], level: config.server.log_level }
    }
});
const log = log4js.getLogger();
const logf = log4js.getLogger('file');
//log.debug('debug');
//log.info('info');
//log.warn('warn');
//log.error('error');

// Translator
const translator = require('./js/translator');
translator.setlog(log, logf);

// Transcribe
const transcribe = require('./js/transcribe');
transcribe.setlog(log, logf);

// Server

const h_server = http.createServer();
const w_server = new(require("ws").Server)({ server: h_server });


// const h_server = http.createServer({
//     cert: fs.readFileSync(certPath),
//     key: fs.readFileSync(keyPath)
// });
// const w_server = new(require("ws").Server)({ server: h_server });

const url = require("url");
const ecstatic = require('ecstatic')(__dirname);
const cookie = require("cookie");
const { worker } = require('cluster');
const K_AUDIO = (1 << 0);
const K_VIDEO = (1 << 1);
const K_JSON = (1 << 2);

h_server.listen(PORT);

if(isMainThread) {
    const h_api_server = http.createServer();
    // const h_api_server = http.createServer({
    //     cert: fs.readFileSync(certPath),
    //     key: fs.readFileSync(keyPath)
    // });
    h_api_server.listen(config.server.api_port);
    const w_api_server = new(require("ws").Server)({ server: h_api_server });

    w_api_server.on('connection', function connection(ws, req) {
        ws.on("message", msg => {
            const json = JSON.parse(msg);
            apiCall(json, ws);
        });
    });
}
log.info('server' + PORT + ' start on port:', PORT);

const uuid_maxAge = 60 * 60;

let text_pool = [];
let text_index = 0;

function modify_funeral(json) {
    console.log("Modify Funeral");
    console.log(json);
    let mobiles = json.mobiles;
    let id = json.id;
    let port = json.port;
    let sqlStr = "UPDATE t_death SET port = ? WHERE id = ?";
    connection.makeDb().query(sqlStr, [port, id]);
}
function new_uuid() {
    return new Date().getTime().toString(16) + Math.floor(1000 * Math.random()).toString(16)
}

// Chunk Ring Buffer

function num_clients() {
    let num = 0;
    w_server.clients.forEach(() => { num++; });
    return num;
}

function new_port(port) {
    port+=3;
    if (workers.length) {
        const ports = workers.map(w => w.info.port).sort();
        for (let i = 0; i < ports.length; i++) {
            if (port < ports[i]) break;
            port++;
        }
    }
    return port;
}

function new_worker(json) {
    let port = new_port(PORT);
    let original_port = port;
    const worker = new Worker(config.server.channel_server, { workerData: { port: port } });
    port += config.server.channel_ssl || 0;
    worker.info = {
        id: json.id,
        name: json.name,
        port: original_port,
        origin: config.server.channel_origin.replace('XXXX', port),
        ws: config.server.ws_origin.replace('XXXX', port),
        threadId: worker.threadId,
        mobiles: json.mobiles,
        actives: [],
        last_fetches: [0, 0, 0, 0],
        video: 1,
        audio: 1,
        ready: 0,
        chunk: new Array(config.server.chunk_buffer_count),
        chunkData: {},
        onChannel: 0,
        onChannelCode: 0,
        camera: [
            {
                ready: 0,
                chunkData: {}
            },
            {
                ready: 0,
                chunkData: {}
            },
            {
                ready: 0,
                chunkData: {}
            },
            {
                ready: 0,
                chunkData: {}
            }
        ]
    };
    log.info(worker);
    workers.push(worker);
    return worker;
}

function terminate_worker(worker) {
    worker.terminate();
    workers.splice(workers.indexOf(worker), 1);
    log.info('terminated worker', worker.info.port);
}

function open_channel_worker(ws, json) {
    let worker = workers.find(w => w.info.id == json.id);
    if (worker == null) {
        worker = new_worker(json);
        //
        worker.postMessage(JSON.stringify({
            type: 'created',
            info: worker.info
        }));

        worker.on('message', message => {
            if (message == 'close') {
                //terminate_worker(worker);
            } else {
                log.debug('Main thread received message: %o', message)
            }
        });
    }
    channel_start(worker);
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'opened',
            info: worker.info
        }));
    }, 1000); //todo: how delay to ready
}

function close_channel_worker(ws, json) {
    log.info("Close channel " + JSON.stringify(json));
    const worker = workers.find(w => w.info.threadId == json.threadId);
    if (worker) {
        terminate_worker(worker);
        ws.send(JSON.stringify({
            type: 'closed',
            info: worker.info
        }));
    } else {
        log.error('worker thread', json.threadId, "not found");
    }
}

function channel_start(worker) {
    if (worker.info.onChannel) {
        log.info('restart channel:', worker.info.onChannel);
    } else {
        if (!fs.existsSync(config.server.channel_file)) {
            fs.writeFileSync(config.server.channel_file, worker.info.onChannel.toString(), (err) => {
                log.error('The channel file has been created');
                if (err) throw err;
            });
        }
        worker.info.onChannelCode = worker.info.onChannel = (fs.readFileSync(config.server.channel_file) | 0) + config.server.channel_stream_max;
        fs.writeFileSync(config.server.channel_file, worker.info.onChannel.toString());
        log.info('start channel:', worker.info.onChannel);
    }
}

function channel_stop() {
    //log.info('stop channel:', onChannel);
    //onChannel = 0;
    //onChannelCode = 0;
    chunk.fill(null);
    transcribe.end();
}

function channel_list() {
    let elist = [];
    workers.forEach(worker => {
        elist.push(worker.info);
    });
    return elist;
}

function channel_active(threadId, index) {
    workers.forEach(worker => {
        if(worker.info.threadId == threadId) {
            let isActive = false;
            worker.info.actives.forEach(i => {
                if(i == index) {
                    isActive = true;
                }
            });
            let time = new Date().getTime();
            if(isActive == false) {
                worker.info.actives.push(index);
            }
            worker.info.last_fetches[index] = time;
        }
    });
}

function channel_active_list(threadId) {
    let actives = [];
    workers.forEach(worker => {
        if (worker.info.threadId == threadId) {
            worker.info.actives.forEach(index => {
                let time = new Date().getTime();
                let difference = time - worker.info.last_fetches[index];

                if(difference < config.server.fetch_limit_time) {
                    actives.push(index);
                }
            });
        }
    });
    return actives;
}


function channel_modify(threadId, video, audio) {
    workers.forEach(worker => {
        if(worker.info.threadId == threadId) {
            worker.info.video = video;
            worker.info.audio = audio;
        }
    });
}

// message from mainThread
if (!isMainThread) {
    parentPort.on('message', msg => {
        const json = JSON.parse(msg);
        switch (json.type) {
            case 'created':
                modify_funeral(json.info);
                log.info('created worker', json.info.port);
                break;
            default:
                log.debug('worker received message: %o', json);
        }
    });
}

function send_chunk(worker, ws, camera_index) {
    let total = 0;
    let offset = total;
    let chunkData = worker.info.camera[camera_index].chunkData;

    Object.keys(chunkData).map(key => {
        if(chunkData[key] != null) {
            total += chunkData[key].byteLength + 4 + 4;
        }
    });
    const buffer = new ArrayBuffer(total);
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);
    Object.keys(chunkData).map(key => {
        if(chunkData[key] != null) {
            view.setUint32(offset, key);
            offset += 4;
            view.setUint32(offset, chunkData[key].byteLength);
            offset += 4;
            data.set(chunkData[key], offset);
            offset += chunkData[key].byteLength;
        }
    });
    sendBuffer(new Uint8Array(buffer), worker, ws, camera_index);
}

function sendBuffer(msg, worker, ws, camera_index) {
    if(worker && worker.info.onChannel) {
        let perf = 0;
        const p = performance.now();
        //if (perf) log.info('chunk:', worker.info.onChannel, msg.length, p - perf);
        //if (perf) console.info('chunk:', worker.info.onChannel, msg.length, p - perf);
        perf = p;


        let dir = config.server.channel_data_folder;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        let dataDir = dir + camera_index + "_" + worker.info.threadId + '_' + worker.info.onChannel % worker.info.chunk.length;
        fs.writeFileSync(dataDir, msg);

        //worker.chunk[worker.onChannel % worker.chunk.length] = msg;

        //log.info("Send second data to client " + date);
        // fetch available message to receivers
        w_server.clients.forEach(client => {
            if (client.fetch && client !== ws) {
                client.send(JSON.stringify({ type: 'fetch', method: 'next', channel: worker.info.onChannel, cIndex: camera_index }));
            }
        });
        worker.info.onChannel = worker.info.onChannel + 1;
    }
}

function sendData(worker, ws, camera_index) {
    if (worker.info.camera[camera_index].ready & K_AUDIO) {
        send_chunk(worker, ws, camera_index);
        worker.info.camera[camera_index].ready = 0;
        worker.info.camera[camera_index].chunkData = {};
    }
}

function convertJsonToByte(payload) {
    let result = [];
    for(var i in payload)
        result.push(payload[i]);
    let byte = new Uint8Array(result);
    return byte;
}

function saveAudioData(threadId, index, payload, ws) {
    let worker = workers.find(w => w.info.threadId == threadId);
    if(worker) {
        worker.info.camera[index].ready |= K_AUDIO;
        worker.info.camera[index].chunkData[K_AUDIO] = payload;//convertJsonToByte(json.payload);
        let val = K_AUDIO;
        val |= K_VIDEO
        if(worker.info.camera[index].ready == val) {
            sendData(worker, ws, index);
        }
    }
}

function saveVideoData(threadId, index, payload, ws) {
    let worker = workers.find(w => w.info.threadId == threadId);
    if(worker) {
        worker.info.camera[index].ready |= K_VIDEO;
        worker.info.camera[index].chunkData[K_VIDEO] = payload;
        let val = K_AUDIO;
        val |= K_VIDEO
        if(worker.info.camera[index].ready == val) {
            sendData(worker, ws, index);
        }
    }
}

function sendMusic(json, ws) {
    log.info("Music is " + JSON.stringify(json));
    let worker = workers.find(w => w.info.threadId == json.threadId);
    worker.info.src = json.src;
    w_server.clients.forEach(client => {
        if (client.fetch && client !== ws) {
            client.send(JSON.stringify(json));
        }
    });
}

function sendAnim(json, ws) {
    let worker = workers.find(w => w.info.threadId == json.threadId);
    let index = json.index;
    let anim = {};
    let anim_arr = [
        {
            src: "media/anim.png",
            speed: 2.0,
            loop: 3
        },
        {
            src: "media/anim32.png",
            loop: 0
        },
        {
            src: "media/image.png"
        },
        {
            src: "media/anim0.webp"
        },
        {
            src: "media/anim1.webp",
            speed: 2.5,
            loop: 5
        },
        {
            src: "media/image.webp",
        }

    ];
    if(index != -1) {
        anim = anim_arr[index];
    }
    log.info(anim);
    worker.info.anim = anim;
    json.anim = anim;
    w_server.clients.forEach(client => {
        if (client.fetch) {
            client.send(JSON.stringify(json));
        }
    });
}

function apiCall(json, ws) {
    console.log(json);
    switch (json.method) {
        case 'user':
            UserRoutes.sendUserApi(json, ws);
            break;
        case 'funeral':
            FuneralRoutes.sendFuneralApi(json, ws);
            break;
        case 'company':
            CompanyRoutes.sendCompanyApi(json, ws);
            break;
        case 'inquiry':
            InquiryRoutes.sendInquiryApi(json, ws);
            break;
        case 'channel':
            ChannelRoutes.sendChannelApi(json, ws);
            break;
    }
}

h_server.on('request', function(req, res) {
    let parse = url.parse(req.url, true, true);
    if (parse.pathname == '/send' || parse.pathname == '/recv' || parse.pathname == '/subsend') {
        const location = parse.pathname + '.html';
        const uuid = new_uuid();
        log.info('set new uuid', location, uuid);
        res.setHeader('Set-Cookie', cookie.serialize('uuid', uuid, {
            sameSite: true,
            path: location,
            maxAge: uuid_maxAge
        }));
        // Redirect back after setting cookie
        res.statusCode = 302;
        res.setHeader('Location', location);
        res.end();
        return;
    }
    if(!parse.pathname) {
        return ;
    }
    let pathname = parse.pathname.slice(1);
    let split = pathname.split('_');
    const cIndex = parseInt(split[0]);
    const thread = parseInt(split[1]);
    const code = parseInt(split[2]);

    if (!isNaN(thread) && !isNaN(code)) {
        const i = code % config.server.chunk_buffer_count;
        const header = {
            "Access-Control-Allow-Origin": "*",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
            'transfer-encoding': 'identity',
            'content-encoding': 'identity',
            "content-type": "application/octet-stream",
            'connection': 'keep-alive',
            //'current-channel-id': onChannel
        }
        //if ((onChannel - code) < chunk.length) {
        if (fs.existsSync(config.server.channel_data_folder + cIndex + '_' + thread + '_' + i)) {
            let content = fs.readFileSync(config.server.channel_data_folder + cIndex + '_' + thread + '_' + i);
            res.setHeader('content-length', content.byteLength);
            res.writeHead(200, header);
            res.write(content, "binary");
        } else {
        //     log.warn('over fetch', code, onChannel);
             res.writeHead(404, header);
        }
        res.end();
    } else if (req.url === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end();
    } else {
        if(req.url == '/test') {
            res.write(JSON.stringify([1,2,3]));
            res.end();
            return ;
        }
        // Parse the cookies on the request
        const cookies = cookie.parse(req.headers.cookie || '');
        if (cookies.uuid) {
            log.info('Reloaded', parse.pathname, cookies.uuid);
        }
        res.setHeader('Access-Control-Allow-Origin', "*");
        // for static file
        ecstatic(req, res);
    }
});



w_server.on('connection', function connection(ws, req) {
    log.info('connected', num_clients(), 'users threadId:', threadId);

    if (isMainThread) {
        // send config
        ws.send(JSON.stringify({
            type: 'config',
            config: config.client
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'open',
            result: workerData.port
        }));
        text_pool.forEach(text => {
            ws.send(text); //todo: encountd translation for each clients
        });

    }

    let perf = 0;

    ws.on("message", msg => {
        if (msg instanceof Buffer) {
            //if (!onChannel) return;

            const data = new Uint8Array(msg); // get binary data collectly
            const view = new DataView(data.buffer);
            if (view.getUint32(0) == 0) { // chunk
                let threadId = view.getUint32(4);
                let index = view.getUint32(8);
                let key = view.getUint32(12);
                let payload = data.subarray(16);
                if(key == K_AUDIO) {
                    saveAudioData(threadId, index, payload, ws);
                } else {
                    saveVideoData(threadId, index, payload, ws);
                }
                // const p = performance.now();
                // if (perf && p - perf > 400) console.info('chunk:', onChannel, data.length, p - perf);
                // perf = p;
                //
                // chunk[onChannel % chunk.length] = data;
                // onChannel++;
                //
                // // fetch available message to receivers
                // w_server.clients.forEach(client => {
                //     if (client.fetch && client !== ws) client.send(JSON.stringify({ type: 'fetch', method: 'next' }));
                // });
            } else { // voice
                const locale = data.subarray(0, 4).toString().replace(/\0/g, '');
                const voice = data.subarray(4);
                transcribe.stream(voice, locale, (transcription) => {
                    ws.send(JSON.stringify({
                        type: 'transcription',
                        text: transcription,
                        locale: locale
                    }));
                });
            }
        } else { // msg type is string
            const json = JSON.parse(msg);
            switch (json.type) {
                case 'api':
                    apiCall(json, ws);
                    break;
                case 'channel':
                    switch (json.method) {
                        case 'open':
                            open_channel_worker(ws, json);
                            break;
                        case 'close':
                            close_channel_worker(ws, json);
                            break;
                        case 'start':
                            channel_start();
                            break;
                        case 'stop':
                            channel_stop();
                            // fetch available message to receivers

                            w_server.clients.forEach(client => {
                                if (client.fetch && client !== ws) client.send(JSON.stringify({ type: 'fetch', method: 'stop' }));
                            });
                            break;
                        case 'list':
                            ws.send(JSON.stringify({
                                type: 'list',
                                channel: channel_list()
                            }));
                            break;
                        case 'active':
                            channel_active(json.threadId, json.index);
                            break;
                        case 'active_list':
                            ws.send(JSON.stringify({
                                type: 'active_list',
                                list: channel_active_list(json.threadId)
                            }));
                            break;
                        case 'setting':
                            channel_modify(json.threadId, json.video, json.audio);
                            w_server.clients.forEach(client => {
                                if (client !== ws) {
                                    client.send(JSON.stringify({
                                        type: 'setting',
                                        video: json.video,
                                        audio: json.audio,
                                    }));
                                }
                            });
                            break;
                    }
                    break;
                case 'fetch':
                    if (json.method == 'start') {
                        let worker = workers.find(w => w.info.threadId == json.threadId);
                        if(worker) {
                            ws.send(JSON.stringify({
                                type: 'start',
                                threadId: worker.info.threadId,
                                channel: (worker.info.onChannel - worker.info.onChannelCode >= 2) ? worker.info.onChannel - 2 : 0,
                                audio: worker.info.src,
                                video: worker.info.video,
                                anim: worker.info.anim,
                                audio_index: worker.info.audio,
                                video_index: worker.info.video
                            }));
                            if (worker.info.onChannel) ws.fetch = true;
                            log.info('fetch start', worker.info.onChannel + ":" + worker.info.onChannelCode);
                        }
                    } else {
                        log.info("fetch false " + json.method);
                        ws.fetch = false;
                        //log.info('fetch stop', onChannel);
                    }
                    break;
                case 'text':
                    text_index ++;
                    json.text_index = text_index;
                    msg = JSON.stringify(json);
                    text_pool.push(msg);
                    if (text_pool.length > config.server.text_pool_max) text_pool.shift();
                    // broadcast to all for test
                    w_server.clients.forEach(client => { client.send(msg); });
                    break;
                case 'text_remove':
                    for(var i = 0; i < text_pool.length; i ++) {
                        let text_content = JSON.parse(text_pool[i]);
                        if(text_content.text_index == json.index) {
                            text_pool.splice(i, 1);
                            break;
                        }
                    }
                    w_server.clients.forEach(client => { client.send(msg); });
                    break;
                case 'languages':
                    translator.language_list(ws, json.locale);
                    logf.info(json.type, json.locale);
                    break;
                case 'translate':
                    translator.translate(ws, json.payload);
                    logf.info(json.type, json.payload.locale, json.payload.gender, json.payload.message);
                    break;
                case 'speech':
                    translator.speech(ws, json.payload);
                    logf.info(json.type, json.payload.locale, json.payload.gender, json.payload.message);
                    break;
                case 'audio':
                    //saveAudioData(json, ws);
                    break;
                case 'video':
                    //saveVideoData(json, ws);
                    break;
                case 'music':
                    sendMusic(json, ws);
                    break;
                case 'anim':
                    sendAnim(json, ws);
                    break;
                case 'debug':
                    //log.info(json.text);
                    break;
                default:
                    log.error('unknown to server:', json);
            }
        }
    });

    ws.on('close', () => {
        const clients = num_clients();
        log.info('disconnected', clients, 'remains threadId:', threadId);
        if (!isMainThread && clients == 0) {
            parentPort.postMessage('close');
        } else if(!isMainThread) {
            parentPort.postMessage('close');
        }
    });

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
});

const interval = setInterval(() => {
    w_server.clients.forEach(ws => {
        if (ws.isAlive === false) return ws.terminate();
        ws.ping(() => { ws.isAlive = false });
    });
}, 30000);

w_server.on('close', function close() {
    clearInterval(interval);
});
