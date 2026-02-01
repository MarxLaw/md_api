

const { Router } = require('express');
const router = Router();
const mysqlConnection = require('../database/database');


// Get caregiver medicines
router.get('/test', (req, res) => {
    res.send('Medicine route is working');
});
// medicine.js
router.put('/addmedicine', async (req, res) => {
    try {
        const {
            patient_id,
            generic_name,
            brand_name,
            dosage,
            form,
            times,
            start_date,
            end_date,
            stock,
            alarm_enabled,
        } = req.body;

        const sql = `INSERT INTO medicine 
      (name_generic, name_brand, dosage, form, time, date_start, date_end, stock, is_alarm, FK_patient, date_updated, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());`;

        const params = [
            generic_name,
            brand_name,
            dosage,
            form,
            JSON.stringify(times),
            start_date,
            end_date,
            stock,
            alarm_enabled,
            patient_id,
        ];

        const [result] = await mysqlConnection.promise().query(sql, params);

        res.json({ success: true, id: result.insertId, message: "Medicine inserted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});


router.post('/caregivermedicine', async function (req, res, next) {
    const sql = "SELECT * FROM medicine WHERE FK_patient = ?;";
    const params = [req.body.patient_id];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            res.status(404).json({ error: 'No data found' });
            return;
        }

        const result = rows.map(row => {
            let parsedTimes;
            try {
                // Check if row.time is already an object (some MySQL drivers auto-parse JSON)
                if (typeof row.time === 'object') {
                    parsedTimes = row.time;
                } else if (typeof row.time === 'string') {
                    // Trim whitespace and parse
                    parsedTimes = JSON.parse(row.time.trim());
                } else {
                    parsedTimes = [];
                }
            } catch (parseError) {
                console.error('Error parsing time for row:', row.id, 'Value:', row.time);
                parsedTimes = []; // Default to empty array
            }

            return {
                patient_id: row.FK_patient,
                generic_name: row.name_generic,
                brand_name: row.name_brand,
                dosage: row.dosage,
                form: row.form,
                times: parsedTimes,
                start_date: row.date_start,
                end_date: row.date_end,
                stock: row.stock,
                alarm_enabled: row.is_alarm,
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Get caregiver's patients

router.post('/searchpatient', async function (req, res, next) {
    const sql = "SELECT * FROM patient_account WHERE account_id = ?;";
    const params = [req.body.account_id];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            res.status(404).json({ error: 'No data found' });
            return;
        }

        const result = rows.map(row => ({
            patient_id: row.id,
            account_id: row.account_id,
            name_last: row.name_last,
            name_first: row.name_first,
            name_middle: row.name_middle,
            email: row.email,
            username: row.username,
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/fetchpatient', async function (req, res, next) {
    const sql = "SELECT * FROM patient_account WHERE FK_caregiverid = ?;";
    const params = [req.body.account_id];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            res.status(404).json({ error: 'No data found' });
            return;
        }

        const result = rows.map(row => ({
            patient_id: row.id,
            account_id: row.account_id,
            fk_caregiverid: row.FK_caregiverid,
            name_last: row.name_last,
            name_first: row.name_first,
            name_middle: row.name_middle,
            email: row.email,
            username: row.username,
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/myprofile', async function (req, res, next) {

    const { account_id, usertype } = req.body;
    let sql;
    if (usertype === "caregiver") {
        sql = "SELECT * FROM caregiver_account WHERE account_id = ?;";
    } else if (usertype === "patient") {
        sql = `SELECT 
            patient_account.*,
            CONCAT(
                caregiver_account.name_first, 
                ' ', 
                caregiver_account.name_last
                ) AS caregiver_name
            FROM patient_account
            LEFT JOIN caregiver_account 
            ON patient_account.account_id = caregiver_account.account_id
            WHERE patient_account.account_id = ?;`;
    } else {
        return res.status(400).json({ message: "Invalid usertype" });
    }
    const params = [account_id];
    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            res.status(404).json({ error: 'No data found' });
            return;
        }

        const result = rows.map(row => ({
            patient_id: row.id,
            account_id: row.account_id,
            caregiver_name: row.caregiver_name,
            name_last: row.name_last,
            name_first: row.name_first,
            name_middle: row.name_middle,
            email: row.email,
            username: row.username,
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/fetchrequest', async function (req, res, next) {
    const sql = `SELECT * FROM request 
                left join caregiver_account on 
                caregiver_account.account_id = request.FK_caregiver 
                WHERE FK_patient = ?  AND status = 0;`;
    const params = [req.body.patient_id];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            res.status(404).json({ error: 'No data found' });
            return;
        }

        const result = rows.map(row => ({
            id: row.request_id,
            patient_id: row.FK_patient,
            caregiver_id: row.FK_caregiver,
            caregiver_name: `${row.name_first} ${row.name_last}`,
            status: row.status,
            created_at: row.date_request,
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/acceptrequest', async function (req, res, next) {
    const sql = "UPDATE request SET `status` = '1' WHERE request_id = ?;";
    const sql2 = "UPDATE patient_account SET FK_caregiverid = ? WHERE account_id = ?;";
    const params = [req.body.request_id];
    const params2 = [req.body.caregiver_id, req.body.patient_id];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            // No existing request
            return res.json({ success: false });
        }

        const [rows2] = await mysqlConnection.promise().query(sql2, params2);
        // Request exists
        return res.json({ success: true, data: rows2 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/checkrequest', async function (req, res, next) {
    const sql = "SELECT * FROM request WHERE FK_patient = ? AND FK_caregiver = ?";
    const params = [req.body.patient_id, req.body.caregiver_id, req.body.status];

    try {
        const [rows] = await mysqlConnection.promise().query(sql, params);

        if (rows.length === 0) {
            // No existing request
            return res.json({ exists: false });
        }

        // Request exists
        return res.json({ exists: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.put('/sendrequest', async function (req, res, next) {
    try {

        const checkSql = "SELECT * FROM request WHERE FK_patient = ? AND FK_caregiver = ? AND status = ?";
        const [rows] = await mysqlConnection.promise().query(checkSql, [req.body.patient_id, req.body.caregiver_id, req.body.status]);

        if (rows.length > 0) {
            return res.status(400).send({
                issuccess: 0,
                message: "Request already exists",
            });
        }

        const sql = "INSERT INTO request (`FK_patient`, `FK_caregiver`, `status`, `date_request`, `timestamp`) VALUES (?, ?, ?, NOW(), NOW());";
        const params = [req.body.patient_id, req.body.caregiver_id, req.body.status];

        const [pk, message] = await mysqlConnection.promise().query(sql, params);

        const result = {
            issucces: (pk == 0 ? 0 : 1),
            primarykey: pk,
            error: message
        };

        res.send(result);

    } catch (error) {
        // Always send a response on error
        res.status(500).send({ issucces: 0, error: error.message });
    }
});

// DELETE request route
router.delete('/deleterequest', async function (req, res) {
    try {

        const sql = "DELETE FROM request WHERE FK_patient = ? AND FK_caregiver = ?";
        const params = [req.body.patient_id, req.body.caregiver_id];

        const [result] = await mysqlConnection.promise().query(sql, params);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "Request deleted successfully" });
        } else {
            res.status(404).json({ success: false, message: "No request found to delete" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// router.post('/caregiver', async function (req, res) {
//     try {


//         const sql = `SELECT * FROM caregiver_account`;

//         const params = [
//         ];

//         const [dataArray] = await conn.query(sql, params);

//         var result = [];

//         for (var row of dataArray) {
//             const entry = {
//                 caregiver_id: row.caregiver_id,
//                 cg_account_id: row.cg_account_id,
//                 name_last: row.name_last,
//                 name_first: row.name_first,
//                 name_middle: row.name_middle,
//                 email: row.email,
//                 username: row.username,
//             };
//             result.push(entry);
//         }

//         res.send(result);

//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: 'Internal Server Error' });
//     }
// });


module.exports = router;
