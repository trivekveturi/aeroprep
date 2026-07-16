const { getUserStore } = require('../lib/UserStore');

(async () => {
  try {
    const store = getUserStore();
    const username = 'pilotpath';
    const password = 'Password123';
    const user = await store.findByUsername(username);
    console.log('findByUsername result:', user ? { id: user.id, username: user.username, displayName: user.displayName } : null);
    if (user) {
      const valid = await store.verifyPassword(user, password);
      console.log('verifyPassword result:', valid);
    }
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(1);
  }
})();
