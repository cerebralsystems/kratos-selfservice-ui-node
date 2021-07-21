function copy () {
  var copyText = document.getElementById('copy');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(event.target.value);
  } else {
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand('copy');
  }

  const confirmation = document.getElementById('copied');

  confirmation.style.display = 'block';
  setTimeout(function () {
    confirmation.style.display = 'none';
  }, 2000);
}
