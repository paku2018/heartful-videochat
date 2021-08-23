
(function(self) {
    // key
    const K_AUDIO = (1 << 0);
    const K_VIDEO = (1 << 1);
    const K_JSON = (1 << 2);

    // websocket handler
    let ws;


    function connectionError(msg) {
        postMessage({ type: 'connect', result: "error", error: msg || 'disconnected' });
        fetch_stop();
    }

    function ws_connect(ws_url) {
        ws = new WebSocket(ws_url);
        ws.binaryType = 'arraybuffer'; // default 'blob'
        ws.onopen = e => {
            postMessage({ type: 'connect', result: "open" });
        }
        ws.onmessage = e => {
            const json = JSON.parse(e.data);
            if (json.type == 'fetch') {
                switch (json.method) {
                    case 'start':
                        postMessage(json);
                        //fetch_start(json.channel);
                        break;
                    case 'stop':
                        console.info("Ws receive stop message");
                        fetch_stop();
                        break;
                    case 'next':
                        //fetch_next();
                        postMessage(json);
                        break;
                    default:
                        console.error('unknown message', json, ws_url);
                }
            } else {
                // pass through to the client
                postMessage(json);
            }
        }
        ws.onclose = e => {
            ws = null;
            postMessage({ type: 'connect', result: "close" });
            fetch_stop();
        }
        ws.onerror = e => {
            connectionError(e);
        }
    }

    // fetch handler
    let fetch_running = false;
    let channelCode = 0;
    let lastChannelCode = 0;
    let thread;
    let perf = 0;

    function fetch_start(code, threadId) {
        if (fetch_running) return;
        else if (code < 0) {
            if(ws) {
                ws.send(JSON.stringify({
                    type: 'fetch',
                    method: 'start',
                    threadId: threadId
                }));
            } else connectionError('can not fetch start');
        } else if (code > 0) {
            fetch_running = true;
            channelCode = code;
            thread = threadId
            postMessage({ type: 'fetch', method: 'start' });
        } else {
            postMessage({ type: 'fetch', method: 'none' });
        }
    }

    function fetch_stop() {
        if (fetch_running) {
            if (ws) ws.send(JSON.stringify({
                type: 'fetch',
                method: 'stop'
            }));
            fetch_running = false;
            postMessage({ type: 'fetch', method: 'stop' });
        }
    }

    async function fetch_next(channel) {
        let limit = 32;
        if(channel && channel > channelCode + limit) {
            channelCode = channel - limit;
        }
        let curChannelCode = channelCode;
        const url = self.hs_url + '/' + thread + '_' + curChannelCode;
        channelCode++;
        try {
            //fetch_running = false;
            const buffer = await (await fetch(url)).arrayBuffer();
            //alert("Size is " + buffer.byteLength);
            if (buffer.byteLength == 0) {
                console.info("Byte length is zero ");
                fetch_running = false;
                fetch_stop();
                return;
            }
            if(curChannelCode <= lastChannelCode) {
                return ;
            }
            lastChannelCode = curChannelCode;
            const p = performance.now();
            if (perf) console.log('fetch', p - perf, curChannelCode, buffer.byteLength);
            perf = p;

            const view = new DataView(buffer);
            const data = new Uint8Array(buffer);
            let offset = 0;

            while (offset < buffer.byteLength) {
                const key = view.getUint32(offset);
                offset += 4;
                const size = view.getUint32(offset);
                offset += 4;
                const buffer = data.slice(offset, offset + size);
                offset += size;
                if(size > 0) {
                    switch (key) {
                        case K_AUDIO:
                            postMessage({ type: 'audio', payload: buffer.buffer });
                            break;
                        case K_VIDEO:
                            postMessage({ type: 'video', payload: buffer });
                            break;
                        case K_JSON:
                            postMessage(JSON.parse((new TextDecoder).decode(buffer)));
                            break;
                    }
                }
            }
            //ws.send(JSON.stringify({'type': 'debug', 'text': 'Receive fetch data' + buffer.byteLength}));
            //fetch_running = true;
        } catch (err) {
            postMessage({ type: 'fetch', result: 'error', error: err });
        }

    }

    self.keys = 0;
    self.ready = 0;
    self.chunk = {};

    function send_chunk(json) {
        let offset = 0;
        let total = json.payload.byteLength + 16;

        const buffer = new ArrayBuffer(total);
        const data = new Uint8Array(buffer);
        const view = new DataView(buffer);

        // header version code
        view.setUint32(0, 0x00000000);
        offset += 4;
        view.setUint32(offset, json.threadId);
        offset += 4;
        view.setUint32(offset, json.index);
        offset += 4;
        let type = K_AUDIO;
        if(json.type == 'video') {
            type = K_VIDEO;
        }
        view.setUint32(offset, type);
        offset += 4;
        data.set(json.payload, offset);
        if (ws) ws.send(buffer);
        else connectionError();
    }

    function send_voice(pcm32f, locale) {
        const uiLocale = (new TextEncoder).encode(locale);
        const pcm16i = Int16Array.from(pcm32f.map(x => (x > 0 ? x * 0x7FFF : x * 0x8000)));
        const data = new Int16Array(2 + pcm16i.length);
        const view = new DataView(data.buffer);
        // header language code
        view.setUint8(0, uiLocale[0]);
        view.setUint8(1, uiLocale[1]);
        if (uiLocale.length > 2) view.setUint8(2, uiLocale[2]);
        if (uiLocale.length > 3) view.setUint8(3, uiLocale[3]);
        data.set(pcm16i, 2);
        if (ws) ws.send(data.buffer);
        else connectionError('disconnected');
    }

    // worker handler
    self.onmessage = e => {
        switch (e.data.type) {
            case 'connect':
                self.hs_url = e.data.hs_url;
                ws_connect(e.data.ws_url);
                break;
            case 'disconnect':
                if (ws) {
                    ws.close();
                    ws = null;
                }
                break;

            case 'fetch':
                if (e.data.method == 'start_sub') fetch_start(e.data.channel, e.data.threadId);
                else if (e.data.method == 'stop') {
                    console.info("Receive stop message");
                    fetch_stop();
                }
                else if (e.data.method == 'next') {
                    //ws.send(JSON.stringify({'type': 'debug', 'text': 'fetch data'}));
                    if(fetch_running) {
                        fetch_next(e.data.channel);
                    }
                }
                else ws.send(JSON.stringify(e.data));
                break;
            case 'transcribe':
                if (e.data.method == 'stream') {
                    send_voice(e.data.payload, e.data.locale);
                } else {
                    if (ws) ws.send(JSON.stringify(e.data));
                }
                break;
                // pass through to the server
            default:
                if (ws) {
                    //e.data.payload = [];
                    if(e.data.type == 'video' || e.data.type == 'audio') {
                        send_chunk(e.data);
                        //ws.send(e.data.payload);
                    } else {
                        ws.send(JSON.stringify(e.data));
                    }
                }
                else connectionError();
                break;
        }
        // if (self.ready & K_AUDIO) {
        //     send_chunk();
        //     self.ready = 0;
        //     self.chunk = {};
        // }
    }

})(self);