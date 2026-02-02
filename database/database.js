const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
