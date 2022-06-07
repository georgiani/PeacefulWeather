const imageLoader = new Worker('/javascripts/images.worker.js');
const imgElements = document.querySelectorAll('img[data-src]');

imageLoader.addEventListener('message', event => {
  // Grab the message data from the event
  const imageData = event.data;

  const imageElement = document.querySelector(`img[data-src='${imageData.imageURL}']`);

  const objectURL = URL.createObjectURL(imageData.blob);
  
  imageElement.setAttribute('src', objectURL);
  imageElement.removeAttribute('data-src');
});

imgElements.forEach(imageElement => {
  const imageURL = imageElement.getAttribute('data-src');
  imageLoader.postMessage(imageURL);
});