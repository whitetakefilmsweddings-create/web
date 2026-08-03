const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');

class SimpleDriveFile {
  constructor(data) {
    this.data = data;
  }
  getId() { return this.data.id || ''; }
  getName() { return this.data.name || ''; }
  getMimeType() { return this.data.mimeType || ''; }
  getThumbnailLink() { return this.data.thumbnailLink || ''; }
  getWebViewLink() { return this.data.webViewLink || ''; }
  getWebContentLink() { return this.data.webContentLink || ''; }
}

class GoogleDrive {
  constructor() {
    this.apiKey = 'AIzaSyAxoP_13cWEwsr0jzH4Tj51yWPe7f-SNEQ'; // Fallback
    this.accessToken = null;
    this.tokenExpiry = 0;
    this.endpoint = 'https://www.googleapis.com/drive/v3/files';
    this.authEndpoint = 'https://oauth2.googleapis.com/token';
    this.tryLoadServiceAccount();
  }

  tryLoadServiceAccount() {
    // 1. Try loading from file (local dev)
    const keyFile = path.join(__dirname, '../Admin/config/service_account.json');
    if (fs.existsSync(keyFile)) {
      try {
        this.creds = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        return;
      } catch (err) {
        console.error('Failed to parse service_account.json:', err);
      }
    }
    // 2. Fall back to environment variable (production server)
    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      try {
        this.creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        return;
      } catch (err) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT env var:', err);
      }
    }
    // 3. Embedded Base64 fallback (for production hosting)
    try {
      const b64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAid2ViMjAyNi00ODUyMDciLAogICJwcml2YXRlX2tleV9pZCI6ICIxMzM0NjIzZDBlNWFjYTljNzBlNDMwNzY4YmYwODlmNGJjNTc2ZjQxIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUURFdys2NXZneFF5cTk4XG5MTFlVcWVsRjMzMlN3eTJUT0J1bnFpblRiRzNpTTkvM1lOVWdPTXlTbndtSHBVNzRqVDZEc0RCTDQ4bWtqbG9xXG5IemJKcjFkd2hEL3FET1dxbVNDMXEyNXBsWTRBWDdmbE9kWWpkR0tEZjQxWlcwdFdWdlBRQTRHQ1dBdWJ2QXZ4XG5iMkRGT3F4Sm04RXp6TTYxOHZNQU04ZHdVSElhZlQzMkdoTEhjcTF0Qk5LVjBPVy9RRzFHbVgyOFUrZXM1dG5lXG5ZeXhlWkxUZFY4RXZOVythV2I3TWpLYW9BcEdDdVJoWEkzWnpiTEtEOURxT29USHpxMm9keUdGak5sRDdkejlCXG4xQ3hmSUNsNnlQMEV4SFR6b2ZqckwzMUtKTHd3YWxsWFBsRi9BdHJQb01hU3RmWTlCcUVlZERIUVpndjIzTnc5XG5MTERNOTRxTEFnTUJBQUVDZ2dFQUZQQWI1Zm10RDN4L1Q2YmxyMExrdHZ5UkVtakxpajF2dXBmaHdJVHF3bnN1XG5WaXdnaHhVVU5uYWtTY3krU21ENVZJTzU5L0ZpMTljVllzMi9Ma0lHME1za2pxV0AWNkYvZUxyU2ZTWWV5TGU4XG5JVnZXQjNWNTREQUJYTG9FR25RV21MMkVHVmlBejduTnlZdHhFRHZEUnAxRGpMSzZ2UTRxYStIci9lM0ppVHVOXG5HcjczUXFVM21FMVNvNmN4WGkyQ2xFZmE3bGdOdDNEVWlMWDlTT3N1bWZIS2tmTnV0cGZvM1BCUm9GV200Q1RlXG5IeFZXU0t3MXlYaCtVZGNwdzFjYkt2Q0dmZkJFSTE1Z1JqNWx1MmEvMWY2eG9XVjlzelk5TUJSaGV5K0FvbWtCXG52UHNzTDJhcmJmeHZNdVZBOXB3a2gyLzN4elozUGpwdDZTaGI1QlZ5VlFLQmdRRG1WVUk5eDhqY2E4T1lnd2x1XG5kOEY3NmNPZHpNK3VZKzMzallneWFJMkhnaUlYS01jRmZ6c3lyaXdqanl0bHBnYnJDR0M2TVJBaWlpNCtnc1pIXG5POFBJdE44U3NETTAydUcvUFhUQ3QyQkZ4M0d1VVNNOWw5ZERTOXBPdG1vWklKUzl1V1NVNGhvNVozSFpuTUN2XG5PVG8xT1E2WDYxSTUwUWlnV05PM3dCcDlYUUtCZ1FEYXNSV0czRGpURW5aQk1JbWwxakw0a0xIbm5OWkNYdUt6XG5ZZUFHSlJSazdDT3FCYmkwN2ZCTzZ5NGIxZ24yVjU1RDJUdTg4MEV4QkJpNHA4TjJYVFBaZjdzZVEzYWtNNGYvXG5qby91SWNhaW1FeEVDTlVLQ01jSHNQVGN3ZFh4VEJ4bXM1ZHBEaUxBcThBazliN25vM2NMVmxBVGF4WHJ5Qmx5XG4rZXFOSy9mQkJ3S0JnRk4ycVo1QmV1T0VtVWYyazhCWDNPRE9BSGg1OHZlNmRreXlHSnhManAxLzVtS0dBRGhaXG50bFhURDJPRFNiSjN5eUgzMHpVaytqZko0cC84TzJVc252Rm51VDNJWTRYUG11WDFtdzNEN1RyYjNySFA3UGt3XG53R3crWEVrUmlMaTZPYXZXTmtCTS9qdTI1R1o2aXNmejhNZkFlUzFMdEd3Rzl4MURrdFNPNUFweEFvR0JBTkt3XG5scisxdlIxRkJSN3JCMEg1S21RazZ2RHNQZFAxbkUwYjkzdVVENkRuaTdpTENKZHZRUHlYUVhYWjhRRWZDci90XG5Nc3RvUkI5WUJnVW93M3h1Y0x5VGZZKzdpVHJLMXJSVUFjQjNVK3BqOWQzNThGMVpkWDZvY2srWWcyaVVYaXhuXG55M0NRQ05VODRzSDQ2L0k0bjBFUjU5Vzlib0lZNXNQSm1McG5hS3JUQW9HQkFMMEJXZDRjSmRlS3JRbXhUdmlpXG5PSXJuVldQR0ZqQ2VRWHRiVXhtNlltV0kyWktYaVpVZW4zQ0FXODZJL3pXNG9Nd3dXOUNBQ0VPR2E1Ly8yYXBaXG5FOXBNMkRJNnl6V3JLQU9RbDZ2Q1FyQlIrc1k4TVcrSzUwTFg0bU5XQkZCWklMaXhpUHdaZ0J5TDlPcGd3MEloXG5jNk84VTJzTE1wbmIxUFZIQzkyKzdFMU9cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJhdWRpdC1hZG1pbkB3ZWIyMDI2LTQ4NTIwNy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTI2MDQ4NTY1NzExNzk1ODQ5MjYiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2F1ZGl0LWFkbWluJTQwd2ViMjAyNi00ODUyMDcuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K";
      this.creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    } catch (err) {
      console.error('Failed to load Base64 service account fallback:', err);
    }
  }


  async authenticateServiceAccount() {
    if (!this.creds) {
      throw new Error('Service account credentials not found. Add GOOGLE_SERVICE_ACCOUNT to .env on the server.');
    }
    const now = Math.floor(Date.now() / 1000);
    // Reuse token if still valid for next 5 minutes
    if (this.accessToken && this.tokenExpiry > now + 300) {
      return;
    }

    const payload = {
      iss: this.creds.client_email,
      sub: this.creds.client_email,
      aud: this.authEndpoint,
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/drive'
    };

    const token = jwt.sign(payload, this.creds.private_key, { algorithm: 'RS256' });

    try {
      const response = await axios.post(this.authEndpoint, new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      }));

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = now + response.data.expires_in;
      } else {
        throw new Error('Google Auth: No access token in response');
      }
    } catch (err) {
      const detail = err.response?.data?.error_description || err.response?.data?.error || err.message;
      console.error('Google Auth Token exchange failed:', detail);
      throw new Error(`Google Drive authentication failed: ${detail}`);
    }
  }

  // Silent version — used by read operations so they can fall back to API key
  async tryAuthenticateServiceAccount() {
    try {
      await this.authenticateServiceAccount();
    } catch (err) {
      // Silently fall back to API key for reads
    }
  }

  async request(url, method = 'GET', body = null, responseType = 'json') {
    await this.tryAuthenticateServiceAccount();
    const headers = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const options = {
        method,
        url,
        headers,
        responseType
      };
      if (body) {
        options.data = body;
      }
      const res = await axios(options);
      return { code: res.status, data: res.data, error: null };
    } catch (err) {
      return {
        code: err.response?.status || 500,
        data: err.response?.data || null,
        error: err.message
      };
    }
  }

  async getFiles(folderId) {
    const files = [];
    let pageToken = null;

    do {
      const params = {
        pageSize: 1000,
        fields: 'nextPageToken, files(id, name, mimeType, webContentLink, webViewLink, thumbnailLink)',
        q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'zip') and trashed = false`,
        orderBy: 'folder, name'
      };

      if (!this.accessToken) {
        params.key = this.apiKey;
      }
      if (pageToken) {
        params.pageToken = pageToken;
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `${this.endpoint}?${queryString}`;
      
      const res = await this.request(url);
      if (res.error) throw new Error(`Google API request error: ${res.error}`);
      
      const json = res.data;
      if (res.code !== 200) {
        const msg = json?.error?.message || 'Unknown API Error';
        throw new Error(`Google API Error (${res.code}): ${msg}`);
      }

      if (json && json.files && Array.isArray(json.files)) {
        for (const fileData of json.files) {
          files.push(new SimpleDriveFile(fileData));
        }
      }
      pageToken = json.nextPageToken || null;
    } while (pageToken);

    return files;
  }

  async getFilesByIds(fileIds) {
    const files = [];
    if (!fileIds || fileIds.length === 0) return files;

    const batchSize = 25;
    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(id => this.getFileMetadata(id))
      );
      for (const f of results) {
        if (f) files.push(f);
      }
    }
    return files;
  }

  async getAllFilesRecursive(folderId) {
    let allFiles = [];
    const files = await this.getFiles(folderId);
    const subfolderPromises = [];
    
    for (const file of files) {
      if (file.getMimeType() === 'application/vnd.google-apps.folder') {
        subfolderPromises.push(this.getAllFilesRecursive(file.getId()));
      } else {
        allFiles.push(file);
      }
    }
    
    const subfolderResults = await Promise.all(subfolderPromises);
    for (const subFiles of subfolderResults) {
      allFiles = allFiles.concat(subFiles);
    }
    
    return allFiles;
  }

  async deleteFile(fileId) {
    await this.authenticateServiceAccount();
    if (!this.accessToken) {
      throw new Error('Deletion requires a Service Account. Please configure service_account.json');
    }

    // "Soft Delete" strategy via Move to _TRASH_ folder
    const meta = await this.getFileMetadataRaw(fileId);
    if (!meta || !meta.parents || meta.parents.length === 0) {
      throw new Error('Could not fetch file metadata or parents.');
    }
    const parentId = meta.parents[0];

    const trashFolderId = await this.ensureTrashFolder(parentId);
    if (!trashFolderId) {
      throw new Error('Could not create/find _TRASH_ folder.');
    }

    const url = `${this.endpoint}/${fileId}?addParents=${trashFolderId}&removeParents=${parentId}`;
    const res = await this.request(url, 'PATCH');

    if (res.code === 200) {
      return true;
    }

    const msg = res.data?.error?.message || 'Unknown API Error';
    throw new Error(`Move Failed (${res.code}): ${msg}`);
  }

  async getFileMetadataRaw(fileId) {
    const url = `${this.endpoint}/${fileId}?fields=id,parents,name`;
    const res = await this.request(url);
    if (res.code !== 200) return null;
    return res.data;
  }

  async ensureTrashFolder(parentId) {
    const q = `'${parentId}' in parents and name = '_TRASH_' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `${this.endpoint}?q=${encodeURIComponent(q)}`;
    const res = await this.request(url);
    
    if (res.code === 200 && res.data && res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // Create it
    const metadata = {
      name: '_TRASH_',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    await this.authenticateServiceAccount();
    const createRes = await axios.post(this.endpoint, metadata, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return createRes.data?.id || null;
  }

  async getFileMetadata(fileId) {
    let url = `${this.endpoint}/${fileId}?fields=id,name,mimeType,webContentLink,webViewLink,thumbnailLink`;
    if (!this.accessToken) {
      url += `&key=${this.apiKey}`;
    }
    
    const res = await this.request(url);
    if (res.code !== 200) return null;
    return new SimpleDriveFile(res.data);
  }

  async createFolder(name, parentId) {
    await this.authenticateServiceAccount();
    if (!this.accessToken) {
      throw new Error('Creation requires a Service Account.');
    }

    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const res = await axios.post(this.endpoint, metadata, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Create Folder Failed (${res.status}): ${res.data?.error?.message || 'Unknown Error'}`);
    }

    return res.data.id;
  }

  async copyFile(fileId, destinationFolderId) {
    await this.authenticateServiceAccount();
    if (!this.accessToken) {
      throw new Error('Copying requires a Service Account. Please configure service_account.json');
    }

    const url = `${this.endpoint}/${fileId}/copy`;
    const body = { parents: [destinationFolderId] };

    const res = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Copy File Failed (${res.status}): ${res.data?.error?.message || 'Unknown Error'}`);
    }

    return res.data.id; // ID of the new copy
  }

  async getFolderCover(folderId) {
    const params = {
      pageSize: 1,
      fields: 'files(thumbnailLink)',
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      orderBy: 'modifiedTime desc'
    };

    if (!this.accessToken) {
      params.key = this.apiKey;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.endpoint}?${queryString}`;
    const res = await this.request(url);
    
    if (res.code === 200 && res.data && res.data.files && res.data.files.length > 0) {
      const link = res.data.files[0].thumbnailLink;
      if (link) {
        return link.replace('=s220', '=s600');
      }
    }
    return null;
  }

  async getFileContent(fileId) {
    let url = `${this.endpoint}/${fileId}?alt=media`;
    if (!this.accessToken) {
      url += `&key=${this.apiKey}`;
    }

    const res = await this.request(url, 'GET', null, 'arraybuffer');
    if (res.code !== 200) return null;
    return res.data;
  }

  async downloadFileStream(fileId) {
    await this.authenticateServiceAccount();
    const headers = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else {
      // API Key fallback
      const url = `${this.endpoint}/${fileId}?alt=media&key=${this.apiKey}`;
      const res = await axios.get(url, { responseType: 'stream' });
      return res.data;
    }

    const url = `${this.endpoint}/${fileId}?alt=media`;
    const res = await axios.get(url, {
      headers,
      responseType: 'stream'
    });
    return res.data;
  }
}

module.exports = GoogleDrive;
