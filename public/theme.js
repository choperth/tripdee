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
