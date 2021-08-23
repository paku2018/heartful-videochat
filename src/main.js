const ws0 = Core.worker();
const ws1 = Core.worker();

window.onload = () => {
    Core.init(ws0, ws1);
    console.log(location.origin);
    Core.connect(location.origin);

}

ws0.onmessage = e => {
    switch (e.data.type) {
        case 'api':
            let json = e.data.content;
            if(json.status == 2) {
                let info = json.info;
                localStorage.setItem("sougi-camera-port", info.port);
                localStorage.setItem("sougi-camera-id", info.id);
                localStorage.setItem("sougi-camera-mobile", _mobile.value);
                window.location.href = '/camera.html';
            } else if(json.status == 1) {
                let info = json.info;
                localStorage.setItem("sougi-manage-id", info.id);
                localStorage.setItem("sougi-manage-port", info.port);
                let camera_arr = [];
                if(info.camera_first_id > 0) {
                    camera_arr.push(info.camera_first_id);
                }
                if(info.camera_second_id > 0) {
                    camera_arr.push(info.camera_second_id);
                }
                if(info.camera_third_id > 0) {
                    camera_arr.push(info.camera_third_id);
                }
                localStorage.setItem("sougi-manage-camera", camera_arr);
                localStorage.setItem("sougi-manage-name", info.surname + " " + info.name);
                window.location.href = '/manage.html';
            }
            break;
        default:
            //console.error("ws0 unkown msg:", e.data);
    }
}

async function add_mobile() {

    let mobile = _mobile.value;
    console.log(mobile);
    _ws0.postMessage({
        type: 'api',
        method: 'channel',
        path: 'get_detail',
        body: {
            mobile: mobile
        }
    });


}