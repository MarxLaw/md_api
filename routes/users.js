const { Router } = require('express');
const router = Router();
const mysqlConnection = require('../database/database');
module.exports = router;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();

//add users
router.put('/register', async function (req, res, next) {
    try {
        const hashed = await bcrypt.hash(req.body.password, 10);

        let sql, params, tableName;

        if (req.body.usertype === "caregiver") {
            tableName = "caregiver_account";
            sql = `
        INSERT INTO caregiver_account 
        (name_last, name_first, name_middle, email, username, password, date_updated, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW());
      `;
            params = [
                req.body.name_last,
                req.body.name_first,
                req.body.name_middle,
                req.body.email,
                req.body.username,
                hashed
            ];
        } else if (req.body.usertype === "patient") {
            tableName = "patient_account";
            sql = `
        INSERT INTO patient_account 
        (name_last, name_first, name_middle, email, username, password, FK_caregiverid, date_updated, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
      `;
            params = [
                req.body.name_last,
                req.body.name_first,
                req.body.name_middle,
                req.body.email,
                req.body.username,
                hashed,
                req.body.caregiver_id
            ];
        } else {
            return res.status(400).json({ message: "Invalid usertype" });
        }

        // Insert user
        const [result] = await mysqlConnection.promise().query(sql, params);
        const pkId = result.insertId;

        // Generate account_id = YYYYMMDD-PK
        const usertypeId = req.body.usertype === "caregiver" ? "1" : "2";
        const today = new Date();
        const yy = String(today.getFullYear()).slice(-2);
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const accountId = `${yy}${mm}${dd}${pkId}${usertypeId}`;

        // Update the row with account_id
        await mysqlConnection.promise().query(
            `UPDATE ${tableName} SET account_id = ? WHERE id = ?`,
            [accountId, pkId]
        );

        res.send({
            issuccess: result.affectedRows > 0 ? 1 : 0,
            primarykey: pkId,
            account_id: accountId
        });

    } catch (error) {
        res.status(500).send({ issuccess: 0, error: error.message });
    }
});


router.post('/login', async function (req, res, next) {
    const { username, password, usertype } = req.body;

    // Decide which table to query based on usertype
    let sql;
    if (usertype === "caregiver") {
        sql = "SELECT * FROM caregiver_account WHERE username = ?;";
    } else if (usertype === "patient") {
        sql = "SELECT * FROM patient_account WHERE username = ?;";
    } else {
        return res.status(400).json({ message: "Invalid usertype" });
    }

    const params = [username];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id },   // include usertype in payload if you want
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            userId: user.id,
            accountId: user.account_id,
            usertype,
            username: user.username,
            name_first: user.name_first,
            name_last: user.name_last
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





module.exports = router;
