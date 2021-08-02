function postServicesData () {
  const services = [];
  document.querySelectorAll('input').forEach(e => {
    if (e.checked) { services.push({ name: e.id, supported: ['all'] }); }
  });
  fetch('/tenant/updateServices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ services: services })
  });
}
