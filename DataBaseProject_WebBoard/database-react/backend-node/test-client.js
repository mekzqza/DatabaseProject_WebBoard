const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT ? Number(process.env.PORT) : 8080,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: raw, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT ? Number(process.env.PORT) : 8080,
      path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: raw ? JSON.parse(raw) : null, headers: res.headers }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: raw, headers: res.headers }); }
      });
    });
    req.on('error', (e) => reject(e));
    req.end();
  });
}

(async () => {
  try {
    const username = 'tc_user_' + Date.now();
    const password = 'Pwd12345!';
    const email = username + '@example.com';
    console.log('Registering', username);
    const reg = await postJson('/api/register', { username, password, email });
    console.log('Register response:', reg.statusCode, JSON.stringify(reg.body));

    console.log('Logging in');
    const login = await postJson('/api/login', { username, password });
    console.log('Login response:', login.statusCode, JSON.stringify(login.body));

    const token = login.body && login.body.token;
    if (!token) {
      console.error('No token returned, aborting test');
      process.exit(1);
    }

    console.log('Creating a thread using token');
    const threadPayload = { title: 'Test from test-client', content: 'Hello from automated client', category_id: 1 };

    // POST with Authorization header (use http.request manually)
    const payload = JSON.stringify(threadPayload);
    const options = {
      hostname: 'localhost', port: process.env.PORT ? Number(process.env.PORT) : 8080,
      path: '/api/threads', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + token
      }
    };

    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (c) => raw += c);
        res.on('end', () => {
          try { console.log('Create thread response:', res.statusCode, JSON.parse(raw)); }
          catch (e) { console.log('Create thread response raw:', res.statusCode, raw); }
          resolve();
        });
      });
      req.on('error', (e) => { console.error('Request error', e); reject(e); });
      req.write(payload);
      req.end();
    });

    console.log('Fetching threads');
    const threads = await getJson('/api/threads');
    console.log('Threads:', threads.statusCode, threads.body && JSON.stringify(threads.body).slice(0, 1000));

    console.log('Test client done');
  } catch (err) {
    console.error('Test client error', err);
    process.exit(1);
  }
})();

