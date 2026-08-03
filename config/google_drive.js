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
      const b64 = "eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6IndlYjIwMjYtNDg1MjA3IiwicHJpdmF0ZV9rZXlfaWQiOiIxMzM0NjIzZDBlNWFjYTljNzBlNDMwNzY4YmYwODlmNGJjNTc2ZjQxIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRREV3KzY1dmd4UXlxOThcbkxMWVVxZWxGMzMyU3d5MlRPQnVucWluVGJHM2lNOS8zWU5VZ09NeVNud21IcFU3NGpUNkRzREJMNDhta2psb3Fcbkh6YkpyMWR3aEQvcURPV3FtU0MxcTI1cGxZNEFYN2ZsT2RZamRHS0RmNDFaVzB0V1Z2UFFBNEdDV0F1YnZBdnhcbmIyREZPcXhKbThFenpNNjE4dk1BTThkd1VISWFmVDMyR2hMSGNxMXRCTktWME9XL1FHMUdtWDI4VStlczV0bmVcbll5eGVaTFRkVjhFdk5XK2FXYjdNakthb0FwR0N1UmhYSTNaemJMS0Q5RHFPb1RIenEyb2R5R0ZqTmxEN2R6OUJcbjFDeGZJQ2w2eVAwRXhIVHpvZmpyTDMxS0pMd3dhbGxYUGxGL0F0clBvTWFTdGZZOUJxRWVkREhRWmd2MjNOdzlcbkxMRE05NHFMQWdNQkFBRUNnZ0VBRlBBYjVmbXREM3gvVDZibHIwTGt0dnlSRW1qTGlqMXZ1cGZod0lUcXduc3VcblZpd2doeFVVTm5ha1NjeStTbUQ1VklPNTkvRmkxOWNWWXMyL0xrSUcwTXNranFXQVc2Ri9lTHJTZlNZZXlMZThcbklWdldCM1Y1NERBQlhMb0VHblFXbUwyRUdWaUF6N25OeVl0eEVEdkRScDFEakxLNnZRNHFhK0hyL2UzSmlUdU5cbkdyNzNRcVUzbUUxU282Y3hYaTJDbEVmYTdsZ050M0RVaUxYOVNPc3VtZkhLa2ZOdXRwZm8zUEJSb0ZXbTRDVGVcbkh4VldTS3cxeVhoK1VkY3B3MWNiS3ZDR2ZmQkVJMTVnUmo1bHUyYS8xZjZ4b1dWOXN6WTlNQlJoZXkrQW9ta0JcbnZQc3NMMmFyYmZ4dk11VkE5cHdraDIvM3h6WjNQanB0NlNoYjVCVnlWUUtCZ1FEbVZVSTl4OGpjYThPWWd3bHVcbmQ4Rjc2Y09kek0rdVkrMzNqWWd5YUkySGdpSVhLTWNGZnpzeXJpd2pqeXRscGdickNHQzZNUkFpaWk0K2dzWkhcbk84UEl0TjhTc0RNMDJ1Ry9QWFRDdDJCRngzR3VVU005bDlkRFM5cE90bW9aSUpTOXVXU1U0aG81WjNIWm5NQ3Zcbk9UbzFPUTZYNjFJNTBRaWdXTk8zd0JwOVhRS0JnUURhc1JXRzNEalRFblpCTUltbDFqTDRrTEhubk5aQ1h1S3pcblllQUdKUlJrN0NPcUJiaTA3ZkJPNnk0YjFnbjJWNTVEMlR1ODgwRXhCQmk0p8N2NlUTNha000Zi9cbmpvL3VJY2FpbUV4RUNOVUtDTWNIc1BUY3dkWHhUQnhtczVkcERpTEFxOEFrOWI3bm8zY0xWbEFUYXhYcnlCbHlcbitlcU5LL2ZCQndLQmdGTjJxWjVCZXVPRW1VZjJrOEJYM09ET0FIaDU4dmU2ZGt5eUdKeExqcDEvNW1LR0FEaFpcbnRsWFREMk9EU2JKM3l5SDMwelVrK2pmSjRwLzhPMlVzbnZGbnVUM0lZNFhQbXVYMW13M0Q3VHJiM3JIUDdQa3dcbndHdytYRWtSaUxpNk9hdldOa0JNL2p1MjVHWjZpc2Z6OE1mQWVTMUx0R3dHOXgxRGt0U081QXB4QW9HQkFOS3dcbmxyKzF2UjFGQlI3ckIwSDVLbVFrNnZEc1BkUDFuRTBiOTN1VUQ2RG5pN2lMQ0pkdlFQeVhRWFhaOFFFZkNyL3Rcbk1zdG9SQjlZQmdVb3czeHVjTHlUZlkrN2lUcksxclJVQWNCM1UrcGo5ZDM1OEYxWmRYNm9jaytZZzJpVVhpeG5cbnkzQ1FDTlU4NHNINDYvSTRuMEVSNTlXOWJvSVk1c1BKbUxwbmFLclRBb0dCQUwwQldkNGNKZGVLclFteFR2aWlcbk9Jcm5WV1BHRmpDZVFYdGlVeG02WW1XSTJaS1hpWlVlbjNDQVc4Nkkvelc0b013d1c5Q0FDRU9HYTUvLzJhcFpcbkU5cE0yREk2eXpXcktBT1FsNnZDUXJCUitzWThNVytLNTBMWDRtTldCRkJaSUxpeGlQd1pnQnlMOU9wZ3cwSWhcbmM2TzhVMnNMTXBuYjFQVkhDOTIrN0UxT1xuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiYXVkaXQtYWRtaW5Ad2ViMjAyNi00ODUyMDcuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJjbGllbnRfaWQiOiIxMTI2MDQ4NTY1NzExNzk1ODQ5MjYiLCJhdXRoX3VyaSI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwidG9rZW5fdXJpIjoiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvYXVkaXQtYWRtaW4lNDB3ZWIyMDI2LTQ4NTIwNy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0=";
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
