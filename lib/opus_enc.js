(function(self) {
    var encoder;
    var Module = {};

    const FastSound = require('fast-sound');
    FastSound({
        locateFile: file => {
            return "/node_modules/fast-sound/dist/" + file;
        }
    }).then(lib => {
        console.log("Library");
        console.log(lib);
        Module = lib;
        Module["getValue"] = getValue;
        Module["setValue"] = setValue;
        self.postMessage({ type: 'ready' });
    });

    function setValue(ptr, value, type) {
        type = type || 'i8';
        if (type.charAt(type.length - 1) === '*') type = 'i32'; // pointers are 32-bit
        switch (type) {
            case 'i1':
                Module.HEAP8[((ptr) >> 0)] = value;
                break;
            case 'i8':
                Module.HEAP8[((ptr) >> 0)] = value;
                break;
            case 'i16':
                Module.HEAP16[((ptr) >> 1)] = value;
                break;
            case 'i32':
                Module.HEAP32[((ptr) >> 2)] = value;
                break;
            case 'i64':
                (tempI64 = [value >>> 0, (tempDouble = value, (+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble) / 4294967296.0))), 4294967295.0)) | 0) >>> 0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296.0))))) >>> 0) : 0)], Module.HEAP32[((ptr) >> 2)] = tempI64[0], Module.HEAP32[(((ptr) + (4)) >> 2)] = tempI64[1]);
                break;
            case 'float':
                Module.HEAPF32[((ptr) >> 2)] = value;
                break;
            case 'double':
                Module.HEAPF64[((ptr) >> 3)] = value;
                break;
            default:
                abort('invalid type for setValue: ' + type);
        }
    }

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

    function Encoder(application, frameDuration, sampleRate, originalRate, channels, params) {
        var err,
            bufSize,
            outSize;

        if (application === void 0) {
            application = 2049;
        }
        if (frameDuration === void 0) {
            frameDuration = 20;
        }
        if (sampleRate === void 0) {
            sampleRate = 48000;
        }
        this.resampler = null;
        this.bufPos = 0;
        err = Module._malloc(4);

        this.frameSize = sampleRate * frameDuration / 1000;
        this.channels = channels;
        this.handle = Module._opus_encoder_create(sampleRate, channels, application, err);

        if (params && params.cbr) {
            this.setConfig(0, 4006); // 4006 = OPUS_SET_VBR_REQUEST
        }
        if (params && params.bitRate) {
            this.setConfig(params.bitRate, 4002); // 4002 = OPUS_SET_BITRATE_REQUEST
        }
        if (params && params.forceChannel) {
            this.setConfig(params.forceChannel, 4022); // 4022 = OPUS_SET_FORCE_CHANNELS_REQUEST
        }
        if (params && params.expertFrameduration) {
            this.setConfig(params.expertFrameduration, 4040); // 4040 = OPUS_SET_EXPERT_FRAME_DURATION_REQUEST
        }
        if (params && params.predictionDisabled) {
            this.setConfig(0, 4042); // 4042 = OPUS_SET_PREDICTION_DISABLED_REQUEST
        }

        if (Module.getValue(err, "i32") != 0) {
            self.postMessage({
                type: 'error',
                error: Module.getValue(err, "i32")
            });
            return;
        }
        if (sampleRate != originalRate) {
            try {
                this.resampler = new SpeexResampler(channels, originalRate, sampleRate)
            } catch (e) {
                self.postMessage({
                    type: 'error',
                    error: e
                });
                return;
            }
        }
        Module._free(err);
        bufSize = 4 * this.frameSize * this.channels;
        this.bufPtr = Module._malloc(bufSize);
        this.buf = Module.HEAPF32.subarray(this.bufPtr / 4, (this.bufPtr + bufSize) / 4);
        outSize = 1275 * 3 + 7;
        this.outPtr = Module._malloc(outSize);
        this.out = Module.HEAPU8.subarray(this.outPtr, this.outPtr + outSize);
    }
    Encoder.prototype.encode = function(samples) {
        var size,
            ret,
            packets = [];

        if (this.resampler) {
            try {
                samples = this.resampler.process(samples);
            } catch (e) {
                self.postMessage({
                    type: 'error',
                    error: e
                });
                return null;
            }
        }
        while (samples && samples.length > 0) {
            size = Math.min(samples.length, this.buf.length - this.bufPos);
            this.buf.set(samples.subarray(0, size), this.bufPos);
            this.bufPos += size;
            samples = samples.subarray(size);
            if (this.bufPos == this.buf.length) {
                this.bufPos = 0;
                ret = Module._opus_encode_float(this.handle, this.bufPtr, this.frameSize, this.outPtr, this.out.byteLength);
                if (ret < 0) {
                    self.postMessage({
                        type: 'error',
                        error: ret
                    });
                    break;
                }
                //result = (new Uint8Array(this.out.subarray(0, ret))).buffer;
                result = new Uint8Array(this.out.subarray(0, ret));
                packets.push(result);
            }
        }
        if (packets.length > 0) {
            let total = 0;
            packets.forEach(function(elem) { total += elem.length + 2; }); // +2 means +uint16 for each packet size

            const data = new Uint8Array(total);
            const view = new DataView(data.buffer);
            let pos = 0;
            packets.forEach(function(elem) {
                view.setUint16(pos, elem.length); // set packet size
                pos += 2;
                data.set(elem, pos);
                pos += elem.length;
            });
            return data;
        }
        return null;
    }
    Encoder.prototype.setBitrate = function(bitrate) {
        this.setConfig(bitrate, 4002); // 4002 = OPUS_SET_BITRATE_REQUEST
    }
    Encoder.prototype.setConfig = function(value, constantNum) {
        var location = Module._malloc(4);
        Module.setValue(location, value, "i32");
        Module._opus_encoder_ctl(this.handle, constantNum, location);
        Module._free(location);
    }
    Encoder.prototype.destroy = function() {
        Module._opus_encoder_destroy(this.handle);
        if (this.resampler) {
            this.resampler.destroy();
        }
        this.handle = null;
        this.buf = null;
        this.pcm = null;
    }

    var SpeexResampler = (function() {
        function SpeexResampler(channels, inRate, outRate, quality) {
            if (quality === void 0) {
                quality = 5;
            }
            this.handle = 0;
            this.inPtr = 0;
            this.outPtr = 0;
            this.inCapacity = 0;
            this.inLenPtr = 0;
            this.outLenPtr = 0;
            this.channels = channels;
            this.inRate = inRate;
            this.outRate = outRate;
            var errPtr = Module._malloc(4);
            this.handle = Module._speex_resampler_init(channels, inRate, outRate, quality, errPtr);
            if (Module.getValue(errPtr, "i32") != 0)
                throw "speex_resampler_init failed: ret=" + Module.getValue(errPtr, "i32");
            Module._free(errPtr);
            this.inLenPtr = Module._malloc(4);
            this.outLenPtr = Module._malloc(4);
        }
        SpeexResampler.prototype.process = function(input) {
            if (!this.handle)
                throw "disposed object";
            var samples = input.length;
            var outSamples = Math.ceil(samples * this.outRate / this.inRate);
            var requireSize = samples * 4;
            if (this.inCapacity < requireSize) {
                if (this.inPtr)
                    Module._free(this.inPtr);
                if (this.outPtr)
                    Module._free(this.outPtr);
                this.inPtr = Module._malloc(requireSize);
                this.outPtr = Module._malloc(outSamples * 4);
                this.inCapacity = requireSize;
            }
            var ret;
            Module.setValue(this.inLenPtr, samples / this.channels, "i32");
            Module.setValue(this.outLenPtr, outSamples / this.channels, "i32");
            if (input.buffer == Module.HEAPF32.buffer) {
                ret = Module._speex_resampler_process_interleaved_float(this.handle, input.byteOffset, this.inLenPtr, this.outPtr, this.outLenPtr);
            } else {
                Module.HEAPF32.set(input, this.inPtr >> 2);
                ret = Module._speex_resampler_process_interleaved_float(this.handle, this.inPtr, this.inLenPtr, this.outPtr, this.outLenPtr);
            }
            if (ret != 0)
                throw "speex_resampler_process_interleaved_float failed: " + ret;
            var ret_samples = Module.getValue(this.outLenPtr, "i32") * this.channels;
            return Module.HEAPF32.subarray(this.outPtr >> 2, (this.outPtr >> 2) + ret_samples);
        };
        SpeexResampler.prototype.destroy = function() {
            if (!this.handle)
                return;
            Module._speex_resampler_destroy(this.handle);
            this.handle = 0;
            Module._free(this.inLenPtr);
            Module._free(this.outLenPtr);
            if (this.inPtr)
                Module._free(this.inPtr);
            if (this.outPtr)
                Module._free(this.outPtr);
            this.inLenPtr = this.outLenPtr = this.inPtr = this.outPtr = 0;
        };
        return SpeexResampler;
    })();

    // worker handler
    self.onmessage = e => {
        switch (e.data.type) {
            case 'init':
                encoder = new Encoder(e.data.config.application, e.data.config.frameDuration, e.data.config.sampleRate,
                    e.data.config.originalRate, e.data.config.channels, e.data.config.params);
                break;
            case 'encode':
                let data;
                if (e.data.buffers.length > 1) { // to interleave (stereo)
                    const samples = new Float32Array(e.data.buffers[0].length * e.data.buffers.length);
                    for (let i = 0; i < e.data.buffers[0].length; i++) {
                        samples[i * e.data.buffers.length + 0] = e.data.buffers[0][i];
                        samples[i * e.data.buffers.length + 1] = e.data.buffers[1][i];
                    }
                    data = encoder.encode(samples);
                } else {
                    data = encoder.encode(e.data.buffers[0]);
                }
                if (data) {
                    self.postMessage({
                        type: 'data',
                        payload: data // Serialized Uint8Array
                    });
                }
                break;
            case 'destroy':
                encoder.destroy();
                break;
            case 'setBitrate':
                encoder.setBitrate(e.data.value);
                break;
            default:
        }
    }
})(self);