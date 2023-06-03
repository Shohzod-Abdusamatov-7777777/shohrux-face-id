let video = document.querySelector("#videoElement");
let currentStream;
let displaySize;

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
}

let temp = []

$("#videoElement").bind("loadedmetadata", async function () {
  displaySize = { width: this.scrollWidth, height: this.scrollHeight }
})

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  console.log('Starting')
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  document.body.append('Loaded')
  setInterval(async () => {
    console.log("loaded metadata loaded")
    let fullFaceDescriptions = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
    let canvas = $("#canvas").get(0);
    faceapi.matchDimensions(canvas, displaySize)
    const resizedDetections = faceapi.resizeResults(fullFaceDescriptions, displaySize)

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
  }, 200)
}


function loadLabeledImages() {
  const labels = ['Shohzod', 'Otabek','Shohrux']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      const img = await faceapi.fetchImage(`/labeled_images/${label}/${1}.jpg`)
      const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
      descriptions.push(detections.descriptor)

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
