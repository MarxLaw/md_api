const mysql = require('mysql2');

const mysqlConnection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: 'nairda',
    // //database: 'konsulta'
    // database: 'marketingdb',
    // port: '3308'


    host: 'localhost',
    user: 'root',
    password: 'p@ssw0rd',
    database: 'patient_app'
});

mysqlConnection.connect(function (error) {
    if (error) {
        console.log(error);
        return;
    }
    else {
        console.log('Database is connected');
    }
});

module.exports = mysqlConnection;