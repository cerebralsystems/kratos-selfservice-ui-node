function copy (spanId, copiedId) {
  var copyElement = document.getElementById(spanId);

  if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(copyElement);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(copyElement);
    range.select();
  } else {
    console.log('pac-file could not be copied to clipboard automatically');
  }

  document.execCommand('copy');

  const confirmation = document.getElementById(copiedId);

  confirmation.style.display = 'block';
  setTimeout(function () {
    confirmation.style.display = 'none';
  }, 1500);
}
