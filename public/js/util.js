function isAlpineReady() {
  return typeof Alpine === 'object';
}

function safeNum(val) {
  // Return 0 if our number is undefined
  return typeof val === 'number' ? val : 0;
}

function getLocalStorageItem(key) {
  return window.localStorage.getItem(key);
}

function getLocalStorageBoolean(key, optionalDefault) {
  const fromStorage = window.localStorage.getItem(key);
  if (!fromStorage && typeof optionalDefault !== 'undefined') {
    return optionalDefault;
  }
  return fromStorage && fromStorage === 'true' ? true : false;
}

function setLocalStorageItem(key, value) {
  window.localStorage.setItem(key, value);
}

function removeLocalStorageItem(key) {
  window.localStorage.removeItem(key);
}

function randomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  
  return color;
}

function randomDegrees() {
  return randomRange(0, 360) + 'deg';
}

function randomRange(min, max) {
  let randomNumber = 0;
  if (window && window.crypto) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    randomNumber = randomBuffer[0] / (0xffffffff + 1);
  }
  else {
    randomNumber = Math.random();
  }
  
  return Math.floor(randomNumber * (max - min + 1)) + min;
}

function isMobileSize() {
  return window.matchMedia("(max-width: 850px)").matches;
}

function cloneObject(obj) {
  return Object.assign({}, obj);
}

function addCSSLink(id, href) {
  // If we already have the element, just bail
  if (document.getElementById(id)) {
    return;
  }
  // Otherwise add the CSS link for the sheet to the head
  const toAdd = document.createElement('link');
  toAdd.id = id;
  toAdd.rel = 'stylesheet';
  toAdd.type = 'text/css';
  toAdd.href = href;
  document.head.appendChild(toAdd);
}

function notifyError(message, icon = 'info-circle', duration = 3000) {
  notify(message, 'danger', icon, duration);
}

function notify(message, variant = 'primary', icon = 'info-circle', duration = 3000) {
  const alert = Object.assign(document.createElement('sl-alert'), {
    variant,
    closable: true,
    duration: duration,
    innerHTML: `
      <sl-icon name="${icon}" slot="icon"></sl-icon>
      ${message}
    `
  });

  document.body.append(alert);
  return alert.toast();
}