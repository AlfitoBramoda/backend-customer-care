const { Storage } = require('@google-cloud/storage');

class GCSConfig {
    constructor() {
        this.projectId = process.env.GCS_PROJECT_ID;
        this.bucketName = process.env.GCS_BUCKET_NAME;
        this.keyFilename = process.env.GCS_KEY_FILE;
        this.isConfigured = false;
        
        if (!this.projectId || !this.bucketName || !this.keyFilename) {
            console.warn('⚠️ GCS configuration missing. Attachment features will be disabled.');
            console.warn('   Add GCS_PROJECT_ID, GCS_BUCKET_NAME, and GCS_KEY_FILE to enable attachments.');
            return;
        }

        try {
            this.storage = new Storage({
                projectId: this.projectId,
                keyFilename: this.keyFilename,
            });

            this.bucket = this.storage.bucket(this.bucketName);
            this.isConfigured = true;
            console.log('✅ GCS configured successfully');
        } catch (error) {
            console.warn('⚠️ GCS initialization failed:', error.message);
            console.warn('   Attachment features will be disabled.');
        }
    }

    isReady() {
        return this.isConfigured;
    }

    getBucket() {
        if (!this.isConfigured) {
            throw new Error('GCS not configured. Please check your service account key.');
        }
        return this.bucket;
    }

    getStorage() {
        if (!this.isConfigured) {
            throw new Error('GCS not configured. Please check your service account key.');
        }
        return this.storage;
    }

    async generateSignedUrl(fileName, expires = 3600) {
        if (!this.isConfigured) {
            throw new Error('GCS not configured. Cannot generate signed URL.');
        }
        const file = this.bucket.file(fileName);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expires * 1000,
        });
        return url;
    }

    async uploadFile(fileName, buffer, metadata = {}) {
        if (!this.isConfigured) {
            throw new Error('GCS not configured. Cannot upload file.');
        }
        const file = this.bucket.file(fileName);
        
        const stream = file.createWriteStream({
            metadata: {
                contentType: metadata.contentType || 'application/octet-stream',
                metadata: metadata.customMetadata || {}
            },
            resumable: false
        });

        return new Promise((resolve, reject) => {
            let isResolved = false;
            
            const cleanup = () => {
                if (!stream.destroyed) {
                    stream.removeAllListeners();
                }
            };
            
            stream.on('error', (error) => {
                if (!isResolved) {
                    isResolved = true;
                    cleanup();
                    reject(error);
                }
            });
            
            stream.on('finish', () => {
                if (!isResolved) {
                    isResolved = true;
                    cleanup();
                    resolve({
                        fileName,
                        publicUrl: `gs://${this.bucketName}/${fileName}`,
                        mediaLink: file.publicUrl()
                    });
                }
            });
            
            // Write buffer and end stream properly
            if (buffer && buffer.length > 0) {
                stream.write(buffer, (error) => {
                    if (error && !isResolved) {
                        isResolved = true;
                        cleanup();
                        reject(error);
                    } else {
                        stream.end();
                    }
                });
            } else {
                stream.end();
            }
        });
    }

    async deleteFile(fileName) {
        if (!this.isConfigured) {
            throw new Error('GCS not configured. Cannot delete file.');
        }
        const file = this.bucket.file(fileName);
        await file.delete();
        return true;
    }

    async fileExists(fileName) {
        if (!this.isConfigured) {
            throw new Error('GCS not configured. Cannot check file existence.');
        }
        const file = this.bucket.file(fileName);
        const [exists] = await file.exists();
        return exists;
    }
}

module.exports = new GCSConfig();