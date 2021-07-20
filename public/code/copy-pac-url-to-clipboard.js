var copyButton = document.getElementById('copy-button');

copyButton.addEventListener('click', function (event) {
  console.log(event.target.value);
  navigator.clipboard.writeText(event.target.value);
  event.target.text = 'Copied!';
});
