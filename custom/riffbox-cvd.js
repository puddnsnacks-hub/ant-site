(function(){
  var root = document.getElementById('x-riffbox-cvd');
  if(!root) return;
  var groups = root.querySelectorAll('.x-riffbox-g');
  var notes = root.querySelectorAll('.x-riffbox-note');
  var dots = root.querySelectorAll('.x-riffbox-dot');
  var toggle = root.querySelector('.x-riffbox-toggle');
  var badge = root.querySelector('.x-riffbox-badge');
  var status = root.querySelector('.x-riffbox-status');
  var view = 'normal', colorOnly = false;

  var BADGE = {
    normal: 'Normal vision',
    protan: 'Simulation · protanopia',
    deutan: 'Simulation · deuteranopia',
    tritan: 'Simulation · tritanopia',
    gray:   'Grayscale'
  };
  var SAY = {
    notes: {
      normal: 'Normal vision. Minor runs cool, major runs warm, the perfects are gray, the tritone is magenta and the root is black with a ring.',
      protan: 'Protanopia. The minor 2nd and the major 2nd turn the same dark olive, and one triangle points up while the other points down. The major 3rd and the major 6th come close too, and their letters E and A separate them.',
      deutan: 'Deuteranopia. The major 3rd and the major 6th turn the same olive gold. Both are major, so both are triangles, and the letters E and A keep them apart.',
      tritan: 'Tritanopia. The major 6th and the major 7th turn the same red. They share the major triangle, and the letters A and B carry the difference.',
      gray:   'Grayscale. Six of the fills land on nearly the same mid gray. Shape still splits them into major, minor, fifth and tritone, and the letters E, A and B separate the three majors.'
    },
    dots: {
      normal: 'Color only. Twelve dots, no names, and a legend to memorize. So far everyone sees the same twelve.',
      protan: 'Color only, protanopia. The minor 2nd and the major 2nd are now the same dot, and nothing else tells them apart.',
      deutan: 'Color only, deuteranopia. The major 3rd and the major 6th are now the same dot.',
      tritan: 'Color only, tritanopia. The major 6th and the major 7th are now the same dot.',
      gray:   'Color only, grayscale. Six of the twelve dots are one gray.'
    }
  };

  function render(){
    var f = view === 'normal' ? null : 'url(#x-riffbox-f-' + view + ')';
    for(var i = 0; i < groups.length; i++){
      if(f) groups[i].setAttribute('filter', f); else groups[i].removeAttribute('filter');
      notes[i].setAttribute('visibility', colorOnly ? 'hidden' : 'visible');
      dots[i].setAttribute('visibility', colorOnly ? 'visible' : 'hidden');
    }
    badge.textContent = BADGE[view] + (colorOnly ? ' · color only' : '');
    status.textContent = SAY[colorOnly ? 'dots' : 'notes'][view];
    root.setAttribute('data-view', view);
    root.setAttribute('data-color-only', colorOnly ? 'true' : 'false');
  }

  var radios = root.querySelectorAll('input[name="x-riffbox-view"]');
  // The shell's .s-seg reads the selected segment from .is-on on the label.
  function syncSeg(){
    for(var k = 0; k < radios.length; k++){
      radios[k].parentNode.classList.toggle('is-on', radios[k].checked);
    }
  }
  for(var r = 0; r < radios.length; r++){
    radios[r].addEventListener('change', function(e){
      if(e.target.checked){ view = e.target.value; syncSeg(); render(); }
    });
    if(radios[r].checked) view = radios[r].value;
  }
  syncSeg();
  toggle.addEventListener('click', function(){
    colorOnly = !colorOnly;
    toggle.setAttribute('aria-pressed', colorOnly ? 'true' : 'false');
    render();
  });
  render();
})();
