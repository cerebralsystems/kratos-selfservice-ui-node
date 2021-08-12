export function calculateDistance (lat1: number, lon1: number, lat2: number, lon2: number) {
  var earthRadius = 6371; // Radius of the earth in km
  var radLat = deg2rad(lat2 - lat1);
  var radLng = deg2rad(lon2 - lon1);
  var a =
    Math.sin(radLat / 2) * Math.sin(radLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(radLng / 2) * Math.sin(radLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = earthRadius * c; // Distance in km
  return distance;
}

function deg2rad (deg: number) {
  return deg * (Math.PI / 180);
}
