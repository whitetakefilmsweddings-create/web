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
    const keyFile = path.join(__dirname, '../Admin/config/service_account.json');
    if (fs.existsSync(keyFile)) {
      try {
        this.creds = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
      } catch (err) {
        console.error('Failed to parse service_account.json:', err);
      }
    }
  }

  async authenticateServiceAccount() {
    if (!this.creds) return;
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
      }
    } catch (err) {
      console.error('Google Auth Token exchange failed:', err.response?.data || err.message);
    }
  }

  async request(url, method = 'GET', body = null, responseType = 'json') {
    await this.authenticateServiceAccount();
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
