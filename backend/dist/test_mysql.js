import mysql from 'mysql2/promise';
async function test() {
    const configs = [
        { host: '127.0.0.1', user: 'root', password: '' },
        { host: 'localhost', user: 'root', password: '' },
        { host: '127.0.0.1', user: 'root', password: 'root' },
        { host: 'localhost', user: 'root', password: 'root' },
    ];
    for (const config of configs) {
        console.log(`Testing: ${config.user}@${config.host} (password: ${config.password ? 'YES' : 'NO'})`);
        try {
            const connection = await mysql.createConnection(config);
            console.log('✅ SUCCESS!');
            await connection.end();
            return;
        }
        catch (err) {
            console.error(`❌ FAILED: ${err.message}`);
        }
    }
}
test();
