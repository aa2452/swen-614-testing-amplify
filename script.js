<script src="aws-exports.js"><script> 

const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const uploadButton = document.querySelector('button');

let mediaStream;

navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        videoElement.srcObject = stream;
        mediaStream = stream;
    })
    .catch(function(error) {
        console.error('Error accessing webcam:', error);
    });

function captureAndUpload() {
    const context = canvasElement.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    canvasElement.toBlob(function(blob) {
        const bucketName = BUCKET_NAME;
        const region = 'us-east-2';
        const key =  Date.now() + '.png';

        const s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            region: region
        });

        const params = {
            Bucket: bucketName,
            Key: key,
            Body: blob,
            ACL: '',
            ContentType: 'image/png'
        };

        s3.upload(params, function(err, data) {
            if (err) {
                console.error('Error uploading image:', err);
            } else {
                console.log('Image uploaded successfully:', data.Location);
                alert('Image uploaded successfully!');
            }
        });
    }, 'image/png');
}