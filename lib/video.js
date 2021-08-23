let mjpeg;
module.exports = {
    worker: function() {
        if (mjpeg === undefined) {
            mjpeg = new Worker('dist/worker_mjpeg.js');
        }
        return mjpeg;
    },
    frame: function(canvas, quality) {
        const dataurl = _canvas.toDataURL('image/jpeg', quality);
        const bstr = atob(dataurl.split(",")[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        mjpeg.postMessage({
            type: 'frame',
            payload: u8arr
        });
    },
    encode: function(fps) {
        mjpeg.postMessage({
            type: 'encode',
            fps: fps
        });
    },
    decode: function(payload) {
        mjpeg.postMessage({
            type: 'decode',
            payload: payload
        });
    },
    play: function() {
        mjpeg.postMessage({ type: 'play' });
    },
}