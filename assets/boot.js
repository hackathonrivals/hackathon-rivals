/* Boot: make sure the Supabase library is present before the app scripts run. If the main CDN failed or is blocked, try backups. */
(function(){
  if (window.supabase) return;
  var backups = ['https://unpkg.com/@supabase/supabase-js@2', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'];
  for (var i = 0; i < backups.length && !window.supabase; i++) {
    try { var x = new XMLHttpRequest(); x.open('GET', backups[i], false); x.send(); if (x.status === 200) (0, eval)(x.responseText); } catch (e) {}
  }
  if (!window.supabase) console.error('Supabase library could not be loaded from any CDN');
})();
