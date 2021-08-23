// websocket
const ws0 = Core.worker();
const ws1 = Core.worker();

// mjpeg
const mjpeg = Video.worker();

// opus
const SAMPLE_RATE = 48000; //Hz
const STEREO = true;
const opus = Audio.decoder(SAMPLE_RATE, STEREO);
let scheduled_time = 0;
let mobile;

let playing = false;

let video_buffer = [];
let audio_buffer = [];
let id;

// Initialize
window.onload = () => {
    Core.init(ws0, ws1);
    Core.connect(location.origin);
    console.log(window.location);
    let parse = Url.parse(window.location.href, true, true);
    id = parse.query.id;


};

function init() {
    playing = false;
    audio_buffer = [];
}

function onEnded() {
    playing = false;
    if(audio_buffer.length > 0) {
        let data = audio_buffer[0];
        audio_buffer.shift();
        play(data);
    }
}

function play(data) {
    playing = true;
    Video.play();
    let result = Audio.play(data, scheduled_time);
    scheduled_time = result.time;
    let duration = result.duration;
    Core.send_log("result is " + JSON.stringify(result));
    setTimeout(onEnded, duration * 1000);
}

// WebSocket
ws0.onmessage = e => {
    switch (e.data.type) {
        case 'connect':
            if (e.data.result == 'close') {
                Core.show_alert(_alert, 'danger', 'main closed');
            } else if (e.data.result == 'error') {
                Core.show_alert(_alert, 'danger', e.data.error);
            } else if(e.data.result == 'open') {
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
        case 'list':
            show_channel_list(e.data.channel);
            break;
        case 'start':
            console.log("Receive fetch sub data is " + JSON.stringify(e.data));
            if(e.data.audio) {
                _background.src = e.data.audio;
                _background.play();
            }
            //init();
            let index = parseInt(e.data.video);
            if(isNaN(index)) {
                showVideo(e.data.video);
            }
            Core.fetch_start_sub(e.data.threadId, e.data.channel);
            break;

        case 'fetch':
            Core.fetch_next(e.data.channel);
            break;
        case 'music':
            console.info("Receive music " + e.data);
            if (e.data.src) {
                _background.src = e.data.src;
                _background.play();
            } else {
                _background.pause();
            }
            break;
        case 'setting':
            let video_index = parseInt(e.data.video);
            if(isNaN(video_index)) {
                showVideo(e.data.video);
            } else {
                stopVideo();
            }
            break;
        default:
            console.error("ws0 unkown msg:", e.data);
    }
}
ws1.onmessage = e => {
    switch (e.data.type) {

        case 'connect':
            if (e.data.result == 'close') {
                delete ws1.threadId;
                delete ws1.playing;
                Core.show_alert(_alert, 'info', 'channel closed');
            } else if (e.data.result == 'error') {
                Core.show_alert(_alert, 'danger', e.data.error);
            }
            break;
        case 'open':
            Core.show_alert(_alert, 'info', 'opened');
            break;
        case 'video':
            //Core.send_log("Recevie video data " + e.data.payload.length);
            Video.decode(e.data.payload);
            break;
        case 'audio':
            //Core.send_log("Recevie audio data " + e.data.payload.length);
            Audio.decode(e.data.payload);
            break;
        case 'text':
            Core.text_translate(e.data);
            break;
        case 'text_remove':
            Core.text_remove_message(e.data);
            setBlock(e.data);
            break;
        case 'translated':
            Core.text_append(e.data.payload);
            break;
        case 'tts':
            Core.text_speech(e.data.payload);
            break;
        case 'fetch':
            switch (e.data.method) {
                case 'start':
                    ws1.playing = true;
                    Core.show_alert(_alert, 'info', 'fetch start');
                    break;
                case 'stop':
                    delete ws1.playing;
                    Core.show_alert(_alert, 'info', 'fetch stop');
                    break;
                case 'none':
                    Core.show_alert(_alert, 'info', 'no data');
                    break;
            }
            break;
        case 'debug':
            Core.show_alert(_alert, 'info', e.data.text);
            break;
        default:
            console.error("ws1 unkown msg:", e.data);
    }
}

mjpeg.onmessage = e => {
    //Core.send_log("Mjpeg receive " + e.data.type);
    switch (e.data.type) {
        case 'frame':
            //Core.send_log('Receive frames');
            var img = new Image();
            img.onload = function() {
                _canvas.width = img.width;
                _canvas.height = img.height;
                const canvasCtx = _canvas.getContext('2d');
                canvasCtx.drawImage(img, 0, 0, img.width, img.height);
            }
            img.src = URL.createObjectURL(e.data.blob);
            break;

    }
}

opus.onmessage = e => {
    //Core.send_log("Opus receive " + e.data.type + ":" + playing);
    switch (e.data.type) {
        case 'ready':
            break;
        case 'data':
            if(playing == false) {
                play(e.data.payload);
            } else {
                audio_buffer.push(e.data.payload);
            }
            break;

        case 'error':
            console.error('audio decode error', e.data.error);
        default:
    }
}

function setBlock(json) {
    if(json.mobile == mobile) {
        _btn_text_submit.setAttribute('disabled', true);
    }
}

function showVideo(src) {
    $("#_canvas").addClass('d-none');
    $("#_default_video_parent").removeClass('d-none');
    _default_video.src = src;
    _default_video.play();
}

function stopVideo() {
    $("#_default_video_parent").addClass('d-none');
    _default_video.pause();
    $("#_canvas").removeClass('d-none');
}

function show_channel_list(channels) {
    _list.innerHTML = '';
    console.log(channels);
    channels.forEach(e => {
        if(e.id == id) {
            ws1.threadId = e.threadId;
            const origin = e.origin;
            Core.show_alert(_alert, 'info', 'connected ');
            Core.channel_connect(e);
            return ;
        }

        // return;
        // const a = document.createElement("a");
        // a.setAttribute("class", "list-group-item");
        // a.setAttribute("data-toggle", "list");
        // a.setAttribute("origin", e.origin);
        // a.setAttribute("thread", e.threadId);
        // a.text = e.name + ":(" + e.id + "):" + e.origin;
        // _list.appendChild(a);
    });
    //$('#_modal').modal('show');
}

function channel_open() {
    if (ws1.threadId) {
        Core.show_alert(_alert, 'warning', 'Already opened.');
    } else if (ws1.playing) {
        Core.show_alert(_alert, 'warning', 'Already playing.');
    } else {
        Core.channel_list();
    }
}

function select_mobile() {
    mobile =_mobile.value;
}

function channel_choose() {
    for (let i = 0; i < _list.children.length; i++) {
        if (_list.children[i].classList.contains('active')) {
            ws1.threadId = _list.children[i].getAttribute('thread');
            const origin = _list.children[i].getAttribute('origin');
            Core.show_alert(_alert, 'info', 'connected');
            Core.channel_connect(origin);
            return;
        }
    }
    Core.show_alert(_alert, 'warning', 'Please choose.');
}

function channel_close() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else {
        console.info('channel_close');
        Core.show_alert(_alert, 'info', 'channel close');
        Core.channel_disconnect();
        Core.text_clear();
    }
}

function channel_start() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else if (ws1.playing) {
        Core.show_alert(_alert, 'warning', 'Now playing.');
    } else {
        console.info('channel_start');
        Core.fetch_start(ws1.threadId);
    }

}

function channel_stop() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else if (ws1.playing === undefined) {
        Core.show_alert(_alert, 'warning', 'Not played.');
    } else {
        console.info('channel_stop');
        Core.fetch_stop();
        delete ws1.playing;
    }
    if (!_audio.paused) {
        _audio.pause();
    }
    if (!_background.paused) {
        background.pause();
    }
    if (!_default_video.paused) {
        _default_video.pause();
    }
}

function text_submit() {
    if (ws1.threadId === undefined) {
        Core.show_alert(_alert, 'warning', 'Not opened.');
    } else {
        const name = _txt_name.value;
        const user = {
            name: name,
            mobile: mobile
        };
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

function music_volume_change() {
    _audio.volume = _music_volume.value / 100;
    _background.volume = _music_volumn.value / 100;
    _default_video.volume = _music_volume.value / 100;
}

function music_stop() {
    _audio.pause();
}