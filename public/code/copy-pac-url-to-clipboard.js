function copy () {
  var copyElement = document.getElementById('copy');

  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(copyElement);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(copyElement);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  document.execCommand('copy');

  const confirmation = document.getElementById('copied');

  confirmation.style.display = 'block';
  setTimeout(function () {
    confirmation.style.display = 'none';
  }, 1500);
}
