window.addEventListener('beforeunload', (event) => {
    //event.preventDefault();
    //event.returnValue = '';
    Ui.store(); // store to cookie
});

// websocket client
const ws0 = Core.worker();
const ws1 = Core.worker();

let grab_interval_id;

//	opus
const SAMPLE_RATE = 48000; //Hz
const BIT_RATE = 64000; // bps
const STEREO = true;
const opus = Audio.encoder(SAMPLE_RATE, STEREO, BIT_RATE);

const name = localStorage.getItem("sougi-manage-name");//Core.get_uuid();
const id = localStorage.getItem("sougi-manage-id");
let aGainNode;
let cameras = [];

function showChannelSetting(status) {
    $("#_set_mobile").attr("hidden",status);
    $("#_setting").attr("hidden",!status);
    $("#_channel_open").attr("hidden",!status);
    $("#_channel_close").attr("hidden",!status);
    $("#_channel_audio").attr("hidden",!status);
    $("#_channel_message").attr("hidden",!status);
}
// Initialize
window.onload = () => {
    Core.init(ws0, ws1);
    console.log(location.origin);
    Core.connect(location.origin);
    cameras = localStorage.getItem("sougi-manage-camera");
    if(cameras.length == 0) {
        showChannelSetting(false);
    } else {
        showChannelSetting(true);
    }
}

// WebSocket
ws0.onmessage = e => {
    switch (e.data.type) {
        case 'api':
            let json = e.data.content;
            cameras = json.camera;
            localStorage.setItem("sougi-manage-camera", cameras);
            showChannelSetting(true);
            break;
        case 'connect':
            if (e.data.result == 'close') {
                //Core.show_alert(_alert, 'danger', 'main closed');
            }
            break;
        case 'config':
            Core.config(e.data.config);
            Core.text_languages(); // must be call after config
            break;
        case 'active_list':
            showSettingModal(e.data.list);
            break;
        case 'languages':
            Core.text_language_list(e.data);
            Ui.restore(); // restore from cookie
            break;
        case 'opened':
            console.info('opened', e.data.info.threadId);
            ws1.threadId = e.data.info.threadId;
            showChannelSetting(true);
            Core.channel_connect(e.data.info);
            Core.show_alert(_alert, 'info', 'connected');
            break;
        case 'created':
            let port = e.data.info.port;

        case 'closed':
            console.info('closed', e.data.info.threadId);
            Core.show_alert(_alert, 'info', 'closed');
            delete ws1.threadId;
            break;
        default:
            console.error("ws0 unkown msg:", e.data);
    }
}
ws1.onmessage = e => {
    switch (e.data.type) {
        case 'connect':
            if (e.data.result == 'close') {
                //Core.show_alert(_alert, 'info', 'channel closed');
            }
            break;
        case 'open':
            console.log('ws1 opened');
            console.log(new Date());
            // do nothing
            break;
        case 'text':
            e.data.sender = 1;
            Core.text_translate(e.data);
            break;
        case 'text_remove':
            Core.text_remove_message(e.data);
            break;
        case 'translated':
            Core.text_append(e.data.payload);
            break;
        case 'tts':
            Core.text_speech(e.data.payload);
            break;
        case 'transcription':
            Core.text_submit({
                user: '(Speech)' + (_txt_name.value || ""),
                color: 'yellow',
                gender: _txt_gender_male.checked ? 'MALE' : 'FEMALE',
                language: e.data.locale,
                message: e.data.text
            });
            break;
        default:
            console.error("unkown msg:", e.data);
    }
}


function save_camera() {
    let mobiles = [];
    let mobiles_pre = [_mobile1.value, _mobile2.value, _mobile3.value];
    for(var i = 0; i < mobiles_pre.length; i ++) {
        if(mobiles_pre[i] && mobiles_pre[i] != '') {
            mobiles.push(mobiles_pre[i]);
        }
    }

    let data = {
        id: id,
        camera: mobiles.join(',')
    };
    _ws0.postMessage({
        type: 'api',
        method: 'channel',
        path: 'update',
        body: data
    });
}

function channel_open() {
    if (ws1.threadId) {
        Core.show_alert(_alert, 'warning', 'Already opened.');
    } else {
        Core.channel_open(id, name, cameras); //todo
        // if (uuid)
        //
        // else
        //     Core.show_alert(_alert, 'warning', 'Has not uuid. Please access from top page');
    }
}

function channel_close() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else if (!_video.paused) {
        Core.show_alert(_alert, 'warning', 'Not stopped.');
    } else {
        Core.channel_close(ws1.threadId);
    }
}



function channel_stop() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else if (_video.paused) {
        Core.show_alert(_alert, 'warning', 'Not started.');
    } else {
        console.info("channel_stop");
        Core.show_alert(_alert, 'info', 'channel stop');
        _video.pause();
        aGainNode.disconnect(Audio.context.destination);
        clearInterval(grab_interval_id);

        // stop
        Core.channel_stop();
    }
}

function channel_modify() {
    var video_index = $("[name=video]:checked").val();
    var audio_index = $("[name=audio]:checked").val();
    console.info("Send threadId is " + ws1.threadId);
    Core.channel_setting(video_index, audio_index, ws1.threadId);
}


function text_submit() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else {
        const user = _txt_name.value;
        const message = _txt_text.value;
        const locale = _txt_language.value;
        // todo: set color
        const colors = ['black', 'midnightblue', 'darkslategray', 'maroon', 'darkred'];
        if (user && message) {
            const color = colors[user.length % colors.length];
            Core.text_submit({
                user: user,
                message: message,
                color: color,
                language: locale,
                gender: _txt_gender_male.checked ? 'MALE' : 'FEMALE',
            });
        } else {
            Core.show_alert(_txt_alert, 'danger', 'Fill in your name and message');
        }
    }
}

function text_remove(mobile) {
    Core.text_remove(mobile);
}

function showModal() {
    $('#_modal').modal('show');
}

function channel_active_list() {
    if (ws1.threadId) {
        Core.channel_active_list(ws1.threadId);
    } else {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    }

}

function showSettingModal(list) {
    for(var i = 1; i <= 3; i ++) {
        let isActive = false;
        list.forEach(index => {
            if(index == i) {
                isActive = true;
            }
        });
        if(isActive == false) {
            $("#video_" + i).attr("disabled",true);
            $("#audio_" + i).attr("disabled",true);
        } else {
            $("#video_" + i).attr("disabled",false);
            $("#audio_" + i).attr("disabled",false);
        }
    }
    $('#_modal_setting').modal('show');
}

function music_start() {
    if (_music.value) {
        Core.music(ws1.threadId, _audio, _music.value); // play
    } else {
        Core.music(ws1.threadId, _audio); // stop
    }
}

function music_volume_change() {
    _audio.volume = _music_volume.value / 100;
}
