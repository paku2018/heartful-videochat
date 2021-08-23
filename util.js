
module.exports = {
    createCode: function(type, length) {
        let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let cnt = 0;
        if(type == 0) {
            cnt = 36;
        } else if(type == 1) {
            cnt = 26;
        } else {
            cnt = 10;
        }
        let limit = 1;
        for(var i = 0; i < length; i ++) {
            limit = limit * cnt;
        }
        let random = Math.floor(Math.random() * limit);
        let code = '';
        for(var i = 0; i < length; i ++) {
            let remain = random % cnt;
            random = (random - remain) / cnt;
            if(cnt == 10) {
                code = code + remain;
            } else if(cnt == 26) {
                code = code + alphabet[remain];
            } else if(cnt == 36) {
                if(remain >= 26) {
                    code = code + (remain - 26);
                } else {
                    code = code + alphabet[remain];
                }
            }
        }
        return code;
    },

    getTwoDigit: function(value) {
        if(value < 10) {
            return '0' + value;
        }
        return value;
    },

    getCurrentDate: function() {
        let date = new Date();
        let year = date.getFullYear() - 2000;
        let month = date.getMonth() + 1;
        let day = date.getDate();
        return this.getTwoDigit(year) + this.getTwoDigit(month) + this.getTwoDigit(day);
    },

    getCurrentMonth: function() {
        let date = new Date();
        let year = date.getFullYear() - 2000;
        let month = date.getMonth() + 1;
        return this.getTwoDigit(year) + this.getTwoDigit(month);
    },

    createFile: async function(file) {
        let original_name = file.name;
        let extension = original_name.split('.').pop();
        let filename = new Date().getTime() + "." + extension;
        await file.mv('./uploads/' + filename);
        return filename;
    },
}
