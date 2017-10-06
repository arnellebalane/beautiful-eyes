document.addEventListener('DOMContentLoaded', () => {
    if (isShapeDetectionApiSupported()) {
        document.body.classList.add('available');
        runBeautifulEyes();
    } else {
        document.body.classList.add('unavailable');
    }
});

function isShapeDetectionApiSupported() {
    return 'FaceDetector' in window;
}

async function runBeautifulEyes() {
    const constraints = { video: true };
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');

    const leftEyeImg = document.querySelector('.left-eye');
    const rightEyeImg = document.querySelector('.right-eye');

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        renderFrame();
    };

    const faceDetector = new FaceDetector();
    let renderLocked = false;

    async function renderFrame() {
        requestAnimationFrame(renderFrame);
        if (renderLocked) return;
        renderLocked = true;

        try {
            const detectedFaces = await faceDetector.detect(video);

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(video, 0, 0);

            detectedFaces.forEach((face) => {
                const [leftEye, rightEye] = face.landmarks
                    .filter(landmark => landmark.type === 'eye')
                    .sort((a, b) => a.location.x - b.location.x)
                    .map(eye => eye.location);

                const eyeDistance = distanceBetween(leftEye, rightEye);
                const eyeWidth = eyeDistance / 1.8;

                const leftEyeRatio = leftEyeImg.width / leftEyeImg.height;
                const leftEyeHeight = eyeWidth / leftEyeRatio;
                const leftEyeX = leftEye.x - eyeWidth / 2;
                const leftEyeY = leftEye.y - leftEyeHeight / 2;

                const rightEyeRatio = rightEyeImg.width / rightEyeImg.height;
                const rightEyeHeight = eyeWidth / rightEyeRatio;
                const rightEyeX = rightEye.x - eyeWidth / 2;
                const rightEyeY = rightEye.y - rightEyeHeight / 2;

                context.drawImage(leftEyeImg, leftEyeX, leftEyeY, eyeWidth, leftEyeHeight);
                context.drawImage(rightEyeImg, rightEyeX, rightEyeY, eyeWidth, rightEyeHeight);
            });

            renderLocked = false;
        } catch (e) {
            document.querySelector('.error').textContent = 'Face detector service is not available.';
            document.body.classList.toggle('available', 'unavailable');
        }
    }
}

function distanceBetween(a, b) {
    const x2 = Math.pow(a.x - b.x, 2);
    const y2 = Math.pow(a.y - b.y, 2);
    return Math.sqrt(x2 + y2);
}
