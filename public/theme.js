// TripDee Theme Initializer (Prevents FOUC in dark/light mode)
try {
  var t = localStorage.getItem('td-theme');
  if (t === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
} catch {}

// Prevent browser extensions (e.g. McAfee WebAdvisor, password managers) from causing React hydration mismatch errors
try {
  if (typeof MutationObserver !== 'undefined') {
    var extObserver = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'fdprocessedid' && m.target) {
          m.target.removeAttribute('fdprocessedid');
        }
      }
    });
    extObserver.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['fdprocessedid']
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          extObserver.disconnect();
        }, 3500);
      });
    }
  }
} catch {}
