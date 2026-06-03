<?php
// config/google_drive.php

class SimpleDriveFile {
    private $data;

    public function __construct($data) {
        $this->data = $data;
    }

    public function getId() { return $this->data['id'] ?? ''; }
    public function getName() { return $this->data['name'] ?? ''; }
    public function getMimeType() { return $this->data['mimeType'] ?? ''; }
    public function getThumbnailLink() { return $this->data['thumbnailLink'] ?? ''; }
    public function getWebViewLink() { return $this->data['webViewLink'] ?? ''; }
    public function getWebContentLink() { return $this->data['webContentLink'] ?? ''; }
}

class GoogleDrive {
    private $apiKey;
    private $accessToken = null;
    private $endpoint = 'https://www.googleapis.com/drive/v3/files';
    private $authEndpoint = 'https://oauth2.googleapis.com/token';
    
    // TODO: USER MUST UPDATE THIS ID
    const ROOT_FOLDER_ID = 'PASTE_YOUR_ROOT_FOLDER_ID_HERE';

    public function __construct() {
        $this->apiKey = 'AIzaSyAxoP_13cWEwsr0jzH4Tj51yWPe7f-SNEQ'; // Fallback for Read-Only
        $this->tryLoadServiceAccount();
    }

    private function tryLoadServiceAccount() {
        $keyFile = __DIR__ . '/service_account.json';
        if (file_exists($keyFile)) {
            $this->authenticateServiceAccount($keyFile);
        }
    }

    private function authenticateServiceAccount($keyFile) {
        $creds = json_decode(file_get_contents($keyFile), true);
        if (!$creds) return;

        $now = time();
        $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
        $payload = json_encode([
            'iss' => $creds['client_email'],
            'sub' => $creds['client_email'],
            'aud' => $this->authEndpoint,
            'iat' => $now,
            'exp' => $now + 3600,
            'scope' => 'https://www.googleapis.com/auth/drive'
        ]);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signatureInput = $base64UrlHeader . "." . $base64UrlPayload;
        $signature = '';
        
        if (!openssl_sign($signatureInput, $signature, $creds['private_key'], 'SHA256')) {
            // error_log("OpenSSL Sign Failed");
            return;
        }

        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        $jwt = $signatureInput . "." . $base64UrlSignature;

        // Exchange JWT for Access Token
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->authEndpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        if (isset($data['access_token'])) {
            $this->accessToken = $data['access_token'];
        }
    }

    // Common Curl Helper
    private function request($url, $method = 'GET', $body = null) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $headers = [];
        if ($this->accessToken) {
            $headers[] = 'Authorization: Bearer ' . $this->accessToken;
        }

        if ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }

        if ($body) {
            // For Delete, typically no body, but if needed
            // For now, we only use this for Delete
        }

        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        return ['code' => $httpCode, 'data' => $response, 'error' => $error];
    }

    // --- Public Methods ---

    public function getFiles($folderId) {
        // Use API Key for listing if no Service Account (Faster/Simpler for Public folders)
        // Or prefer Service Account if available? 
        // Let's stick to API Key for reading if it works, or fallback.
        // Actually, if folder is private, API key won't work. Service Account will if shared.
        // Let's prefer Service Account if available.

        $files = [];
        $pageToken = null;

        do {
            $params = [
                'pageSize' => 1000,
                'fields' => 'nextPageToken, files(id, name, mimeType, webContentLink, webViewLink, thumbnailLink)',
                'q' => "'$folderId' in parents and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'zip') and trashed = false",
                'orderBy' => 'folder, name'
            ];

            if (!$this->accessToken) {
                 $params['key'] = $this->apiKey;
            }

            if ($pageToken) {
                $params['pageToken'] = $pageToken;
            }

            $url = $this->endpoint . '?' . http_build_query($params);
            
            // Custom Request
            $res = $this->request($url);
            
            if ($res['error']) throw new Exception("cURL Error: " . $res['error']);
            
            $json = json_decode($res['data'], true);
            
            if ($res['code'] !== 200) {
                 $msg = $json['error']['message'] ?? 'Unknown API Error';
                 throw new Exception("Google API Error ({$res['code']}): " . $msg);
            }

            if (isset($json['files']) && is_array($json['files'])) {
                foreach ($json['files'] as $fileData) {
                    $files[] = new SimpleDriveFile($fileData);
                }
            }

            $pageToken = $json['nextPageToken'] ?? null;

        } while ($pageToken);

        return $files;
    }

    public function deleteFile($fileId) {
        if (!$this->accessToken) {
            throw new Exception("Deletion requires a Service Account. Please configure config/service_account.json");
        }

        // STRATEGY CHANGE: "Soft Delete" via Move
        // Since we cannot permanently delete or trash files owned by others (without Owner access),
        // We will MOVE them to a "_TRASH_" folder. This works for Editors.

        // 1. Get current parent
        $meta = $this->getFileMetadataRaw($fileId);
        if (!$meta || empty($meta['parents'])) {
             throw new Exception("Could not fetch file metadata or parents.");
        }
        $parentId = $meta['parents'][0];

        // 2. Find or Create "_TRASH_" folder in this parent
        $trashFolderId = $this->ensureTrashFolder($parentId);

        if (!$trashFolderId) {
             throw new Exception("Could not create/find _TRASH_ folder.");
        }

        // 3. Move file
        $url = $this->endpoint . '/' . $fileId . '?addParents=' . $trashFolderId . '&removeParents=' . $parentId;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) throw new Exception("cURL Error: " . $error);

        if ($httpCode === 200) {
            return true;
        }

        $json = json_decode($response, true);
        $msg = $json['error']['message'] ?? 'Unknown API Error';
        throw new Exception("Move Failed ({$httpCode}): " . $msg);
    }

    private function getFileMetadataRaw($fileId) {
        $url = $this->endpoint . '/' . $fileId . '?fields=id,parents,name';
        $res = $this->request($url);
        if ($res['code'] !== 200) return null;
        return json_decode($res['data'], true);
    }

    private function ensureTrashFolder($parentId) {
        // Check if exists
        $q = "'$parentId' in parents and name = '_TRASH_' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        $url = $this->endpoint . '?q=' . urlencode($q);
        $res = $this->request($url);
        
        if ($res['code'] === 200) {
            $data = json_decode($res['data'], true);
            if (!empty($data['files'])) {
                return $data['files'][0]['id'];
            }
        }

        // Create it
        $metadata = [
            'name' => '_TRASH_',
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($metadata));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $data = json_decode($response, true);
        
        return $data['id'] ?? null;
    }
    
    // Legacy support methods (Read-only helpers that might use API Key)
    public function getFileMetadata($fileId) {
        // Prefer SA if available, else API key
        $url = $this->endpoint . '/' . $fileId . '?fields=id,name,mimeType,webContentLink,webViewLink,thumbnailLink';
        if (!$this->accessToken) {
            $url .= '&key=' . $this->apiKey;
        }
        
        $res = $this->request($url);
        if ($res['code'] !== 200) return null;
        
        return new SimpleDriveFile(json_decode($res['data'], true));
    }
    // --- New Methods for Auto-Creation ---

    public function createFolder($name, $parentId) {
        if (!$this->accessToken) {
            throw new Exception("Creation requires a Service Account.");
        }

        $metadata = [
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($metadata));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) throw new Exception("cURL Error: " . $error);

        $json = json_decode($response, true);
        
        if ($httpCode !== 200) {
             throw new Exception("Create Folder Failed ({$httpCode}): " . ($json['error']['message'] ?? 'Unknown Error'));
        }

        return $json['id'];
    }
    public function getFolderCover($folderId) {
        $params = [
            'pageSize' => 1,
            'fields' => 'files(thumbnailLink)',
            'q' => "'$folderId' in parents and mimeType contains 'image/' and trashed = false",
            'orderBy' => 'modifiedTime desc'
        ];

        if (!$this->accessToken) {
             $params['key'] = $this->apiKey;
        }

        $url = $this->endpoint . '?' . http_build_query($params);
        $res = $this->request($url);
        
        if ($res['code'] === 200) {
            $json = json_decode($res['data'], true);
            if (!empty($json['files'])) {
                $link = $json['files'][0]['thumbnailLink'] ?? null;
                if ($link) {
                    return str_replace('=s220', '=s600', $link);
                }
            }
        }
        return null; // No cover found
    }

    public function getFileContent($fileId) {
        $url = $this->endpoint . '/' . $fileId . '?alt=media';
        // Use API Key if no access token (though for media, usually requires auth or public)
        if (!$this->accessToken) {
             $url .= '&key=' . $this->apiKey;
        }

        $res = $this->request($url);
        
        if ($res['code'] !== 200) {
            // error_log("Failed to get file content: " . $res['code']);
            return null;
        }
        
        return $res['data'];
    }

    public function downloadFile($fileId, $handle) {
         $url = $this->endpoint . '/' . $fileId . '?alt=media';
        if (!$this->accessToken) {
             $url .= '&key=' . $this->apiKey;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_FILE, $handle);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        if ($this->accessToken) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $this->accessToken]);
        }

        $success = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $success && $httpCode === 200;
    }
}
?>
