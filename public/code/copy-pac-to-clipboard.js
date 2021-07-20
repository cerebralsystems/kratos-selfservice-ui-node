const pacurl = document.getElementById('pac-file');
pacurl.addEventListener('click', function (evt) {
  navigator.clipboard.writeText(pacurl.innerText);
});
