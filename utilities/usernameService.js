const fs = require('node-fs').promises;
let usernamesMap = new Map();
let isLoading = false;
let isInitialized = false;

async function initMap() {
    if (isInitialized || isLoading) return;

    isLoading = true;
    try {
        const data = await fs.readFile('data/usernameMap.json', 'utf8');
        const usernames = JSON.parse(data);
        usernamesMap = new Map(Object.entries(usernames));
        isInitialized = true;
    } catch (error) {
        console.error('Error loading usernames:', error);
    } finally {
        isLoading = false;
    }
}


async function getUsername(user) {
    if(!isInitialized) await initMap();
    if (usernamesMap.has(user.id)) {
        return usernamesMap.get(user.id);
    }
    return user.username;
}

async function addUsername(user, username) {
    if(!isInitialized) await initMap();
    usernamesMap.set(user.id, username);
    console.log(usernamesMap);
    await fs.writeFile('data/usernameMap.json', JSON.stringify(Object.fromEntries(usernamesMap)), 'utf8');
}

module.exports = {
    getUsername,
    addUsername
}