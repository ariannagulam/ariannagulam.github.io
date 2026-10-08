/* Urban Ranch – shared behaviour */
(function(){
  'use strict';
  /* mobile nav */
  var b=document.querySelector('.ur-burger'),n=document.querySelector('.ur-nav');
  if(b&&n){
    b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});
    n.addEventListener('click',function(e){if(e.target.closest('a')){n.classList.remove('open');b.setAttribute('aria-expanded','false');}});
  }

  /* links from config.js */
  var L=window.UR_LINKS||{};
  document.querySelectorAll('[data-link]').forEach(function(a){
    var k=a.getAttribute('data-link');
    if(L[k]){a.setAttribute('href',L[k]);if(/^https?:/.test(L[k])){a.setAttribute('target','_blank');a.setAttribute('rel','noopener');}}
  });

  /* opening hours (Europe/Berlin) */
  var HOURS={ /* day 0 = Sonntag */
    skyline:{0:null,1:[11,20],2:[11,20],3:[11,20],4:[11,20],5:[11,20],6:[11,20]},
    berger:{0:[12,22],1:[13,22],2:[13,22],3:[13,22],4:[13,22],5:[12,22],6:[12,22]},
    darmstadt:{0:[14,22],1:[12,22],2:[12,22],3:[12,22],4:[12,22],5:[12,23],6:[12,23]}
  };
  var DAYS=['So','Mo','Di','Mi','Do','Fr','Sa'];
  function berlinNow(){
    try{
      var p=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Berlin',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
      var o={};p.forEach(function(x){o[x.type]=x.value;});
      var d=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday);
      return {day:d,h:(parseInt(o.hour,10)%24)+parseInt(o.minute,10)/60};
    }catch(e){var t=new Date();return {day:t.getDay(),h:t.getHours()+t.getMinutes()/60};}
  }
  function pad(x){return (x<10?'0':'')+x;}
  function hh(x){return pad(x)+':00';}
  function status(loc){
    var t=berlinNow(),H=HOURS[loc],today=H[t.day];
    var open=!!today&&t.h>=today[0]&&t.h<today[1];
    var next=null;
    if(!open){
      if(today&&t.h<today[0]){next={day:'Heute',h:today[0]};}
      else{for(var i=1;i<=7;i++){var d=(t.day+i)%7;if(H[d]){next={day:i===1?'Morgen':DAYS[d],h:H[d][0]};break;}}}
    }
    return {open:open,today:today,next:next,
      todayLabel:today?hh(today[0])+'–'+hh(today[1]):'geschlossen',
      closeLabel:today?hh(today[1]):null};
  }
  window.URHours={status:status,hours:HOURS};

  /* generic hooks:  data-hours="skyline" with children data-h="state|today|dot|badge|line1|line2|openText" */
  document.querySelectorAll('[data-hours]').forEach(function(el){
    var s=status(el.getAttribute('data-hours'));
    el.classList.toggle('is-open',s.open);el.classList.toggle('is-closed',!s.open);
    (el.hasAttribute('data-h')?[el]:[]).concat(Array.prototype.slice.call(el.querySelectorAll('[data-h]'))).forEach(function(c){
      switch(c.getAttribute('data-h')){
        case 'state':c.textContent=s.open?'Jetzt geöffnet':'Geschlossen';break;
        case 'today':c.textContent=s.todayLabel;break;
        case 'until':c.textContent=s.open?'bis '+s.closeLabel+' Uhr':(s.next?'öffnet '+s.next.day.toLowerCase()+' um '+hh(s.next.h)+' Uhr':'');break;
        case 'badge':c.innerHTML=s.open?'OPEN<br>NOW':'CLOSED';c.classList.toggle(c.getAttribute('data-closed')||'closed',!s.open);break;
        case 'line1':c.textContent=s.open?'Geöffnet':'Geschlossen';break;
        case 'line2':c.innerHTML=s.open?'Heute <b>'+s.todayLabel+'</b>':(s.next?'Öffnet '+s.next.day.toLowerCase()+' um <b>'+hh(s.next.h)+' Uhr</b>':'');break;
        case 'mini':c.textContent=s.open?'Geöffnet bis '+hh(s.today[1]).slice(0,5)+' Uhr':(s.next?'Öffnet '+s.next.day.toLowerCase()+' um '+hh(s.next.h)+' Uhr':'');c.classList.toggle(c.getAttribute('data-open')||'open',s.open);break;
        case 'dot':c.classList.toggle('closed',!s.open);break;
      }
    });
  });

  /* click-to-load Google Map (no Google request before consent) */
  document.querySelectorAll('.ur-map').forEach(function(m){
    var btn=m.querySelector('button[data-src]');if(!btn)return;
    btn.addEventListener('click',function(){
      var f=document.createElement('iframe');f.src=btn.getAttribute('data-src');f.loading='lazy';
      f.setAttribute('referrerpolicy','no-referrer-when-downgrade');f.setAttribute('title','Google Maps');f.setAttribute('allowfullscreen','');
      var ph=m.querySelector('.ur-map-ph');if(ph)ph.style.display='none';m.appendChild(f);
    });
  });

  /* simple FAQ / flip toggles are inline in the page fragments */
})();
