let allTests = [];
let activeTest = 'None';
let timer = null;
const vpnDefaults = { ping: 2977/* millsecs */, dl: 35/* seconds */ };
class Metric {
    direct = 0;
    vpn = 0;
    neuron = 0;

    vpnFac () {
      return (1.0 * this.vpn) / this.neuron;
    }

    directFac () {
      return this.direct / this.neuron;
    }

    formatFac (percentage) {
      if (percentage) {
        const vf = (this.vpnFac() - 1) * 100;
        const df = (this.directFac() - 1) * 100;

        return (vf > 1 ? '+' : '') + Math.round(vf) + '%';// (" + (df > 1 ? "+" : "") + df.toFixed(2) + "%)";
      } else {
        return this.vpnFac().toFixed(2) + 'x';
      }
    }
}

function applyFilter () {
  allTests.forEach(
    t => document.querySelectorAll('.' + t).forEach(
      el => { el.style.display = activeTest === 'All' || activeTest === t ? 'block' : 'none'; }
    ));
}

function onDropdownClick () {
  document.getElementById('testsDropdown').classList.toggle('show');
}

function onSliderChange (event) {
  populateCurrentMetrics();
}

function onPlayPause (event) {
  const btn = document.querySelector('#playPauseBtn');
  if (timer) {
    clearInterval(timer);
    timer = null;
    btn.textContent = 'Play';
  } else {
    timer = setInterval(() => {
      const slider = document.querySelector('#slider');
      if (slider.value === slider.max) { slider.value = 0; } else { slider.value++; }
      populateCurrentMetrics();
    }, 1000);
    btn.textContent = 'Pause';
  }
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName('dropdown-content');
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }

      if (allTests.indexOf(event.target.id) !== -1) {
        activeTest = event.target.id;
        applyFilter();
      }
    }
  }
};

function makeBG (test, elem) {
  var svgns = 'http://www.w3.org/2000/svg';
  var bounds = elem.getBBox();
  var bg = document.createElementNS(svgns, 'rect');
  var style = getComputedStyle(elem);
  var paddingTop = parseInt(style['padding-top']);
  var paddingLeft = parseInt(style['padding-left']);
  var paddingRight = parseInt(style['padding-right']);
  var paddingBottom = parseInt(style['padding-bottom']);
  bg.setAttribute('class', test);
  bg.setAttribute('x', bounds.x - parseInt(style['padding-left']));
  bg.setAttribute('y', bounds.y - parseInt(style['padding-top']));
  bg.setAttribute('width', bounds.width + paddingLeft + paddingRight);
  bg.setAttribute('height', bounds.height + paddingTop + paddingBottom);
  bg.setAttribute('fill', style['background-color']);
  bg.setAttribute('rx', style['border-radius']);
  bg.setAttribute('stroke-width', style['border-top-width']);
  bg.setAttribute('stroke', style['border-top-color']);
  if (elem.hasAttribute('transform')) {
    bg.setAttribute('transform', elem.getAttribute('transform'));
  }
  elem.parentNode.insertBefore(bg, elem);
}

function addLabel (test, parent, x, y, text) {
  var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  txt.setAttribute('x', x);
  txt.setAttribute('y', y);
  txt.setAttribute('class', 'label ' + test);
  txt.textContent = text;
  parent.appendChild(txt);
  makeBG(test, txt);
}

function addBubble (test, parent, x, y, r, color, tooltip) {
  var txt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  txt.setAttribute('cx', x);
  txt.setAttribute('cy', y);
  txt.setAttribute('r', r);
  txt.setAttribute('stroke', color);
  txt.setAttribute('class', 'bubble ' + test);
  var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = tooltip;
  txt.appendChild(title);
  parent.appendChild(txt);
}

function addBubbles (test, parent, x, y, value) {
  addBubble(test, parent, x, y, 1, 'var(--red-strong)');// vpn
  addBubble(test, parent, x, y, value.vpn / value.direct, 'var(--base-white)');// vpn
  addBubble(test, parent, x, y, value.vpn / value.neuron, 'var(--green-strong)', 'Latency: ' + value.formatFac());// vpn
}

function addLine (test, parent, fromNode, toNode, color, pingValue, dlValue) {
  var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const cx = fromNode.cx ? fromNode.cx.baseVal.value : 29;
  const cy = fromNode.cy ? fromNode.cy.baseVal.value : 30;
  ln.setAttribute('id', fromNode.id + '-' + toNode.id);
  ln.setAttribute('x1', cx);
  ln.setAttribute('y1', cy);
  ln.setAttribute('x2', toNode.cx.baseVal.value);
  ln.setAttribute('y2', toNode.cy.baseVal.value);
  ln.setAttribute('stroke', color);
  ln.setAttribute('class', 'path ' + test);
  parent.appendChild(ln);

  if (dlValue) {
    addBubbles(test, parent, (cx + toNode.cx.baseVal.value) / 2 - 0, (cy + toNode.cy.baseVal.value) / 2, dlValue);
    addLabel(test, parent, (cx + toNode.cx.baseVal.value) / 2 - 4, (cy + toNode.cy.baseVal.value) / 2 + 6, 'D: ' + dlValue.formatFac());
  }
  if (pingValue) {
    addLabel(test, parent, (cx + toNode.cx.baseVal.value) / 2 - 4, (cy + toNode.cy.baseVal.value) / 2 - 5, 'S: ' + pingValue.formatFac());
    // addBubbles(test, parent, (cx + toNode.cx.baseVal.value)/2 - 0, (cy + toNode.cy.baseVal.value)/2 - 1, pingValue);
  }
}
function getAverage (test, ping) {
  let sum = 0;
  let num = 0;
  for (const site of test.getElementsByTagName('site')) {
    let ave = 0;

    if (ping) {
      const parts = site.textContent.split('/');
      ave = parseInt(parts[parts.length - 2]);
    } else {
      const parts1 = site.textContent.split(':');
      const parts2 = parts1[parts1.length - 3].split(' ');
      ave = parseInt(parts2[0]);
    }
    sum += ave;
    num++;
  }
  return sum / num;
}

function addTest (testsDropdown, test) {
  const allElem = document.createElement('A');
  allElem.setAttribute('id', test);
  allElem.textContent = test;
  testsDropdown.appendChild(allElem);
  allTests.push(test);
}

async function populateMetrics (vpnFile, pingFile, dlFile) {
  const svgRoot = document.querySelector('#svgRoot');
  const dynaElems = svgRoot.querySelector('#dynaElems');
  const user = svgRoot.querySelector('#user');
  const testsDropdown = document.querySelector('#testsDropdown');

  const pingValue = new Metric();
  pingValue.vpn = vpnDefaults.ping; // todo: read from a file

  const dlValue = new Metric();
  dlValue.vpn = vpnDefaults.dl; // todo: read from a file

  // create dropdown entry for all
  while (dynaElems.firstChild) { dynaElems.removeChild(dynaElems.firstChild); }

  while (testsDropdown.firstChild) { testsDropdown.removeChild(testsDropdown.firstChild); }
  allTests = [];
  addTest(testsDropdown, 'None');
  addTest(testsDropdown, 'All');

  const vpnResponse = await fetch(vpnFile);
  if (vpnResponse.ok) {
    const vpnDoc = (new window.DOMParser()).parseFromString(await vpnResponse.text(), 'text/xml');
    for (const vpnTest of vpnDoc.getElementsByTagName('test')) {
      const name = vpnTest.getAttribute('name').toLowerCase();
      if (name.includes('ping')) { pingValue.vpn = getAverage(vpnTest, true); } else if (name.includes('download')) { dlValue.vpn = getAverage(vpnTest, false); }
    }
    console.log('VPN Ave: ' + pingValue.vpn + ' ' + dlValue.vpn);
  }

  const pingResponse = await fetch(pingFile);
  const dlResponse = await fetch(dlFile);
  const pingDoc = (new window.DOMParser()).parseFromString(await pingResponse.text(), 'text/xml');
  const dlDoc = (new window.DOMParser()).parseFromString(await dlResponse.text(), 'text/xml');

  const ts = pingDoc.documentElement.getAttribute('timeStamp');
  document.querySelector('#timeStamp').textContent = 'L: ' +
          pingDoc.documentElement.getAttribute('timeStamp') + '   D: ' +
          dlDoc.documentElement.getAttribute('timeStamp');

  for (const pingTest of pingDoc.getElementsByTagName('test')) {
    const fpop = svgRoot.querySelector('#' + pingTest.getAttribute('firstMile'));
    const mpop = svgRoot.querySelector('#' + pingTest.getAttribute('middleMile'));
    const lpop = svgRoot.querySelector('#' + pingTest.getAttribute('lastMile'));
    const name = pingTest.getAttribute('name');

    const dlTest = dlDoc.getElementsByName(name)[0];
    pingValue.neuron = getAverage(pingTest, true);
    dlValue.neuron = getAverage(dlTest, false);

    if (fpop == null) {
      pingValue.direct = pingValue.neuron;
      dlValue.direct = dlValue.neuron;
      continue; // this is direct connection
    }

    addLine(name, dynaElems, user, fpop, 'var(--base-light)');
    if (mpop) {
      addLine(name, dynaElems, fpop, mpop, 'var(--green-strong)', pingValue, dlValue);
      addLine(name, dynaElems, mpop, lpop, 'var(--green-strong)');
    } else {
      addLine(name, dynaElems, fpop, lpop, 'var(--green-strong)', pingValue, dlValue);
    }

    // add the test to the dropdown
    addTest(testsDropdown, name);
  }
  if (allTests.indexOf(activeTest) === -1) { activeTest = 'None'; }
  applyFilter();
}

function populateCurrentMetrics () {
  const slider = document.querySelector('#slider');
  populateMetrics('/metrics/vpn/' + slider.value, '/metrics/ping/' + slider.value, '/metrics/download/' + slider.value);
}

async function initSlider () {
  const slider = document.querySelector('#slider');
  const metrics = await (await fetch('/metrics')).json();
  const max = metrics.count - 1;
  slider.max = max;
  slider.value = max;
  populateCurrentMetrics();
}
initSlider();
