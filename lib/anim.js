/*
export functions:
    play(url, numPlays?, playSpeed?) : png/webpファイルをフェッチして再生状態にする。
        - numPlays: 再生回数（指定しない場合はファイルの情報優先）
        - playSpeed: 再生速度倍率（デフォルト：1.0 オリジナル速度）
        - Promiseを返す。正常にロード＆パースが完了するとResolveされる。
    has(url) : urlがフェッチ済み？
    hasPlaying(url?) : 再生状態？（url指定しない場合はすべてのアニメーションで再生状態が１つあればtrue）
    draw(ctx,url?) : 描画。url指定しない場合はすべての再生状態のアニメーションを描画
    stop(url?) : 停止。url指定しない場合はすべての再生状態のアニメーションを停止
    delete(url?) ：削除。url指定しない場合はすべてのアニメーションを削除
    opacity(value) : 不透明度。すべてのアニメーション描画に影響する
*/
parseAPNG = require('apng-js').default;

function download(blob, name) {
    let link = document.createElement('a');
    link.download = name;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

function ParseWebP(buffer) {
    let _data = new DataView(buffer);
    let _webp = {
        createImages: function() {
            //download(this.frames[0].imageData, 'image.webp');
            return Promise.all(this.frames.map(function(frame) {
                if (frame.imageElement) return Promise.resolve();
                return new Promise((resolve, reject) => {
                    frame.imageElement = new Image(); // Image constructor
                    frame.imageElement.src = URL.createObjectURL(frame.imageData);
                    frame.imageElement.decode()
                        .then(() => {
                            URL.revokeObjectURL(frame.imageElement.src);
                            resolve();
                        })
                        .catch((error) => {
                            URL.revokeObjectURL(frame.imageElement.src);
                            reject(new Error("Image creation error"));
                        });
                });
            }));
        }
    };
    try {
        let offset = 0;
        while (offset < (_data.byteLength - 8)) {
            offset += chunk(offset);
        }
    } catch (e) { return e; }
    return _webp;

    function chunk(off) {
        const name = fourCC(off);
        const size = _data.getUint32(off + 4, true);
        //console.log('[', name, size, ']');
        off += 8;
        switch (name) {
            case 'RIFF':
                if (fourCC(off) !== 'WEBP') throw Error('Invalid WebP file header');
                return 12;
            case 'VP8X':
                const bits = _data.getUint8(off);
                if (!(bits & (1 << 1))) throw Error('Not an animated WebP');
                //
                _webp.width = (_data.getUint32(off + 4, true) & 0xfff) + 1;
                _webp.height = (_data.getUint32(off + 7, true) & 0xfff) + 1;
                _webp.numPlays = 0;
                _webp.playTime = 0;
                _webp.frames = [];
                break;
            case 'ANIM':
                //console.log('bgcolor', _data.getUint8(off + 0), _data.getUint8(off + 1), _data.getUint8(off + 2), _data.getUint8(off + 3));
                _webp.numPlays = _data.getUint16(off + 4, true);
                break;
            case 'ANMF':
                const bd = _data.getUint8(off + 15);
                const frame = {
                    left: (_data.getUint32(off + 0, true) & 0xfff) * 2,
                    top: (_data.getUint32(off + 3, true) & 0xfff) * 2,
                    width: (_data.getUint32(off + 6, true) & 0xfff) + 1,
                    height: (_data.getUint32(off + 9, true) & 0xfff) + 1,
                    delay: (_data.getUint32(off + 12, true) & 0xfff),
                    disposeOp: bd & (1 << 0),
                    blendOp: bd & (1 << 1),
                    imageData: makeBlob(buffer, off, size),
                    //imageElement: HTMLImageElement // image data rendered as HTML Image element.                
                };
                _webp.playTime += frame.delay;
                _webp.frames.push(frame);
                break;
            default:
                throw Error('Not an animated WebP');
        }
        return size + 8;
    }

    function fourCC(off) {
        const i = _data.getUint32(off);
        const c = String.fromCharCode;
        return c(i >>> 24) + c(i >>> 16 & 0xff) + c(i >>> 8 & 0xff) + c(i & 0xff);
    }

    function makeBlob(buffer, off, size) {
        const frameData = new Uint8Array(buffer, off + 16, size - 16);
        const header = new Uint8Array(buffer, 0, 30);
        const view = new DataView(header.buffer);
        view.setUint24 = function(off, v) {
            this.setUint8(off + 0, v & 0xff);
            this.setUint8(off + 1, v >>> 8 & 0xff);
            this.setUint8(off + 2, v >>> 16 & 0xff);
        }
        view.setUint32(4, 22 + frameData.byteLength, true);
        view.setUint8(20, view.getUint8(20) & ~(1 << 1)); // ~AnimBits
        view.setUint24(24, _data.getUint32(off + 6, true) & 0xfff); // canvasWidth
        view.setUint24(27, _data.getUint32(off + 9, true) & 0xfff); // canvasHeight
        let bb = [];
        bb.push(header);
        bb.push(frameData);
        return new Blob(bb, { 'type': 'image/webp' });
    }
}

let animMap = new Map();
let animAlpha = 1;
let animCtx;

function draw(ctx, now, anim) {
    if (anim.start >= 0) {
        let cur = (now - anim.start) * anim.speed / anim.frames[0].delay | 0;
        if (cur >= anim.frames.length) {
            if ((--anim.nloop) == 0) {
                // stop
                anim.start = -1;
                return;
            }
            anim.start = performance.now();
            cur %= anim.frames.length;
        }
        const frame = anim.frames[cur];
        ctx.drawImage(frame.imageElement, frame.left, frame.top);
    }
}

function animate(now) {
    if (animCtx) {
        window.requestAnimationFrame(animate);
        //console.log('animate', animMap.size, now);
        animCtx.fillRect(0, 0, animCtx.canvas.width, animCtx.canvas.height);
        animCtx.save();
        animCtx.globalAlpha = animAlpha;
        for (const anim of animMap.values()) draw(animCtx, now, anim);
        animCtx.restore();
    }
}

function setPlay(anim, numPlays, playSpeed) {
    anim.start = performance.now();
    anim.nloop = numPlays || anim.numPlays;
    anim.speed = playSpeed || 1;
}

async function loadPlay(url, numPlays, playSpeed) {
    await fetch(url)
        .catch(err => {
            throw Error('Fetch failed');
        })
        .then(res => {
            if (res.ok) return res.arrayBuffer();
            throw Error(url + ' not found');
        })
        .then(buffer => {
            const ext = url.slice((url.lastIndexOf(".") - 1 >>> 0) + 2);
            if (ext == 'png' || ext == 'apng') {
                const anim = parseAPNG(buffer);
                if (anim instanceof Error) {
                    throw anim;
                } else {
                    anim.createImages().then(() => {
                        setPlay(anim, numPlays, playSpeed);
                        animMap.set(url, anim);
                    });
                }
            } else if (ext == 'webp') {
                const anim = ParseWebP(buffer);
                if (anim instanceof Error) {
                    throw anim;
                } else {
                    anim.createImages().then(() => {
                        setPlay(anim, numPlays, playSpeed);
                        animMap.set(url, anim);
                        //console.log('loaded webp', anim);
                    });
                }
            } else {
                throw Error(url + ': not supported');
            }
        });
}

module.exports = {
    play: function(url, numPlays, playSpeed) {
        return new Promise((resolve, reject) => {
            if (animMap.has(url)) {
                const anim = animMap.get(url);
                setPlay(anim, numPlays, playSpeed);
                return resolve();
            } else {
                loadPlay(url, numPlays, playSpeed)
                    .then(() => {
                        return resolve();
                    })
                    .catch(e => {
                        return reject(e);
                    });
            }
        });
    },
    has: function(url) {
        return animMap.has(url);
    },
    hasPlaying: function(url) {
        if (url) {
            if (animMap.has(url)) return animMap.get(url).start >= 0;
            return false;
        }
        for (const anim of animMap.values()) {
            if (anim.start >= 0) return true;
        }
        return false;
    },
    draw: function(ctx, url) {
        const now = performance.now();
        ctx.save();
        ctx.globalAlpha = animAlpha;
        if (url) {
            if (animMap.has(url)) draw(ctx, now, animMap.get(url));
            else throw Error('Not found in animation map:' + url);
        } else {
            for (const anim of animMap.values()) draw(ctx, now, anim);
        }
        ctx.restore();
    },
    stop: function(url) {
        if (url) {
            if (animMap.has(url)) animMap.get(url).start = -1;
        } else {
            for (const anim of animMap.values()) {
                anim.start = -1;
            }
        }
        animCtx = undefined;
    },
    delete: function(url) {
        if (url) {
            if (animMap.has(url)) animMap.delete(url);
            else throw Error('Not found in animation map:' + url);
        } else {
            this.stop();
            animMap.clear();
        }
    },
    opacity: function(value) {
        animAlpha = value;
    },
    start: function(ctx) {
        if (animCtx === undefined) {
            animCtx = ctx;
            window.requestAnimationFrame(animate);
        }
    }
}