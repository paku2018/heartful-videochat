window.addEventListener('beforeunload', (event) => {
    //event.preventDefault();
    //event.returnValue = '';
    Ui.store(); // store to cookie
});

// websocket client
const ws0 = Core.worker();
const ws1 = Core.worker();

// mjpeg
const videoSize = {
    w: 450,
    h: 800
};
const FPS = 20;
const QUALITY = 0.5;
const mjpeg = Video.worker();
let grab_interval_id;

//	opus
const SAMPLE_RATE = 48000; //Hz
const BIT_RATE = 64000; // bps
const STEREO = true;
const opus = Audio.encoder(SAMPLE_RATE, STEREO, BIT_RATE);
let aGainNode;

let index;

let video_index = 1;
let audio_index = 1;
let channelList = [];

// Initialize
window.onload = () => {
    Core.init(ws0, ws1);
    Core.connect(location.origin);
    navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
        getUserMedia: function(c) {
            return new Promise(function(y, n) {
                (navigator.mozGetUserMedia ||
                    navigator.webkitGetUserMedia).call(navigator, c, y, n);
            });
        }
    } : null);
    if (!navigator.mediaDevices) {
        console.error("getUserMedia() not supported.");
    }

}

// WebSocket
ws0.onmessage = e => {
    switch (e.data.type) {
        case 'connect':
            if (e.data.result == 'close') {
                Core.show_alert(_alert, 'danger', 'main closed');
            } else if (e.data.result == 'error') {
                Core.show_alert(_alert, 'danger', e.data.error);
            } else {
                channel_open();
            }
            break;
        case 'config':
            Core.config(e.data.config);
            Core.text_languages(); // must be call after config
            break;
        case 'languages':
            Core.text_language_list(e.data);
            Ui.restore(); // restore from cookie
            break;
        case 'opened':
            console.info('opened', e.data.info.threadId);
            ws1.threadId = e.data.info.threadId;
            Core.channel_connect(e.data.info);
            Core.show_alert(_alert, 'info', 'connect to ' + e.data.info.origin);
            break;
        case 'closed':
            console.info('closed', e.data.info.threadId);
            Core.show_alert(_alert, 'info', 'closed');
            delete ws1.threadId;
            break;
        case 'list':
            show_channel_list(e.data.channel);
            break;
        case 'setting':
            Core.show_alert(_alert, 'info', "Change Setting changed");
            video_index = e.data.video;
            audio_index = e.data.audio;
            break;
        default:
            console.error("ws0 unkown msg:", e.data);
    }
}
ws1.onmessage = e => {
    switch (e.data.type) {
        case 'connect':
            if (e.data.result == 'close') {
                Core.show_alert(_alert, 'info', 'channel closed');
                if (!_video.paused) channel_stop();
                delete ws1.threadId;
            } else if (e.data.result == 'error') {
                Core.show_alert(_alert, 'danger', e.data.error);
            }
            break;
        case 'open':
            console.log('ws1 opened');
            // do nothing
            break;
        case 'text':
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
                message: e.data.text,
                threadId: ws1.threadId
            });
            break;
        default:
            console.error("unkown msg:", e.data);
    }
}

opus.onmessage = e => {
    switch (e.data.type) {
        case 'ready':
            break;
        case 'data':
            Core.audio_data(index, e.data.payload, ws1.threadId);
            Core.channel_active(index, ws1.threadId);
            break;
        case 'error':
            console.error(e.data.error);
            break;
        default:
            console.warn('audio', e.data);
    }
}

mjpeg.onmessage = e => {
    switch (e.data.type) {
        case 'data':
            Core.video_data(index, e.data.payload, ws1.threadId);
            Core.channel_active(index, ws1.threadId);
            break;
    }
}

function grab() {
    _canvas.width = videoSize.w;
    _canvas.height = videoSize.h;
    const canvasCtx = _canvas.getContext('2d');
    canvasCtx.drawImage(_video, 0, 0, videoSize.w, videoSize.h);
    //
    //todo: another image processes
    //
    Video.frame(_canvas, QUALITY);
};

function show_channel_list(channels) {
    console.log("Receive channel list");
    _list.innerHTML = '';
    channelList = channels;
    channel_choose();
}

function channel_open() {
    if (ws1.threadId) {
        Core.show_alert(_alert, 'warning', 'Already opened.');
    } else {
        Core.channel_list();
    }
}

function channel_choose() {
    let selected  = false;
    let port = localStorage.getItem("sougi-camera-port");
    let camera_id = localStorage.getItem("sougi-camera-id");
    console.log(port + ":" + camera_id);
    channelList.forEach(e => {
        let mobiles = e.mobiles;
        if(e.port == port) {
            for(var i = 0; i < mobiles.length; i ++) {
                if(mobiles[i] == camera_id) {
                    ws1.threadId = e.threadId;
                    Core.show_alert(_alert, 'info', 'connected');
                    Core.channel_connect(e);
                    index = i + 1;
                    video_index = e.video;
                    audio_index = e.audio;
                    selected = true;
                    return;
                }
            }
        }
    });

    if(selected == false) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    }

}

function channel_close() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else if (!_video.paused) {
        Core.show_alert(_alert, 'warning', 'Not stopped.');
    } else {
        Core.channel_disconnect();
        //Core.channel_close(ws1.threadId);
        Core.text_clear();
    }
}

function channel_start() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
        return;
    }
    if (!_video.paused) {
        Core.show_alert(_alert, 'warning', 'Not stopped.');
        return;
    }
    console.info("channel_start");
    Core.show_alert(_alert, 'info', 'channel start');
    //
    navigator.mediaDevices.getUserMedia({
        audio: {
            sampleRate: SAMPLE_RATE,
            echoCancellation: true,
            echoCancellationType: 'system',
            noiseSuppression: true,
            latency: 0
        },
        video: {
            width: (window.innerWidth > window.innerHeight ? videoSize.w : videoSize.h),
            height: (window.innerWidth > window.innerHeight ? videoSize.h : videoSize.w),
            facingMode: 'user'
        }
    })
        .then(function(stream) {
            const aRecorder = Audio.recorder(stream);
            // gain node
            aGainNode = Audio.context.createGain();
            aGainNode.gain.value = 0;
            aRecorder.connect(aGainNode);
            aRecorder.onaudioprocess = audioProcess;

            // start
            _video.srcObject = stream;
            _video.play();
            aGainNode.connect(Audio.context.destination);
            //
            grab_interval_id = setInterval(grab, 1000.0 / FPS);

            //
            //Core.channel_start();
        })
        .catch(function(err) {
            console.error("getUserMedia", err);
        });
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
        //Core.channel_stop();
    }
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
                threadId: ws1.threadId
            });
        } else {
            Core.show_alert(_txt_alert, 'danger', 'Fill in your name and message');
        }
    }
}

function music_start() {
    if (_music.value) {
        Core.music(_audio, _music.value); // play
    } else {
        Core.music(_audio); // stop
    }
}

function music_volume_change() {
    _audio.volume = _music_volume.value / 100;
}

function audioProcess(e) {
    Video.encode(FPS);
    Audio.encode(e.inputBuffer);
    if (_transcribe.checked) {
        Core.transcribe_stream(e.inputBuffer, _txt_language.value);
    }
}