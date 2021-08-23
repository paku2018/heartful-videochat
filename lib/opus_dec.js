(function(self) {
    var decoder;
    var Module = {};

    const FastSound = require('fast-sound');
    FastSound({
        locateFile: file => {
            return "/node_modules/fast-sound/dist/" + file;
        }
    }).then(lib => {
        Module = lib;
        Module["getValue"] = getValue;
        self.postMessage({ type: 'ready' });
    });

    function getValue(ptr, type) {
        type = type || 'i8';
        if (type.charAt(type.length - 1) === '*') type = 'i32'; // pointers are 32-bit
        switch (type) {
            case 'i1':
                return Module.HEAP8[((ptr) >> 0)];
            case 'i8':
                return Module.HEAP8[((ptr) >> 0)];
            case 'i16':
                return Module.HEAP16[((ptr) >> 1)];
            case 'i32':
                return Module.HEAP32[((ptr) >> 2)];
            case 'i64':
                return Module.HEAP32[((ptr) >> 2)];
            case 'float':
                return Module.HEAPF32[((ptr) >> 2)];
            case 'double':
                return Module.HEAPF64[((ptr) >> 3)];
            default:
                abort('invalid type for setValue: ' + type);
        }
        return null;
    }

    function Decoder(sampleRate, channels) {
        this.channels = channels;
        var err = Module._malloc(4);
        this.handle = Module._opus_decoder_create(sampleRate, this.channels, err);
        var errNum = Module.getValue(err, "i32");
        Module._free(err);
        if (errNum != 0) {
            self.postMessage({
                type: 'error',
                error: errNum
            });
            return;
        }
        this.frameSize = sampleRate * 60 / 1000;
        var bufSize = 1275 * 3 + 7;
        var pcmSamples = this.frameSize * this.channels;
        this.bufPtr = Module._malloc(bufSize);
        this.pcmPtr = Module._malloc(4 * pcmSamples);
        this.buf = Module.HEAPU8.subarray(this.bufPtr, this.bufPtr + bufSize);
        this.pcm = Module.HEAPF32.subarray(this.pcmPtr / 4, this.pcmPtr / 4 + pcmSamples);
    }

    Decoder.prototype.decode = function(payload) {
        let pcmArray = [];
        let pcmLength = 0;
        let pos = 0;
        const view = new DataView(payload.buffer);
        while (pos < payload.byteLength) {
            const packet_size = view.getUint16(pos);
            pos += 2;
            //this.buf.set(new Uint8Array(payload.slice(pos, pos + packet_size)));
            this.buf.set(payload.slice(pos, pos + packet_size));
            pos += packet_size;

            var ret = Module._opus_decode_float(this.handle, this.bufPtr, packet_size, this.pcmPtr, this.frameSize, 0);
            if (ret < 0) {
                self.postMessage({
                    type: 'error',
                    error: ret
                });
                break;
            } else {
                const pcm = new Float32Array(this.pcm.subarray(0, ret * this.channels));
                pcmLength += pcm.length;
                pcmArray.push(pcm);
            }
        }
        if (pcmLength > 0) {
            // Flatten
            pos = 0;
            let pcmData = new Float32Array(pcmLength);
            pcmArray.forEach(function(pcm) {
                pcmData.set(pcm, pos);
                pos += pcm.length;
            });
            return pcmData;
        }
        return null;
    }

    Decoder.prototype.destroy = function() {
        Module._opus_decoder_destroy(this.handle);
        this.handle = null;
        this.buf = null;
        this.pcm = null;
    }

    // worker handler
    self.onmessage = e => {
        switch (e.data.type) {
            case 'init':
                decoder = new Decoder(e.data.config.sampleRate, e.data.config.channels);
                break;
            case 'decode':
                const data = decoder.decode(e.data.buffer);
                if (decoder.channels > 1) { // de-interleaved
                    let pcmArray = [];
                    for (let c = 0; c < decoder.channels; c++) {
                        let pcm = new Float32Array(data.length / decoder.channels);
                        for (let i = 0; i < data.length / decoder.channels; i++) {
                            pcm[i] = data[i * decoder.channels + c];
                        }
                        pcmArray.push(pcm);
                    }
                    self.postMessage({
                        type: 'data',
                        payload: pcmArray
                    });
                } else {
                    self.postMessage({
                        type: 'data',
                        payload: [data]
                    });
                }
                break;
            case 'destroy':
                decoder.destroy();
                break;
            default:
                self.postMessage(e.data);
        }
    }

})(self);