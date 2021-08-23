const mysql = require('mysql');
const util = require( 'util' );

var mysqlConnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'sougi',
    multipleStatements : true,
    timezone: 'Asian/Tokyo'
});

mysqlConnection.connect((err) => {
    if(!err) {
        console.log("Connection success");
    } else {
        console.log("Connection failed");
    }
});

module.exports = {
    makeDb: function() {
        const connection = mysqlConnection;
        return {
            query( sql, args ) {
                return util.promisify( connection.query )
                    .call( connection, sql, args );
            },
            close() {
                return util.promisify( connection.end ).call( connection );
            }
        };
    }
}