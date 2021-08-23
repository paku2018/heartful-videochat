//
// Core module
//



function default_show_alert(elem, type, msg) {
    elem.innerHTML =
        '<div class="alert alert-' + type + ' alert-dismissible">' +
        '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
        msg +
        '</div>';
}
module.exports = {
    get_base_url: function() {
        return "https://alb.heart-warming.jp:8444/api/channel/";
        //return "http://localhost:8001/api/channel/";
    },
    show_alert: default_show_alert,
    worker: function() {
        return new Worker('dist/worker_wsocket.js');
    },
    init: function(mw, cw) {
        self._ws0 = mw;
        self._ws1 = cw;
        self._config = {};
    },
    connect: function(origin) {
        _ws0.postMessage({
            type: 'connect',
            hs_url: origin,
            ws_url: origin.replace('http', 'ws')
        });
    },
    config: function(config) {
        self._config = config;
    },
    text_submit: function(json) {
        _ws1.postMessage({
            type: 'text',
            utc: Date.now(),
            user: json.user,
            message: json.message,
            color: json.color,
            language: json.language,
            gender: json.gender,
            threadId: json.threadId
        });
    },
    text_remove: function(mobile) {
        _ws1.postMessage({
            type: 'text_remove',
            mobile: mobile
        });
    },
    text_translate: function(json) {
        json.locale = _txt_language.value;
        if (json.language == json.locale) {
            this.text_append(json);
        } else {
            // translate
            if (_config.gc_translate && _config.gc_apikey) { // use rest api if you have apikey
                const request = {
                    "q": [json.message],
                    "target": json.locale
                };
                fetch(_config.gc_translate + "?key=" + _config.gc_apikey, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(request)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.data.translations.length > 0) {
                            json.message = data.data.translations[0].translatedText;
                            this.text_append(json);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            } else {
                _ws1.postMessage({
                    type: 'translate',
                    payload: json
                });
            }
        }
    },
    text_append: function(json) {
        if (_txt_speech.checked) {
            if (_config.gc_tts && _config.gc_apikey) { // use rest api if you have apikey
                const request = {
                    input: { text: json.message },
                    voice: {
                        languageCode: json.locale,
                        ssmlGender: json.gender
                    },
                    audioConfig: { audioEncoding: 'OGG_OPUS' }
                };
                fetch(_config.gc_tts + "?key=" + _config.gc_apikey, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(request)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.audioContent) {
                            this.text_speech('data:audio/ogg;codecs=opus;base64,' + data.audioContent);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            } else {
                _ws1.postMessage({
                    type: 'speech',
                    payload: json
                });
            }
        }

        const msg = document.createElement("div");
        msg.id = "_message_" + json.text_index;
        msg.classList.add("d-flex");
        msg.classList.add("_mobile_" + json.user.mobile);
        msg.classList.add("align-items-center");
        const date = new Date(json.utc);
        const timeStr = "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]";

        msg.innerHTML = "<div class='flex-fill'><font color=" + json.color + ">" + timeStr + " " + json.user.name + "<br>" + json.message + "</font>";
        if (json.original) {
            msg.innerHTML += "<br><font color='gray'>" + "(" + json.language + ") " + json.original + "</font>";
        }
        msg.innerHTML += "</div>"
        if(json.sender == 1) {
            msg.innerHTML += "<button onclick='text_remove("+ json.user.mobile + ")'>BAN</button>";
        }
        _txt_msg.prepend(msg);

        if (_txt_msg.childElementCount > 300) {
            _txt_msg.removeChild(_txt_msg.lastChild);
        }
    },

    text_remove_message: function(json) {
        let mobile = json.mobile;
        let name = "_mobile_" + mobile;
        $("." + name).remove();
    },
    text_clear: function() {
        _txt_msg.innerHTML = '';
    },
    text_languages: function() {
        const locale = (navigator.language || navigator.userLanguage || navigator.browserLanguage);
        if (_config.gc_languages && _config.gc_apikey) { // use rest api if you have apikey
            const request = { "target": locale };
            fetch(_config.gc_languages + "?key=" + _config.gc_apikey, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request)
                })
                .then(response => response.json())
                .then(data => {
                    data.data.locale = locale;
                    this.text_language_list(data.data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        } else {
            _ws0.postMessage({
                type: 'languages',
                locale: locale
            });
        }
    },
    text_language_list: function(json) {
        console.info('navigator language:', json.locale);
        json.languages.forEach(element => {
            var option = document.createElement("option");
            option.text = element.name;
            option.value = element.code;
            if ((element.code || element.language) == json.locale) {
                option.selected = true;
            }
            _txt_language.add(option);
        });
    },
    text_speech: function(payload) {
        if (payload) {
            const audio = document.createElement("audio");
            audio.src = payload; // data type + base64
            audio.play();
        }
    },
    transcribe_stream: function(inputBuffer, locale) {
        const DESIRED_SAMPLE_RATE = 16000;
        const offlineCtx = new OfflineAudioContext(1, inputBuffer.duration * DESIRED_SAMPLE_RATE, DESIRED_SAMPLE_RATE);
        const cloneBuffer = offlineCtx.createBuffer(inputBuffer.numberOfChannels, inputBuffer.length, inputBuffer.sampleRate);
        // Copy the source data into the offline AudioBuffer
        for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
            cloneBuffer.copyToChannel(inputBuffer.getChannelData(channel), channel);
        }
        // Play it from the beginning.
        const source = offlineCtx.createBufferSource();
        source.buffer = cloneBuffer;
        source.connect(offlineCtx.destination);
        offlineCtx.oncomplete = function(e) {
            // Get resampled buffer as e.renderdBuffer
            _ws1.postMessage({
                type: 'transcribe',
                method: 'stream',
                locale: locale,
                payload: e.renderedBuffer.getChannelData(0)
            });
        }
        offlineCtx.startRendering();
        source.start(0);
    },
    music: function(threadId, audio, music, ) {
        if (music) {
            _ws0.postMessage({
                type: 'music',
                src: music,
                threadId: threadId
            });
            //audio.src = music;
            //audio.play();
        } else {
            _ws0.postMessage({
                type: 'music',
                threadId: threadId
            });
            //audio.pause();
        }
    },
    ////
    audio_data: function(index, payload, threadId) {
        _ws0.postMessage({
            type: 'audio',
            payload: payload,
            index: index,
            threadId: threadId
        });
    },
    video_data: function(index, payload, threadId) {
        _ws0.postMessage({
            type: 'video',
            payload: payload,
            index: index,
            threadId: threadId
        });
    },
    channel_open: function(id, name, mobiles) {
        _ws0.postMessage({
            type: 'channel',
            method: 'open',
            name: name,
            id: id,
            mobiles: mobiles
        });
    },
    channel_close: function(threadId) {
        _ws0.postMessage({
            type: 'channel',
            method: 'close',
            threadId: threadId
        });
    },
    channel_start: function() {
        _ws1.postMessage({
            type: 'channel',
            method: 'start'
        });
    },
    channel_stop: function() {
        _ws1.postMessage({
            type: 'channel',
            method: 'stop'
        });
    },
    channel_list: function() {
        _ws0.postMessage({
            type: 'channel',
            method: 'list'
        });
    },
    channel_connect: function(info) {
        _ws1.postMessage({
            type: 'connect',
            hs_url: info.origin,
            ws_url: info.ws//origin.replace('http', 'ws')
        });
    },
    channel_disconnect: function() {
        _ws1.postMessage({ type: 'disconnect' });
    },
    channel_setting: function(video, audio, threadId) {
        _ws0.postMessage({
            type: 'channel',
            method: 'setting',
            threadId: threadId,
            video: video,
            audio: audio
        });
    },
    channel_active: function(index, threadId) {
        _ws0.postMessage({
            type: 'channel',
            method: 'active',
            threadId: threadId,
            index: index,
        });
    },
    channel_active_list: function(threadId) {
        _ws0.postMessage({
            type: 'channel',
            method: 'active_list',
            threadId: threadId
        });

    },
    fetch_start: function(threadId) {
        _ws0.postMessage({
            type: 'fetch',
            method: 'start',
            threadId: threadId
        });
    },
    fetch_start_sub: function(threadId, channel) {
        _ws1.postMessage({
            type: 'fetch',
            method: 'start_sub',
            threadId: threadId,
            channel: channel
        });
    },
    fetch_stop: function() {
        _ws1.postMessage({
            type: 'fetch',
            method: 'stop'
        });
    },
    fetch_next: function(channel) {
        _ws1.postMessage({
            type: 'fetch',
            method: 'next',
            channel: channel
        });
    },
    get_uuid: function() {
        const cookies = document.cookie.split('; ');
        let uuid = '';
        cookies.forEach((cookie) => {
            const pair = cookie.split('=');
            if (pair[0] == 'uuid') {
                uuid = pair[1];
            }
        });
        return uuid;
    },
    send_log: function(text) {
        _ws1.postMessage({
            type: 'debug',
            text: text,
        });
    },

}