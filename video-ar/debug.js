(function () {
  var entries = [];
  var visible = false;

  var toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'DBG';
  Object.assign(toggleBtn.style, {
    position: 'fixed', bottom: '12px', right: '12px',
    width: '48px', height: '48px', borderRadius: '50%',
    border: 'none', background: 'rgba(255,80,80,0.92)',
    color: '#fff', fontWeight: 'bold', fontSize: '11px',
    letterSpacing: '0.5px', cursor: 'pointer',
    zIndex: '99999', boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  });

  var panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed', bottom: '68px', right: '8px', left: '8px',
    maxHeight: '55vh', overflowY: 'auto',
    background: 'rgba(0,0,0,0.92)', color: '#eee',
    fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.45',
    borderRadius: '10px', padding: '10px 12px',
    zIndex: '99998', display: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
    WebkitOverflowScrolling: 'touch',
  });

  toggleBtn.addEventListener('click', function () {
    visible = !visible;
    panel.style.display = visible ? 'block' : 'none';
    if (visible) panel.scrollTop = panel.scrollHeight;
  });

  function ts() {
    var d = new Date();
    return d.toTimeString().slice(0, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }

  function addEntry(level, args) {
    var text = Array.from(args).map(function (a) {
      if (a instanceof Error) return a.message + (a.stack ? '\n' + a.stack : '');
      if (typeof a === 'object') { try { return JSON.stringify(a); } catch (e) { return String(a); } }
      return String(a);
    }).join(' ');

    var colors = { log: '#ccc', warn: '#f5c518', error: '#ff5f5f', info: '#6af' };
    var row = document.createElement('div');
    Object.assign(row.style, {
      color: colors[level] || '#ccc',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      paddingBottom: '3px', marginBottom: '3px',
      wordBreak: 'break-word', whiteSpace: 'pre-wrap',
    });
    row.textContent = '[' + ts() + '] ' + text;
    panel.appendChild(row);
    if (panel.children.length > 150) panel.removeChild(panel.children[0]);
    if (visible) panel.scrollTop = panel.scrollHeight;
    entries.push({ level: level, text: text, time: ts() });
  }

  var orig = {
    log:   console.log.bind(console),
    warn:  console.warn.bind(console),
    error: console.error.bind(console),
    info:  console.info.bind(console),
  };
  console.log   = function () { orig.log.apply(console, arguments);   addEntry('log',   arguments); };
  console.warn  = function () { orig.warn.apply(console, arguments);  addEntry('warn',  arguments); };
  console.error = function () { orig.error.apply(console, arguments); addEntry('error', arguments); };
  console.info  = function () { orig.info.apply(console, arguments);  addEntry('info',  arguments); };

  window.addEventListener('error', function (e) {
    addEntry('error', [e.message + ' (' + e.filename + ':' + e.lineno + ')']);
  });
  window.addEventListener('unhandledrejection', function (e) {
    addEntry('error', ['Unhandled promise rejection: ' + (e.reason || e)]);
  });

  function mount() {
    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);
    addEntry('info', ['Debug overlay ready — ' + navigator.userAgent]);
  }

  if (document.body) { mount(); }
  else { document.addEventListener('DOMContentLoaded', mount); }
})();
