function cloneAsObject (obj) {
  if (obj === null || !(obj instanceof Object)) {
    return obj;
  }
  var temp = (obj instanceof Array) ? [] : {};
  for (var key in obj) {
    temp[key] = cloneAsObject(obj[key]);
  }
  return temp;
}

function successFunction (locationData) {
  fetch('/geolocation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ location: cloneAsObject(locationData) })
  });
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(successFunction, console.error);
};
