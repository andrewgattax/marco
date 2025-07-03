const fs = require('fs');
const path = require('path');

// Path to store the session data
const SESSION_FILE_PATH = path.join(process.cwd(), 'data/telegram_session.json');

/**
 * Service to manage Telegram session persistence
 */
class SessionService {
    /**
     * Save a session string to persistent storage
     * @param {string} sessionString - The session string to save
     */
    saveSession(sessionString) {
        try {
            fs.writeFileSync(
                SESSION_FILE_PATH,
                JSON.stringify({ session: sessionString, timestamp: Date.now() }),
                'utf8'
            );
            console.log('Session saved successfully');
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    /**
     * Get the saved session string from persistent storage
     * @returns {string|null} The session string or null if not found
     */
    getSession() {
        try {
            if (fs.existsSync(SESSION_FILE_PATH)) {
                const data = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf8'));
                return data.session;
            }
            return null;
        } catch (error) {
            console.error('Error reading session:', error);
            return null;
        }
    }

    /**
     * Check if the session is expired based on a timestamp
     * @returns {boolean} True if the session is expired or doesn't exist
     */
    isSessionExpired() {
        try {
            if (fs.existsSync(SESSION_FILE_PATH)) {
                const data = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf8'));
                const now = Date.now();
                const sessionAge = now - data.timestamp;
                
                // Consider session expired after 30 days (in milliseconds)
                const expirationTime = 30 * 24 * 60 * 60 * 1000;
                
                return sessionAge > expirationTime;
            }
            return true; // No session file exists
        } catch (error) {
            console.error('Error checking session expiration:', error);
            return true; // Assume expired on error
        }
    }
}

// Export a singleton instance
module.exports = new SessionService();