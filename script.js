let video = document.getElementById("video");
let model;

// Declare the canvas variable and set up the context
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let faceDetectedTime = 0; // Initialize face detected time counter
let uploadInterval = null; // Initialize upload interval variable

const accessCamera = () => {
  navigator.mediaDevices
    .getUserMedia({
      video: { width: 500, height: 400 },
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    });
};

const detectFaces = async () => {
  const predictions = await model.estimateFaces(video, false);

  // Using canvas to draw the video first
  ctx.drawImage(video, 0, 0, 500, 400);

  predictions.forEach((prediction) => {
    // Drawing rectangle that'll detect the face
    ctx.beginPath();
    ctx.lineWidth = "4";
    ctx.strokeStyle = "rgba(255, 255, 0, 0.1)";
    ctx.rect(
      prediction.topLeft[0],
      prediction.topLeft[1],
      prediction.bottomRight[0] - prediction.topLeft[0],
      prediction.bottomRight[1] - prediction.topLeft[1]
    );
    ctx.stroke();

    // Start or reset the timer if a face is detected
    faceDetectedTime = 0;
    if (!uploadInterval) {
      uploadInterval = setInterval(checkFaceDetectedTime, 7000);
    }
  });
};

const checkFaceDetectedTime = () => {
  // Increment face detected time every second
  faceDetectedTime++;
  if (faceDetectedTime >= 1) {
    clearInterval(uploadInterval);
    uploadInterval = null;
    uploadToS3();
  }
};

const uploadToS3 = () => {
  // Get the data URL of the canvas image
  const imageDataURL = canvas.toDataURL('image/jpeg');

  // Convert the data URL to a Blob object
  const byteString = atob(imageDataURL.split(',')[1]);
  const mimeString = imageDataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });

  // Create a unique filename for the image
  const filename = `${Date.now()}.jpeg`;

 //Initialize AWS SDK and configure S3 bucket
	AWS.config.update({
			accessKeyId: ROOT_KEY,
			secretAccessKey: SECRET_KEY,
			region: 'us-east-2'
	});

  const s3 = new AWS.S3();

  // Define S3 upload parameters
  const params = {
    Bucket: 'aa2452-swen-614-team-bucket',
    Key: filename,
    Body: blob,
    ACL: '',
  };

  // Upload image to S3 bucket
  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Image uploaded to S3:', data.Location);
  });
};

accessCamera();
video.addEventListener("loadeddata", async () => {
  model = await blazeface.load();
  // Calling the detectFaces every 40 milliseconds
  setInterval(detectFaces, 40);
});
