
const { Client } = require('ssh2');

const config = {
    host: '82.29.157.61',
    port: 65002,
    username: 'u406992830',
    password: 'Noufal@2025'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec('ls -la public_html', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: \n' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
