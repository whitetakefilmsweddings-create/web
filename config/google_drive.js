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
    // 3. Embedded JS object fallback (for production hosting)
    if (!this.creds) {
      this.creds = {
        type: "service_account",
        project_id: "web2026-485207",
        private_key_id: "1334623d0e5aca9c70e430768bf089f4bc576f41",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEw+65vgxQyq98\nLLYUqelF332Swy2TOBunqinTbG3iM9/3YNUgOMySnwmHpU74jT6DsDBL48mkjloq\nHzbJr1dwhD/qDOWqmSC1q25plY4AX7flOdYjdGKDf41ZW0tWVvPQA4GCWAubvAvx\nb2DFOqxJm8EzzM618vMAM8dwUHIafT32GhLHcq1tBNKV0OW/QG1GmX28U+es5tne\nYyxeZLTdV8EvNW+aWb7MjKaoApGCuRhXI3ZzbLKD9DqOoTHzq2odyGFjNlD7dz9B\n1CxfICl6yP0ExHTzofjrL31KJLwwallXPlF/AtrPoMaStfY9BqEedDHQZgv23Nw9\nLLDM94qLAgMBAAECggEAFPAb5fmtD3x/T6blr0LktvyREmjLij1vupfhwITqwnsu\nViwghxUUNnakScy+SmD5VIO59/Fi19cVYs2/LkIG0MskjqWAW6F/eLrSfSYeyLe8\nIVvWB3V54DABXLoEGnQWmL2EGViAz7nNyYtxEDvDRp1DjLK6vQ4qa+Hr/e3JiTuN\nGr73QqU3mE1So6cxXi2ClEfa7lgNt3DUiLX9SOsumfHKkfNutpfo3PBRoFWm4CTe\nHxVWSKw1yXh+Udcpw1cbKvCGffBEI15gRj5lu2a/1f6xoWV9szY9MBRhey+AomkB\nvPssL2arbfxvMuVA9pwkh2/3xzZ3Pjpt6Shb5BVyVQKBgQDmVUI9x8jca8OYgwlu\nd8F76cOdzM+uY+33jYgyaI2HgiIXKMcFfzsyriwjjytlpgbrCGC6MRAiii4+gsZH\nO8PItN8SsDM02uG/PXTCt2BFx3GuUSM9l9dDS9pOtmoZIJS9uWSU4ho5Z3HZnMCv\nOTo1OQ6X61I50QigWNO3wBp9XQKBgQDasRWG3DjTEnZBMIml1jL4kLHnnNZCXuKz\nYeAGJRRk7COqBbi07fBO6y4b1gn2V55D2Tu880ExBBi4p8N2XTPZf7seQ3akM4f/\njo/uIcaimExECNUKCMcHsPTcwdXxTBxms5dpDiLAq8Ak9b7no3cLVlATaxXryBly\n+eqNK/fBBwKBgFN2qZ5BeuOEmUf2k8BX3ODOAHh58ve6dkyyGJxLjp1/5mKGADhZ\ntlXTD2ODSbJ3yyH30zUk+jfJ4p/8O2UsnvFnuT3IY4XPmuX1mw3D7Trb3rHP7Pkw\nwGw+XEkRiLi6OavWNkBM/ju25GZ6isfz8MfAeS1LtGwG9x1DktSO5ApxAoGBANKw\nlr+1vR1FBR7rB0H5KmQk6vDsPdP1nE0b93uUD6Dni7iLCJdvQPyXQXXZ8QEfCr/t\nMstoRB9YBgUow3xucLyTfY+7iTrK1rRUAcB3U+pj9d358F1ZdX6ock+Yg2iUXixn\ny3CQCNU84sH46/I4n0ER59W9boIY5sPJmLpnaKrTAoGBAL0BWd4cJdeKrQmxTvii\nOIrnVWPGFjCeQXtiUxm6YmWI2ZKXiZUen3CAW86I/zW4oMwwW9CACEOGa5//2apZ\nE9pM2DI6yzWrKAOQl6vCQrBR+sY8MW+K50LX4mNWBFBZILixiPwZgByL9Opgw0Ih\nc6O8U2sLMpnb1PVHC92+7E1O\n-----END PRIVATE KEY-----\n",
        client_email: "audit-admin@web2026-485207.iam.gserviceaccount.com",
        client_id: "112604856571179584926",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/audit-admin%40web2026-485207.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };
    }
  }



  async authenticateOAuth() {
    const oauthFile = path.join(__dirname, '../Admin/config/google_oauth.json');
    let oauthData = null;

    if (fs.existsSync(oauthFile)) {
      try {
        oauthData = JSON.parse(fs.readFileSync(oauthFile, 'utf8'));
      } catch (e) {}
    }

    const refreshToken = oauthData?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = oauthData?.client_id || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = oauthData?.client_secret || process.env.GOOGLE_CLIENT_SECRET;

    if (refreshToken && clientId && clientSecret) {
      const now = Math.floor(Date.now() / 1000);
      if (this.accessToken && this.tokenExpiry > now + 300) {
        return true;
      }

      try {
        const response = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken
        }));

        if (response.data && response.data.access_token) {
          this.accessToken = response.data.access_token;
          this.tokenExpiry = now + (response.data.expires_in || 3600);
          this.isUserAuth = true;
          return true;
        }
      } catch (err) {
        console.error('Admin Google OAuth token refresh failed:', err.response?.data || err.message);
      }
    }
    return false;
  }

  async authenticateServiceAccount() {
    // 1. Prioritize Admin's Google OAuth Account if connected
    const isOAuth = await this.authenticateOAuth();
    if (isOAuth) return;

    // 2. Fallback to Service Account
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

    try {
      const res = await axios.post(this.endpoint, metadata, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return res.data.id;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      if (err.response?.status === 403) {
        throw new Error(`Drive Permission Error (403): ${msg}. Make sure the client's Google Drive folder is shared with "audit-admin@web2026-485207.iam.gserviceaccount.com" as Editor.`);
      }
      throw new Error(`Create Folder Failed: ${msg}`);
    }
  }

  async copyFile(fileId, destinationFolderId) {
    await this.authenticateServiceAccount();
    if (!this.accessToken) {
      throw new Error('Copying requires a Service Account.');
    }

    const url = `${this.endpoint}/${fileId}/copy`;
    const body = { parents: [destinationFolderId] };

    try {
      const res = await axios.post(url, body, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return res.data.id;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      if (err.response?.status === 403) {
        throw new Error(`Drive Permission Error (403): ${msg}. Make sure the client's Google Drive folder is shared with "audit-admin@web2026-485207.iam.gserviceaccount.com" as Editor.`);
      }
      throw new Error(`Copy File Failed: ${msg}`);
    }
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
