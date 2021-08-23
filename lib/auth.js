/*
export functions:

*/

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    async checkPassword(original_password, db_password) {
        const match = await bcrypt.compare(original_password, db_password);
        return match;
    },
    createPassword(original_password) {
        const saltRounds = 10;
        const hash = bcrypt.hashSync(original_password, saltRounds);
        return hash;
    },
    getAuthSecret() {
        return 'sougi_secret';
    },
    getAccessToken(type, user_id) {
        return jwt.sign({ id: user_id,  type: type }, this.getAuthSecret());
    }
}
