import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { initARJS, isMarkerVisible } from './initAR';
import { uploadFile } from './initCloudinary';
// import {initCSS3DRenderer, iFrameElement} from './initCSS3DRenderer';

let mouse = new THREE.Vector2();
let controls, controlsCSS3D;
let camera;

let mousePos = null;
let strokeColor = [200, 200, 200];
let textureCanvas, textureContext, texture;
let uploadFrequency = 1000;
let isUploadPremitted = true;

const addBox = (x, y, z, size, myScene) => {
  const textureBox = new THREE.TextureLoader().load('images/yann.jpg');
  const geometry = new THREE.BoxBufferGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({ map: textureBox });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = size / 2;
  mesh.position.set(x, mesh.position.y + y, z);
  myScene.add(mesh);
};

const groundObject = (size, myScene) => {
  const geometry = new THREE.PlaneGeometry(size, size, 1);
  const textureGround = new THREE.TextureLoader().load('images/table.jpg');
  const material = new THREE.MeshBasicMaterial({ map: textureGround, side: THREE.DoubleSide });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  myScene.add(ground);
};

const graffitiUpdate = (scene, camera) => {
  const raycaster = new THREE.Raycaster();
  // Graffiti update
  raycaster.setFromCamera(mouse, camera);
  const meshIntersects = raycaster.intersectObjects([scene.getObjectByName("graffiti")]);

  if (meshIntersects.length > 0) {
    const x = (meshIntersects[0].uv.x * textureCanvas.width);
    const y = (1 - meshIntersects[0].uv.y) * textureCanvas.height;

    if (mousePos === null) {
      mousePos = { x, y };
    } else {
      textureContext.beginPath();
      textureContext.moveTo(mousePos.x, mousePos.y);
      textureContext.lineTo(x, y);
      strokeColor[0] += Math.round(Math.random() * 100 - 50);
      if (strokeColor[0] < 0) { strokeColor[0] = 0; }
      if (strokeColor[0] > 255) { strokeColor[0] = 255; }
      strokeColor[1] += Math.round(Math.random() * 100 - 50);
      if (strokeColor[1] < 0) { strokeColor[1] = 0; }
      if (strokeColor[1] > 255) { strokeColor[1] = 255; }
      strokeColor[2] += Math.round(Math.random() * 100 - 50);
      if (strokeColor[2] < 0) { strokeColor[2] = 0; }
      if (strokeColor[2] > 255) { strokeColor[2] = 255; }
      textureContext.strokeStyle = `rgb(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]})`;
      textureContext.lineWidth = 1;
      textureContext.stroke();
      mousePos = { x, y };
      const dataURL = textureCanvas.toDataURL();
      if (isUploadPremitted) {
        isUploadPremitted = false;
        setTimeout(() => {
          console.log(dataURL);
          console.log("image uploaded");
          isUploadPremitted = true;
          uploadFile(dataURL, document.getElementById("inputSecret").value);
        }, uploadFrequency);
      }
    }
    texture.needsUpdate = true;
  }
};

const graffitiCreate = (myScene) => {
  // Customizable texture
  const canvasSize = 256;
  textureCanvas = document.createElement('canvas');
  textureCanvas.width = canvasSize;
  textureCanvas.height = canvasSize;
  textureContext = textureCanvas.getContext('2d');
  textureContext.rect(0, 0, textureCanvas.width, textureCanvas.height);
  // textureContext.fillStyle = 'rgba(255, 255, 255, 0)';
  // textureContext.fill ();
  const img = new Image();
  img.onload = () => {
    textureContext.drawImage(img, 0, 0);
  };
  img.crossOrigin = "anonymous";
  img.src = 'https://res.cloudinary.com/yanninthesky/image/upload/grafitti.png';


  texture = new THREE.Texture(textureCanvas);
  texture.needsUpdate = true;
  // texture.flipY = false;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(canvasSize, canvasSize),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = "graffiti";
  mesh.scale.multiplyScalar(0.02);
  myScene.add(mesh);
};

const init = (withAR = false) => {
  // init renderer
  let onRenderFcts = [];

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    autoResize: true,
    alpha: true
  });
  renderer.setClearColor(new THREE.Color('lightgrey'), 0);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0px';
  renderer.domElement.style.left = '0px';
  document.body.appendChild(renderer.domElement);

  // Scene settings
  const scene = new THREE.Scene();

  // Create a camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1500);
  if (!withAR) {
    camera.position.z = 100;
    camera.position.y = 10;
  }
  scene.add(camera);

  const light = new THREE.AmbientLight(0xffffff); // soft white light
  light.intensity = 0.7;
  scene.add(light);

  // Add objects to the ThreeJS scene
  if (withAR) {
    const sceneAR = initARJS(scene, camera, onRenderFcts, renderer);
    // addBox(1, sceneAR);
    graffitiCreate(sceneAR);
  } else {
    addBox(0, 30, 0, 20, scene);
    graffitiCreate(scene);
    groundObject(200, scene);
  }

  // render the scene
  onRenderFcts.push(() => {
    if (mouse.down && isMarkerVisible()) {
      graffitiUpdate(scene, camera);
    }
    renderer.render(scene, camera);
  });

  // run the rendering loop
  let lastTimeMsec = null;
  requestAnimationFrame(function animate(nowMsec){
    // keep looping
    requestAnimationFrame(animate);
    // measure time
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    let deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec = nowMsec;
    // call each update function
    onRenderFcts.forEach((onRenderFct) => {
      onRenderFct(deltaMsec / 1000, nowMsec / 1000);
    });
  });

  const onDocumentTouchStart = (event) => {
    mouse.x = ((event.touches[0].clientX - renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) - 0.5;
    mouse.y = -((event.touches[0].clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;
    mouse.down = true;
  };


  const onDocumentTouchEnd = (event) => {
    mouse.down = false;
    mousePos = null;
  };

  const onDocumentMouseDown = (event) => {
    mouse.x = ((event.clientX / renderer.domElement.clientWidth) - 0.5);
    // console.log(`Mouse X: ${mouse.x}`);
    // console.log(`Event client X: ${event.clientX}`);
    // console.log(`Client width: ${renderer.domElement.clientWidth}`);

    mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;
    mouse.down = (event.buttons !== 0);
    if (!mouse.down) {
      mousePos = null;
    }
  };

  document.addEventListener('mousedown', onDocumentMouseDown);
  document.addEventListener('mouseup', onDocumentMouseDown);
  document.addEventListener('mousemove', onDocumentMouseDown);

  document.addEventListener('touchstart', onDocumentTouchStart);
  document.addEventListener('touchend', onDocumentTouchEnd);
  document.addEventListener('touchmove', onDocumentTouchStart);
};

export { init };
