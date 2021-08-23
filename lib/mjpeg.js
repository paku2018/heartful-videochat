//
// mjpeg worker
//
(function(self) {
    let totalSize = 0;
    let frames = [];
    let packets = [];//new Array(4);
    let pos_i = 0;
    let pos_o = 0;

    async function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }

    async function entry(data) {
        frames.push(data);
        totalSize += data.byteLength + 4;
    }

    async function encode(fps) {
        const data = new Uint8Array(totalSize + 4);
        const view = new DataView(data.buffer);
        let offset = 0;
        view.setUint32(offset, fps);
        offset += 4;
        frames.forEach((frame) => {
            view.setUint32(offset, frame.byteLength);
            offset += 4;
            data.set(frame, offset);
            offset += frame.byteLength;
        });
        frames = [];
        totalSize = 0;
        postMessage({
            type: 'data',
            payload: data
        })
    }

    async function play(packet) {
        const view = new DataView(packet);
        const data = new Uint8Array(packet);
        let frame = 0;
        let offset = 0;
        self.fps = view.getUint32(offset);
        offset += 4;
        while (offset < packet.byteLength) {
            const size = view.getUint32(offset);
            offset += 4;
            const buffer = data.slice(offset, offset + size);
            offset += size;
            postMessage({
                type: 'frame',
                frame: frame,
                blob: new Blob([buffer], {
                    type: "image/jpeg"
                })
            });
            frame++;
            await sleep(1000.0 / self.fps);
        }
        postMessage({type: 'ended'});
    }


    // worker handler
    self.onmessage = e => {
        switch (e.data.type) {
            case 'frame':
                entry(e.data.payload);
                break;
            case 'encode':
                encode(e.data.fps);
                break;
            case 'decode':
                packets.push(e.data.payload.buffer);
                //packets[pos_i++] = e.data.payload.buffer;
                //pos_i %= packets.length;
                break;
            case 'play':
                if(packets.length > 0) {
                    let data = packets[0];
                    packets.shift();
                    play(data);
                }
                //play(packets[pos_o++]);
                //pos_o %= packets.length;
                break;
        }
    }

})(self);