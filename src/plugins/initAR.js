import * as THREE from 'three';
import { THREEx, WebAR } from '../vendor/ar';

let artoolkitMarker;

// Initialisation of AR JS
const initARJS = (scene, camera, onRenderFcts, renderer) => {
  // //////////////////////////////////////////////////////////////////////////////
  //          handle arToolkitSource
  // //////////////////////////////////////////////////////////////////////////////
  const arToolkitSource = new THREEx.ArToolkitSource({
    // to read from the webcam
    sourceType: 'webcam'
  });

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
      arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
  };

  // //////////////////////////////////////////////////////////////////////////////
  //          initialize arToolkitContext
  // //////////////////////////////////////////////////////////////////////////////

  // create atToolkitContext
  let arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: `${THREEx.ArToolkitContext.baseURL}../data/data/camera_para.dat`,
    detectionMode: 'mono',
    maxDetectionRate: 30,
    canvasWidth: 80 * 3,
    canvasHeight: 60 * 3,
  });
  // initialize it
  arToolkitContext.init(() => {
    // copy projection matrix to camera
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });

  // update artoolkit on every frame
  onRenderFcts.push(() => {
    if (arToolkitSource.ready === false) return;
    arToolkitContext.update(arToolkitSource.domElement);
  });
  arToolkitSource.init(() => {
    onResize();
  });

  // handle resize
  window.addEventListener('resize', () => {
    onResize();
  });

  // //////////////////////////////////////////////////////////////////////////////
  //          Create a ArMarkerControls
  // //////////////////////////////////////////////////////////////////////////////
  const markerRoot = new THREE.Group();
  scene.add(markerRoot);
  artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    // type: 'barcode',
    // barcodeValue: 'https://magicstickr.github.io/video-base/index.html',
    type: 'pattern',
    patternUrl: 'images/marker.patt'
  });

  // build a smoothedControls
  const smoothedRoot = new THREE.Group();
  scene.add(smoothedRoot);
  const smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
    lerpPosition: 0.4,
    lerpQuaternion: 0.3,
    lerpScale: 1,
  });

  window.isMarkerVisible = false;

  onRenderFcts.push(() => {
    smoothedControls.update(markerRoot);
    // console.log(artoolkitMarker.object3d.visible);
    const elements = document.querySelectorAll(".manual-display");
    elements.forEach((element) => {
      if (element) {
        if (artoolkitMarker.object3d.visible) {
          element.style.display = "";
        } else {
          element.style.display = "none";
        }
      }
    });
  });

  return smoothedRoot;
};

const isMarkerVisible = () => artoolkitMarker.object3d.visible;

export { initARJS, isMarkerVisible };
