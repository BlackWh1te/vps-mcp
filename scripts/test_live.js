
const { SshClient } = require('./dist/ssh.js');
async function run() {
    console.log('Initiating Live E2E Audit on 93.188.206.63...');
    const client = new SshClient();
    try {
        await client.connect({ host: '93.188.206.63', port: 22, username: 'root', password: 'geBRpKz7b6PO21B5f4' });
        console.log('? Connected.');
        const r1 = await client.executeCommand('whoami && pwd', false);
        console.log('Test 1 (whoami):', r1.stdout.trim());
        console.log('? E2E Complete.');
    } catch (e) { console.error('? Error:', e); } finally { client.disconnect(); }
}
run();

