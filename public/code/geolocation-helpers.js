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

function postLocationData (data) {
  fetch('/geolocation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ location: data })
  });
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (locationData) => postLocationData(cloneAsObject(locationData)),
    () => postLocationData({ coords: { latitude: null, longitude: null } })
  );
} else {
  postLocationData({ coords: { latitude: null, longitude: null } });
}
