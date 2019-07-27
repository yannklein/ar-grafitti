// *********** Upload file to Cloudinary ******************** //
const cloudName = 'yanninthesky';
// const unsignedUploadPreset = 'st4y3ops';
// const secret = document.getElementById("inputSecret").value;
// console.log(secret);
const myApiKey = '872373128264639';
const myPublicId = 'grafitti';

const CryptoJS = require("crypto-js");

document.querySelector("body").insertAdjacentHTML(
  "beforeend",
  '<div style="position: absolute; z-index: 99; width: 40vw"><form><div class="form-group"><input id="inputSecret" type="password" class="form-control m-3" placeholder="Add the pass to enable graf saving!"></div></form></div>'
);

const createURLSearchParams = (data) => {
  const params = new URLSearchParams();
  Object.keys(data).forEach(key => params.append(key, data[key]));
  console.log(params.toString());
  return params;
};

const generateSignature = (publicId, secret, now) => {
  return CryptoJS.SHA1(`public_id=${publicId}&timestamp=${now}${secret}`).toString();
};

const uploadFile = (image, secret) => {
  debugger
  const now = Date.now() / 1000 || 0;
  const mySignature = generateSignature(myPublicId, secret, now);
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const data = {
    file: image,
    timestamp: now,
    public_id: myPublicId,
    api_key: myApiKey,
    signature: mySignature
    // upload_preset: unsignedUploadPreset
  };
  const params = createURLSearchParams(data);

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
};

export { uploadFile };
