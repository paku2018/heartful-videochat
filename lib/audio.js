let context;
let opus;

function init_context() {
    if (context === undefined) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        module.exports.context = context = new AudioContext();
    }
}

module.exports = {
    encoder: function(sample_rate, stereo, bit_rate) {
        if (opus === undefined) {
            opus = new Worker('dist/worker_opus_enc.js');
            opus.sampleRate = sample_rate;
            opus.stereo = stereo;
            opus.addEventListener('message', function(e) {
                if (e.data.type == 'ready') {
                    console.log('opus ecoder ready');
                    opus.postMessage({
                        type: 'init',
                        config: {
                            frameDuration: 20, //ms
                            originalRate: sample_rate,
                            sampleRate: sample_rate,
                            channels: stereo ? 2 : 1,
                            params: {
                                cbr: false,
                                bitRate: bit_rate
                            }
                        }
                    });
                }
            }, false);
        }
        return opus;
    },
    decoder: function(sample_rate, stereo) {
        if (opus === undefined) {
            opus = new Worker('dist/worker_opus_dec.js');
            opus.sampleRate = sample_rate;
            opus.stereo = stereo;
            opus.addEventListener('message', function(e) {
                if (e.data.type == 'ready') {
                    console.log('opus decoder ready');
                    opus.postMessage({
                        type: 'init',
                        config: {
                            sampleRate: sample_rate,
                            channels: stereo ? 2 : 1
                        }
                    });
                }
            }, false);
        }
        return opus;
    },
    recorder: function(stream) {
        init_context();
        // attach audio
        const aStream = context.createMediaStreamSource(stream);
        let aRecorder;
        const BUFFER_SIZE = 16384;
        const channels = opus.stereo ? 2 : 1;
        if (context.createScriptProcessor) {
            aRecorder = context.createScriptProcessor(BUFFER_SIZE, channels, channels);
        } else {
            aRecorder = context.createJavaScriptNode(BUFFER_SIZE, channels, channels);
        }
        aStream.connect(aRecorder);
        return aRecorder;
    },
    encode: function(inputBuffer) {
        let pcmArray = [];
        for (let c = 0; c < inputBuffer.numberOfChannels; c++) {
            pcmArray.push(inputBuffer.getChannelData(c));
        }
        opus.postMessage({
            type: 'encode',
            buffers: pcmArray
        });
    },
    decode: function(payload) {
        init_context();
        opus.postMessage({
            type: 'decode',
            buffer: new Uint8Array(payload)
        });
    },
    play: function(pcmArray, time) {
        const aBuf = context.createBuffer(pcmArray.length, pcmArray[0].length, opus.sampleRate);
        for (let c = 0; c < pcmArray.length; c++) {
            aBuf.getChannelData(c).set(pcmArray[c]);
        }
        const aNode = context.createBufferSource();
        aNode.buffer = aBuf;
        aNode.connect(context.destination);

        const current_time = context.currentTime;
        
        if (current_time < time) {
            aNode.start(time);
            time += aNode.buffer.duration;
        } else {
            aNode.start(current_time);
            time = current_time + aNode.buffer.duration;
        }

        return {
            'time': time,
            'duration': aNode.buffer.duration
        };
    }
}