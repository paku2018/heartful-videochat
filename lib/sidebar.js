module.exports = {
    open_side: function() {
        _sidebar.style.width = document.body.clientWidth * 0.75;
        _sidebar.style.padding = "10px";
    },

    close_side: function() {
        _sidebar.style.width = "0";
        _sidebar.style.padding = "0";
    },
    store: function() {
        const elements = [
            "_txt_speech",
            "_txt_gender_male",
            "_txt_gender_famale",
            "_txt_language",
            "_txt_name",
            "_txt_text",
            "_transcribe",
            "_music_volume",
        ];

        const path = location.pathname;
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const value = (element.type == 'radio' || element.type == 'checkbox') ? element.checked : element.value;
                document.cookie = id + '=' + value + '; path=' + path;
            }
        });
    },
    restore: function() {
        const cookies = document.cookie.split('; ');
        cookies.forEach((cookie) => {
            const pair = cookie.split('=');
            const element = document.getElementById(pair[0]);
            if (element) {
                if (element.type == 'radio' || element.type == 'checkbox') {
                    element.checked = pair[1] == 'true' ? true : false;
                } else {
                    element.value = pair[1];
                }
            } else if (pair[0] != 'uuid') {
                document.cookie = pair[0] + "=; Max-Age=0";
            }
        });
    },
}