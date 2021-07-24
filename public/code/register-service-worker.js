async function registerSW () {
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('service-worker.js', { scope: '/' }).then(function (reg) {
        console.log(reg.scope);
      });
    } catch (e) {
      console.log('ServiceWorker registration failed. Sorry about that.');
    }
  }
}

registerSW();
