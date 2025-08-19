const gcs = require('./mock/config/gcs');

async function testGCSConnection() {
    try {
        console.log('🧪 Testing GCS connection...');
        
        // Test bucket access
        const bucket = gcs.getBucket();
        const [exists] = await bucket.exists();
        console.log(`✅ Bucket exists: ${exists}`);
        
        // Test file upload
        const testContent = Buffer.from('Hello from B-Care attachment test!');
        const testFileName = 'test/test-file.txt';
        
        const uploadResult = await gcs.uploadFile(testFileName, testContent, {
            contentType: 'text/plain'
        });
        console.log('✅ Upload test successful:', uploadResult.fileName);
        
        // Test signed URL generation
        const signedUrl = await gcs.generateSignedUrl(testFileName);
        console.log('✅ Signed URL generated:', signedUrl.substring(0, 50) + '...');
        
        // Test file deletion
        await gcs.deleteFile(testFileName);
        console.log('✅ Delete test successful');
        
        console.log('🎉 All GCS tests passed!');
        
    } catch (error) {
        console.error('❌ GCS test failed:', error.message);
        process.exit(1);
    }
}

testGCSConnection();