const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = 7000;

// Daftar metode dan skrip terkait
const scripts = {
    brow: 'brow.js'
};

app.get('/api', (req, res) => {
    const key = req.query.key;
    const host = req.query.host;
    const portNumber = req.query.port;
    const time = req.query.time;
    const method = req.query.method;

    // Validasi dan logika pemrosesan
    if (key !== 'iki') {
        return res.status(401).json({ error: 'Invalid key' });
    }

    if (scripts[method]) {
        const scriptPath = path.join(__dirname, scripts[method]);
        console.log(`Running script with path: ${scriptPath}`);
        console.log(`Host: ${host}, Time: ${time}, Port: ${portNumber}`);

        // Menjalankan skrip dalam screen session dengan argumen host dan time
        const child = exec(`screen -dmS ${method}_session node ${scriptPath} ${host} ${time}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
            }
            res.json({
                key: key,
                host: host,
                port: portNumber,
                time: time,
                method: method,
                result: stdout || stderr
            });
        });

        // Menjadwalkan penghentian screen session setelah waktu habis
        setTimeout(() => {
            // Menghentikan sesi screen dengan nama yang terkait dengan metode
            exec(`pkill -f ${method}_session`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error killing screen session: ${error.message}`);
                } else {
                    console.log(`Screen session for method ${method} stopped after ${time} seconds`);
                }
            });
        }, time * 1000); // Mengonversi detik ke milidetik

    } else {
        res.status(400).json({
            key: key,
            host: host,
            port: portNumber,
            time: time,
            method: method,
            result: 'Unknown method'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
