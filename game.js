(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'smudge-lost-found-case-001-v1';
  const REL_KEY = 'smudge-kailee-yacine-case-v1';
  const freshRelationship = () => ({clues:[], testimony:false, solved:false});
  let relationship = freshRelationship();
  let activeCase = 'watch';
  let translation = false;
  const SETTINGS_KEY = 'smudge-lost-found-settings-v1';
  const icons = {
    office:'<path d="M3 21h18M5 21V8l7-5 7 5v13M3 9l9-7 9 7M9 21v-7h6v7M8 9h1m6 0h1"/>',
    notebook:'<path d="M6 3h13v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 14h13M8 7h7M8 10h5M3 7h3M3 12h3"/>',
    collection:'<path d="M3 8h18v12H3zM8 8V4h8v4M3 12h18M10 11v3h4v-3"/>',
    sound:'<path d="m11 5-5 4H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute:'<path d="m11 5-5 4H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
    settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1z" transform="translate(1 0) scale(.92)"/>',
    watch:'<circle cx="12" cy="14" r="7"/><path d="M10 3h4M12 3v4M12 10v4l3 2"/>',
    letter:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7m-18 12 6-6m12 6-6-6"/>',
    ticket:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM15 6v2m0 3v2m0 3v2M7 10h4m-4 4h4"/>',
    check:'<path d="m5 12 4 4 10-10"/>',
    arrow:'<path d="m9 5 7 7-7 7M16 12H3"/>',
    moon:'<path d="M19 15A9 9 0 0 1 9 3a9 9 0 1 0 10 12Z"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.watch}</svg>`;
  const initial = () => ({ clues:[], asked:[], exposed:false, ending:null });
  let state = initial();
  let settings = { motion:!matchMedia('(prefers-reduced-motion: reduce)').matches };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.clues) && Array.isArray(saved.asked)) {
      state = { ...initial(), clues:saved.clues.filter(id=>['initials','time','ticket','letter'].includes(id)), asked:saved.asked.filter(id=>['initials','ticket','time'].includes(id)), exposed:!!saved.exposed, ending:['elise','traveler'].includes(saved.ending)?saved.ending:null };
    }
    const personal = JSON.parse(localStorage.getItem(REL_KEY));
    if(personal && Array.isArray(personal.clues)) relationship={clues:personal.clues.filter(id=>['photo','coffin','voice'].includes(id)), testimony:!!personal.testimony, solved:!!personal.solved};
    const storedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (storedSettings && typeof storedSettings.motion==='boolean') settings.motion = storedSettings.motion;
  } catch {}
  let view = 'office';
  let currentClue = null;
  let visitorTopic = null;
  let selectedEvidence = [];
  let deductionFeedback = '';
  let toastTimer;
  let smudgeLine = null;
  let hasStorage = true;
  const clues = {
    initials:{title:'The engraved initials',body:'E.M. is engraved inside the lid. Someone cared enough to make this watch their own.',short:'E.M. engraved inside the lid.',icon:'watch',label:'Initials: E.M.',x:24,y:46},
    time:{title:'The stopped hands',body:'The hands stopped at 11:15. A stopped watch tells you a time, but not whether it was morning or night.',short:'Stopped at 11:15. AM or PM is unknown.',icon:'watch',label:'Stopped at 11:15',x:65,y:48},
    ticket:{title:'The platform ticket',body:'A ticket was tucked under the watch. The station stamp reads 23:17, platform 3. The name: Lucien Dumas.',short:'Lucien Dumas. Platform 3. Stamped 23:17.',icon:'ticket',label:'Platform 3 · 23:17',x:15,y:89},
    letter:{title:'Élise’s missing-watch note',body:'Élise Moreau reported a missing brass watch with E.M. inside its lid. She asked the office to keep it safe until she returns.',short:'Élise Moreau describes the watch and its E.M. engraving.',icon:'letter',label:'A note from Élise'}
  };
  const save = () => { try { localStorage.setItem(REL_KEY,JSON.stringify(relationship)); localStorage.setItem(KEY,JSON.stringify(state)); } catch { hasStorage=false; } };
  function toast(message) { $('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2900); }
  function learn(id) { if(!state.clues.includes(id)){state.clues.push(id);save();toast('Evidence added: '+clues[id].title);playBell();} }
  function count(){return ['initials','time','ticket'].filter(id=>state.clues.includes(id)).length;}
  function pips(){return `<div class="investigation-status"><span>Watch clues ${count()} / 3</span><span class="clue-pips">${[0,1,2].map(i=>`<i class="${i<count()?'on':''}"></i>`).join('')}</span></div>`;}
  function paper(speaker,line,fox=false){return `<div class="paper portrait-dialogue"><span class="portrait ${fox?'fox':''}" aria-hidden="true"></span><div class="speaker">${speaker}</div><div class="dialogue-text">${line}</div></div>`;}
  const action = (label,cmd,cls='primary-button',disabled=false) => `<button class="${cls}" data-action="${cmd}" ${disabled?'disabled':''}>${label}</button>`;
  const divider = '<div class="case-divider" aria-hidden="true">✧</div>';
  function stageClass(){ if(activeCase==='relationship')return 'office'; if(view==='inspect')return 'inspect';if(['visitor','deduction','decision'].includes(view))return 'visitor';return 'office'; }
  function focusPanel(){if(innerWidth<=800) requestAnimationFrame(()=>$('panel').scrollIntoView({behavior:settings.motion?'smooth':'auto',block:'start'}));}
  function navigate(next,focus=false){view=next;currentClue=null;smudgeLine=null;visitorTopic=null;selectedEvidence=[];deductionFeedback='';render();if(focus)focusPanel();}
  function render(){
    document.body.classList.toggle('reduce-motion',!settings.motion);
    document.querySelector('.case-tag').textContent=view==='cases'?'CASE FILES':activeCase==='relationship'?'CASE FILE 002':'CASE FILE 001';
    document.querySelector('.case-bar > span:nth-child(2)').textContent=view==='cases'?'The night shift':activeCase==='relationship'?'The MAX CRUSH File':'The Last Train';
    $('scene').className='scene '+stageClass();
    $('scene-caption').textContent=stageClass()==='inspect'?'A little closer…':stageClass()==='visitor'?'An unexpected claimant':'Lost property office';
    $('scene-note').textContent=view==='inspect'?'Tap the three details to inspect the watch.':stageClass()==='visitor'?'Listen carefully. Details have a way of disagreeing.':'Every object has a story. Tap one.';
    $('scene-footer-text').textContent=stageClass()==='inspect'?'Look closely. Assume nothing.':stageClass()==='visitor'?'Everyone has a story. Some have two.':'Objets trouvés. Patience perdue.';
    if(activeCase==='relationship'&&view!=='cases'){ $('scene-caption').textContent='A delivery for Kailee';$('scene-note').textContent='Three keepsakes. One unusually incriminating file.';$('scene-footer-text').textContent='Certaines choses ne sont pas perdues. Juste gardées.'; }
    renderHotspots();
    const panels={cases:caseFilesPanel,office:officePanel,inspect:inspectPanel,letter:letterPanel,visitor:visitorPanel,notebook:notebookPanel,collection:collectionPanel,deduction:deductionPanel,decision:decisionPanel,ending:endingPanel};
    $('panel').innerHTML=`<div class="screen-enter">${((activeCase==='relationship'&&relationshipPanels[view])||panels[view]||officePanel)()}</div>`;
    $('panel').scrollTop=0;
    document.querySelectorAll('[data-nav]').forEach(button=>{
      const name=button.dataset.nav;button.classList.toggle('active',view===name || (name==='office'&&!['notebook','collection','cases'].includes(view)));
      button.setAttribute('aria-current',button.classList.contains('active')?'page':'false');
      button.innerHTML=`${svg(name==='cases'?'collection':name)}<span>${({office:'Office',notebook:'Notebook',collection:'Collection',cases:'Cases'})[name]}</span>${name==='notebook'&&(activeCase==='relationship'?relationship.clues.length:state.clues.length)?`<span class="nav-count">${activeCase==='relationship'?relationship.clues.length:state.clues.length}</span>`:''}`;
    });
    $('settings-toggle').innerHTML=svg('settings');
    $('sound-toggle').innerHTML=svg(soundEnabled?'sound':'mute');
  }
  function renderHotspots(){
    let html='';
    if(view==='cases'){ $('hotspots').innerHTML='';return; }
    if(activeCase==='relationship'&&view!=='cases'){ $('hotspots').innerHTML=relationshipHotspots();return; }
    if(stageClass()==='office'){
      html=`<button class="hotspot smudge" data-action="pet-smudge" aria-label="Talk to Smudge"></button><span class="smudge-blink" aria-hidden="true"></span><span class="smudge-blink right" aria-hidden="true"></span>`;
      if(!state.ending)html+=`<button class="hotspot object watch" data-action="inspect" aria-label="Inspect the pocket watch"><span class="hotspot-label">THE WATCH</span></button><button class="hotspot object letter" data-action="letter" aria-label="Read the letter"><span class="hotspot-label">THE LETTER</span></button><button class="hotspot object ticket" data-action="desk-ticket" aria-label="Examine the ticket"><span class="hotspot-label">THE TICKET</span></button>`;
    }
    if(view==='inspect')for(const id of ['initials','time','ticket']){const c=clues[id];html+=`<button class="hotspot clue ${state.clues.includes(id)?'found':''}" data-action="clue-${id}" style="left:${c.x}%;top:${c.y}%" aria-label="${state.clues.includes(id)?'Review':'Examine'} ${c.title.toLowerCase()}"></button>`;}
    $('hotspots').innerHTML=html;
  }
  function officePanel(){
    if(state.ending)return endingPanel();
    const intro=count()===0;
    return `<p class="eyebrow">A midnight mystery</p><h1>The Last Train</h1><p class="intro-copy">The last train has gone.<br>A pocket watch hasn’t.<br>Someone will be back for it.</p>${divider}${paper('Smudge',smudgeLine || (intro?'Someone lost a watch.<br>I lost my patience.':state.exposed?'A contradiction. How inconvenient for him. Find the rightful owner.':count()===3?'Three clues. One visitor.<br>Let’s see if his story keeps time.':'Good. You’re looking closely.<br>Try to make a habit of it.'))}<div class="action-list">${action(intro?'Inspect the watch':'Examine the watch','inspect')}${count()===3?action(state.exposed?'Decide what to do':'Question the traveler',state.exposed?'decision':'visitor'):''}${state.clues.length>0?action('Read the missing-watch note','letter','secondary-button'):''}</div>${pips()}<p class="subtle-text">Tap the objects on the desk to investigate.</p><button class="case-invitation" data-action="case-relationship"><span>NEW · KAILEE & YACINE</span>A personal file has arrived. <em>Open it.</em></button>`;
  }
  function inspectPanel(){
    const c=currentClue?clues[currentClue]:null;
    return `<button class="back-link" data-action="office">${svg('arrow')} Back to the office</button><p class="eyebrow">Evidence inspection</p><h2>The pocket watch</h2><p class="intro-copy">A brass watch, a cracked face,<br>and something tucked underneath.</p>${divider}${c?paper('FIELD NOTE · '+(state.clues.indexOf(currentClue)+1),c.body):paper('Smudge','The truth is usually in the details.<br>People are terribly careless with those.')}${pips()}<div class="action-list">${count()===3?action('Question the traveler','visitor'):action('Open your notebook','notebook','secondary-button')}</div><p class="subtle-text">${count()===3?'All watch clues recorded. A visitor is waiting.':'Tap the glowing marks on the watch.'}</p>`;
  }
  function letterPanel(){return `<button class="back-link" data-action="office">${svg('arrow')} Back to the office</button><p class="eyebrow">Lost-property correspondence</p><h2>A familiar pair of initials</h2>${divider}<div class="paper letter-body"><div class="speaker">TO THE NIGHT CLERK</div><p>I left a brass pocket watch at the station. There is a crack in the glass and <strong>E.M.</strong> engraved inside the lid.</p><p>It belonged to my mother. Please keep it safe. I will return tomorrow.</p><p>With thanks,<br><strong>Élise Moreau</strong></p></div><div class="action-list">${action(state.clues.includes('letter')?'Note saved in your notebook':'Keep this note as evidence','save-letter')}${state.exposed?action('Return to the traveler','decision','secondary-button'):''}</div>`;}
  function visitorPanel(){
    const responses={initials:'“E.M.? My grandfather. Edmond Marchand.”<small>He answers quickly. A little too quickly.</small>',ticket:'“Yes, that ticket is mine. I must have dropped it.”<small>He confirms the ticket stamped 23:17 belongs to him.</small>',time:'“The hands stopped at eleven fifteen? I wouldn’t know. I had already left.”<small>A stopped watch alone cannot establish when he left.</small>'};
    return `<button class="back-link" data-action="office">${svg('arrow')} Back to the office</button><p class="eyebrow">A claimant at the counter</p><h2>The traveler</h2><p class="intro-copy">Lucien Dumas says the watch is his.<br>His story sounds rehearsed.</p>${divider}${paper('THE TRAVELER',visitorTopic?responses[visitorTopic]:'“That’s my grandfather’s watch. I left before the station clock struck eleven.”',true)}<div class="action-list">${['initials','ticket','time'].map(id=>`<button class="choice-button" data-action="ask-${id}"><span>${id==='initials'?'Ask about the initials':id==='ticket'?'Show the platform ticket':'Ask about the stopped hands'}</span><span class="choice-mark">${state.asked.includes(id)?'✓':'✧'}</span></button>`).join('')}${action('Check the timeline','deduction','secondary-button')}</div><p class="subtle-text">His account and your evidence may not agree.</p>`;
  }
  function notebookPanel(){return `<p class="eyebrow">Your field notebook</p><h2>Leave nothing<br>unnoticed.</h2><p class="intro-copy">Case 001 · The Last Train</p><ul class="clue-list">${Object.entries(clues).map(([id,c])=>state.clues.includes(id)?`<li class="clue-card"><span class="clue-icon">${svg(c.icon)}</span><div><h3>${c.title}</h3><p>${c.short}</p></div></li>`:`<li class="clue-card empty"><span class="clue-icon">?</span><p>${id==='letter'?'An unopened letter on the desk.':'A detail waiting to be found.'}</p></li>`).join('')}${state.asked.length?`<li class="clue-card"><span class="clue-icon">${svg('eye')}</span><div><h3>The traveler’s statement</h3><p>Lucien says he left before 23:00.${state.asked.includes('ticket')?' He confirms the 23:17 ticket is his.':''}</p></div></li>`:''}</ul>${state.exposed?'<p class="feedback">Contradiction established: his own ticket places him here after the time he claims to have left.</p>':''}<div class="action-list">${action(state.ending?'Read the case report':state.exposed?'Decide what to do':count()===3?'Question the traveler':'Continue investigating',state.ending?'ending':state.exposed?'decision':count()===3?'visitor':'inspect')}</div>`;}
  function deductionPanel(){const cards=[['claim','His statement','Left before 23:00'],['ticket','The platform ticket','Stamped 23:17'],['initials','The engraved initials','E.M.'],['time','The stopped hands','11:15 · AM or PM unknown']];return `<button class="back-link" data-action="visitor">${svg('arrow')} Back to the traveler</button><p class="eyebrow">Make the connection</p><h2>Something<br>doesn’t add up.</h2><p class="intro-copy">Choose the <strong>two pieces of evidence</strong> that contradict each other.</p><div class="evidence-grid">${cards.map(([id,title,detail])=>`<button class="evidence-button ${selectedEvidence.includes(id)?'selected':''}" data-action="evidence-${id}" aria-pressed="${selectedEvidence.includes(id)}">${title}<small>${detail}</small></button>`).join('')}</div>${deductionFeedback?`<p class="feedback" role="status">${deductionFeedback}</p>`:''}<div class="action-list">${action('Present the contradiction','present','primary-button',selectedEvidence.length!==2)}</div><button class="hint-link" data-action="hint">A small nudge from Smudge?</button>`;}
  function decisionPanel(){
    if(!state.exposed)return visitorPanel();
    return `<p class="eyebrow">The story unravels</p><h2>A watch<br>isn’t a name.</h2>${divider}${paper('THE TRAVELER','“All right. I never left. I found it on the platform. I thought… nobody would miss it.”',true)}<p class="inspect-summary">${state.clues.includes('letter')?'Élise’s note describes both the crack and the E.M. engraving. She will return tomorrow.':'You’ve challenged his story. But whose watch is it? There is still a letter on Smudge’s desk.'}</p><div class="action-list">${state.clues.includes('letter')?action('Keep it safe for Élise','finish-elise'):action('Read the letter on the desk','letter')}${action('Let the traveler take it','finish-traveler','secondary-button')}</div><p class="subtle-text">Your choice becomes part of the case record.</p>`;
  }
  function endingPanel(){const good=state.ending==='elise';return `<p class="eyebrow">Case file 001 · Closed</p><h2>${good?'Some things<br>find their way home.':'A story<br>left unfinished.'}</h2>${divider}<div class="paper ending-paper"><div class="stamp">${good?'SAFEKEEPING':'RELEASED TO CLAIMANT'}</div><h3>${good?'For Élise Moreau':'For Lucien Dumas'}</h3><p>${good?'The watch rests in drawer 427, with Élise’s note folded beside it. Tomorrow, someone will have one less thing to miss.':'Lucien pockets the watch and disappears into the rain. You disproved his story, but chose to let him leave with it.'}</p></div><div style="margin-top:18px">${paper('Smudge',good?'Well done. A sentimental ending.<br>I’ll pretend not to have noticed.':'An interesting decision.<br>Not the word I would have chosen.')}</div><div class="action-list">${action('Open the collection','collection')}${action('Reopen this case','replay','secondary-button')}</div>`;}
  function collectionPanel(){return `<p class="eyebrow">The things we keep</p><h2>A drawer<br>for every story.</h2>${state.ending?`<div class="collection-art" role="img" aria-label="The brass pocket watch"></div><p class="decision-tag">CASE 001 · ${state.ending==='elise'?'SAFEKEEPING':'RELEASED'}</p><h3>The pocket watch</h3><p class="intro-copy" style="margin-top:12px">${state.ending==='elise'?'A small reminder: looking after something can mean letting it go to the right person.':'A reminder of a choice made on a rainy night.'}</p><div class="action-list">${action('Read the case report','ending')}</div>`:`<div class="collection-art" style="filter:grayscale(1);opacity:.3" aria-hidden="true"></div><h3>No stories filed. Yet.</h3><p class="intro-copy" style="margin-top:12px">Finish the pocket-watch mystery to record your first case.</p><div class="action-list">${action('Return to the office','office')}</div>`}<div class="action-list">${action('Open the Kailee & Yacine case','case-relationship','secondary-button')}</div><div class="coming-note">The night shift has only just begun.<br><small>Two playable files: a station mystery and a personal keepsake case.</small></div>`;}
  function handle(cmd){
    playClick();
    if(cmd==='case-relationship'||cmd==='case-watch'){activeCase=cmd==='case-relationship'?'relationship':'watch';navigate('office',true);return;}
    if(cmd==='cases'){navigate('cases',true);return;}
    if(activeCase==='relationship'){relationshipHandle(cmd);return;}
    if(['office','inspect','letter','visitor','notebook','collection','deduction','decision','ending'].includes(cmd)){
      if(cmd==='visitor'&&count()<3){toast('Examine all three watch details first.');return;}
      if(cmd==='decision'&&!state.exposed){navigate('visitor');return;}
      if(cmd==='ending'&&!state.ending){navigate('office');return;}
      navigate(cmd,['notebook','collection','decision','ending'].includes(cmd));return;
    }
    if(cmd.startsWith('clue-')){const id=cmd.slice(5);if(!clues[id])return;learn(id);currentClue=id;render();return;}
    if(cmd==='desk-ticket'){navigate('inspect');currentClue='ticket';learn('ticket');render();return;}
    if(cmd==='save-letter'){learn('letter');if(state.exposed)navigate('decision',true);else navigate('office',true);return;}
    if(cmd==='pet-smudge'){const lines=['I am supervising. It looks remarkably like sitting.','The bell is for visitors. The judgment is complimentary.','Petting the clerk will not improve your deductions.','Yes, I’m fluffy. Focus on the evidence.'];smudgeLine=lines[Math.floor(Math.random()*lines.length)];view='office';render();return;}
    if(cmd.startsWith('ask-')){const id=cmd.slice(4);if(!state.asked.includes(id))state.asked.push(id);visitorTopic=id;save();render();return;}
    if(cmd.startsWith('evidence-')){const id=cmd.slice(9);if(selectedEvidence.includes(id))selectedEvidence=selectedEvidence.filter(i=>i!==id);else if(selectedEvidence.length<2)selectedEvidence.push(id);else selectedEvidence=[selectedEvidence[1],id];deductionFeedback='';render();return;}
    if(cmd==='hint'){deductionFeedback='“Before eleven,” he says. A ticket stamp keeps rather better records than a traveler.';render();return;}
    if(cmd==='present'){
      if(selectedEvidence.length!==2)return;
      if(selectedEvidence.includes('claim')&&selectedEvidence.includes('ticket')){
        if(!state.asked.includes('ticket')){deductionFeedback='A promising connection. First show him the ticket so you can establish that it belongs to him.';render();return;}
        state.exposed=true;save();playBell();toast('Contradiction established.');navigate('decision',true);
      }else{deductionFeedback='Those details may be related, but they do not directly contradict each other. Compare his departure time with a reliable timestamp.';render();}return;
    }
    if(cmd==='finish-elise'||cmd==='finish-traveler'){if(!state.exposed)return;if(cmd==='finish-elise'&&!state.clues.includes('letter'))return;state.ending=cmd==='finish-elise'?'elise':'traveler';save();navigate('ending',true);playBell();return;}
    if(cmd==='replay'){showReset();return;}
  }
  const memoryIcons = {
    photo:'<svg viewBox="0 0 54 78" aria-hidden="true"><path d="M7 2h40v74H7z" fill="#d9c8a8" stroke="#baa16c"/><path d="M12 7h30v18H12zm0 23h30v18H12zm0 23h30v18H12z" fill="#283331"/><g fill="#abafa0"><circle cx="21" cy="14" r="4"/><circle cx="33" cy="14" r="4"/><path d="M15 25v-4q6-7 12 0 6-7 12 0v4z"/><circle cx="23" cy="37" r="4"/><circle cx="31" cy="37" r="4"/><path d="M15 48v-4q8-10 12-2 8-8 12 2v4z"/><circle cx="20" cy="60" r="4"/><circle cx="33" cy="60" r="4"/><path d="M14 71v-4q7-8 13 0 7-8 13 0v4z"/></g></svg>',
    coffin:'<svg viewBox="0 0 58 78" aria-hidden="true"><path d="M17 3h24l12 19-10 51H15L5 22Z" fill="#161c1b" stroke="#c4a366" stroke-width="2"/><path d="M19 9h20l8 15-9 43H20L11 24Z" fill="#323331" stroke="#766648"/><circle cx="29" cy="45" r="9" fill="none" stroke="#d4b774" stroke-width="3"/><path d="m29 33-4 5 4 4 4-4zM22 17q-5 14 7 16 12-2 7-16" fill="none" stroke="#d4b774" stroke-width="2"/></svg>',
    voice:'<svg viewBox="0 0 78 60" aria-hidden="true"><rect x="2" y="4" width="74" height="52" rx="10" fill="#33413c" stroke="#b79d68"/><path d="m11 22 12 8-12 8Z" fill="#e2d2ab"/><g stroke="#d8bb80" stroke-width="2"><path d="M30 25v10m5-16v22m5-18v14m5-24v34m5-28v22m5-17v12m5-20v28m5-18v8"/></g></svg>'
  };
  const memories = {
    photo:{title:'The photo booth strip',icon:'photo',short:'Shared photo booth memories: affection, silly faces, and the two of you.',body:'Kailee and Yacine, together in a photo booth. A kiss, a smile, and several expressions that probably do not belong in a formal archive.',smudge:'“Two humans. Several photographs. Neither appears to be requesting a refund.”'},
    coffin:{title:'The jewelry coffin',icon:'coffin',short:'Yacine 3D-printed Kailee a coffin-shaped box for a ring and necklace.',body:'A little coffin, 3D-printed by Yacine, holding the ring and necklace he gave Kailee. Romantic packaging with a somewhat concerning silhouette.',smudge:'“Some bring flowers. This one brought jewelry in a coffin. A distinctive application.”'},
    voice:{title:'The voice message',icon:'voice',short:'Yacine’s voice message: “I only simp for you.”',body:'An archived line from the voice message Kailee loved:<br><br><strong>“I only simp for you.”</strong><br><small>A written excerpt from your voice message.</small>',smudge:'“An exclusive arrangement, apparently. I have filed the admission under: embarrassingly sincere.”'}
  };
  function memoryProgress(){return `<div class="investigation-status"><span>Keepsakes ${relationship.clues.length} / 3</span><span class="clue-pips">${[0,1,2].map(i=>`<i class="${i<relationship.clues.length?'on':''}"></i>`).join('')}</span></div>`;}
  function caseFilesPanel(){return `<p class="eyebrow">The night clerk’s drawers</p><h2>Every file<br>has a story.</h2><p class="intro-copy">Choose a case. Each keeps its own progress.</p><div class="case-picker"><button class="case-pick" data-action="case-watch"><span class="case-pick-number">CASE 001 · ${state.ending?'CLOSED':'MYSTERY'}</span><strong>The Last Train</strong><span>A lost watch. An unconvincing traveler.</span><em>${state.ending?'Revisit the file':'Continue investigating'}</em></button><button class="case-pick personal" data-action="case-relationship"><span class="case-pick-number">CASE 002 · ${relationship.solved?'CRUSH CONFIRMED':'KAILEE & YACINE'}</span><strong>The MAX CRUSH File</strong><span>Three keepsakes. Two suspiciously smitten humans.</span><em>${relationship.solved?'Revisit your keepsakes':'Open the personal file'}</em></button></div>`;}
  function relationshipHotspots(){
    if(relationship.solved&&view==='ending')return '<button class="hotspot smudge" data-action="pet-smudge" aria-label="Talk to Smudge"></button>';
    return `<button class="hotspot smudge" data-action="pet-smudge" aria-label="Ask Smudge about Kailee and Yacine"></button>${['photo','coffin','voice'].map((id,i)=>`<button class="hotspot memory-object" style="left:${7+i*31}%" data-action="memory-${id}" aria-label="Inspect ${memories[id].title.toLowerCase()}">${memoryIcons[id]}<span>${id==='photo'?'PHOTO BOOTH':id==='coffin'?'THE COFFIN':'VOICE NOTE'}</span>${relationship.clues.includes(id)?'<b aria-hidden="true">✓</b>':''}</button>`).join('')}`;
  }
  function relationshipOffice(){
    if(relationship.solved)return relationshipEnding();
    return `<p class="eyebrow">Kailee & Yacine · A personal file</p><h1>The MAX<br>CRUSH File</h1><p class="intro-copy">A delivery addressed to Kailee.<br>Yacine’s name is all over the evidence.<br>Smudge is withholding judgment. Briefly.</p>${divider}${paper('Smudge',smudgeLine||'A photo strip, a tiny coffin, and a confession. Your humans have an unusual filing system.')}<div class="action-list">${action(relationship.clues.length===3?'Ask the only reliable witness':'Open the keepsakes',relationship.clues.length===3?'visitor':'inspect')}${action('Choose another case','cases','secondary-button')}</div>${memoryProgress()}`;
  }
  function relationshipInspector(){
    const item=currentClue&&memories[currentClue]?memories[currentClue]:null;
    return `<button class="back-link" data-action="office">${svg('arrow')} Back to the office</button><p class="eyebrow">A very personal evidence locker</p><h2>${item?item.title:'Three things<br>worth keeping.'}</h2>${item?`<div class="memory-display">${memoryIcons[item.icon]}</div><div class="paper"><div class="speaker">KAILEE & YACINE · ARCHIVE</div><div class="dialogue-text">${item.body}</div></div><p class="memory-comment">${item.smudge}</p>`:`<p class="intro-copy">Tap each keepsake on the desk, or choose it below.</p><div class="memory-choices">${Object.keys(memories).map(id=>`<button data-action="memory-${id}">${memoryIcons[id]}<span>${memories[id].title}</span><b>${relationship.clues.includes(id)?'✓':'✧'}</b></button>`).join('')}</div>`}${memoryProgress()}<div class="action-list">${relationship.clues.length===3?action('Question Smudge','visitor'):action('Inspect another keepsake','inspect','secondary-button')}</div>`;
  }
  function relationshipConversation(){
    const answers={activation:'Kailee used to say <strong>“MAX CRUSH ACTIVATION.”</strong> Then Yacine left that voice message. I trust you can identify the pattern without a diagram.',halloween:'The Halloween outfits. Kailee with the VR headset. The photo booth strips. These are real memories from your file. I have added no embarrassing dates; the photographs do enough.',smudge:'My name is Smudge. I am Kailee’s cat and the senior authority in this office. Yacine’s application for second-favorite mammal is still under review.'};
    return `<p class="eyebrow">Witness statement · Smudge</p><h2>The cat<br>knows things.</h2>${divider}${paper('Smudge',visitorTopic?answers[visitorTopic]:'Before this case becomes unbearably sentimental, you should ask who activated the crush.')}<div class="action-list">${action('Who activated the crush?','rel-ask-activation','choice-button')}${action('What about our other memories?','rel-ask-halloween','choice-button')}${action('And your role in all this?','rel-ask-smudge','choice-button')}${relationship.testimony?action('Connect the two messages','deduction'):''}</div>`;
  }
  function relationshipDeduction(){
    const options=[['activation','Kailee’s message','MAX CRUSH ACTIVATION'],['voice','Yacine’s voice note','I only simp for you.'],['coffin','The jewelry box','A 3D-printed coffin'],['photo','The photo booth','Memories together']];
    return `<button class="back-link" data-action="visitor">${svg('arrow')} Back to Smudge</button><p class="eyebrow">The final connection</p><h2>Two admissions.<br>One obvious crush.</h2><p class="intro-copy">Which <strong>two messages</strong> show Kailee and Yacine admitting the crush from both sides?</p><div class="evidence-grid">${options.map(([id,title,detail])=>`<button class="evidence-button ${selectedEvidence.includes(id)?'selected':''}" data-action="rel-evidence-${id}" aria-pressed="${selectedEvidence.includes(id)}">${title}<small>${detail}</small></button>`).join('')}</div>${deductionFeedback?`<p class="feedback" role="status">${deductionFeedback}</p>`:''}<div class="action-list">${action('File the conclusion','rel-present','primary-button',selectedEvidence.length!==2)}</div>`;
  }
  function relationshipNotebook(){return `<p class="eyebrow">Kailee & Yacine · Field notebook</p><h2>An exceptionally<br>poorly hidden crush.</h2><ul class="clue-list">${Object.entries(memories).map(([id,c])=>relationship.clues.includes(id)?`<li class="clue-card"><span class="memory-small">${memoryIcons[id]}</span><div><h3>${c.title}</h3><p>${c.short}</p></div></li>`:`<li class="clue-card empty"><span class="clue-icon">?</span><p>A keepsake waiting on the desk.</p></li>`).join('')}${relationship.testimony?`<li class="clue-card"><span class="clue-icon">${svg('letter')}</span><div><h3>Kailee’s original declaration</h3><p>“MAX CRUSH ACTIVATION.” Recorded by Smudge as testimony.</p></div></li>`:''}</ul><div class="action-list">${action(relationship.solved?'Read your case report':relationship.testimony?'Make the connection':relationship.clues.length===3?'Question Smudge':'Return to the keepsakes',relationship.solved?'ending':relationship.testimony?'deduction':relationship.clues.length===3?'visitor':'inspect')}</div>`;}
  function relationshipEnding(){
    const french=`<p>Kailee,</p><p>J’aurais pu t’offrir des fleurs. À la place, j’ai imprimé un cercueil pour y mettre des bijoux. Chacun sa définition du romantisme.</p><p>Entre nos photos de photomaton, Halloween et toi avec un casque VR, tu m’as donné beaucoup trop de raisons de sourire à mon téléphone comme un idiot.</p><p>Tu avais annoncé « MAX CRUSH ACTIVATION ». Je confirme que le système fonctionne. Aucun bouton pour le désactiver n’a été prévu.</p><p>Et oui : <strong>“I only simp for you.”</strong> Pour Smudge, c’est du respect hiérarchique. La nuance est importante.</p><p>Je t’aime. Voilà, c’est écrit. Si quelqu’un demande, cette lettre a été rédigée sous la contrainte d’un chat.</p><p>Ton Yacine.<br><small>Approuvé par Smudge. À contrecœur.</small></p>`;
    const english=`<p>Kailee,</p><p>I could have brought you flowers. Instead, I printed a coffin to put jewelry in. We all have our own definition of romance.</p><p>Between our photo booth pictures, Halloween, and you wearing a VR headset, you’ve given me far too many reasons to grin at my phone like an idiot.</p><p>You announced “MAX CRUSH ACTIVATION.” I can confirm the system works. No off switch was included.</p><p>And yes: <strong>“I only simp for you.”</strong> With Smudge, it’s respect for the chain of command. An important distinction.</p><p>I love you. There, it’s in writing. If anyone asks, a cat forced me to write this.</p><p>Your Yacine.<br><small>Approved by Smudge. Reluctantly.</small></p>`;
    return `<p class="eyebrow">Case file 002 · Kailee & Yacine</p><h2>A crush<br>worth keeping.</h2><div class="relationship-stamp">MAX CRUSH ACTIVATION · CONFIRMED</div><div class="paper letter-body personal-letter"><div class="speaker">${translation?'FOR KAILEE · FROM YACINE':'POUR KAILEE · DE YACINE'}</div>${translation?english:french}</div><button class="hint-link" data-action="rel-translate">${translation?'Lire en français':'Read the English translation'}</button><div class="action-list">${action('Keep this in the collection','collection')}${action('Replay this personal case','replay','secondary-button')}</div><p class="subtle-text">Your letter and keepsakes remain available in this file.</p>`;
  }
  function relationshipCollection(){return `<p class="eyebrow">Kailee & Yacine · Keepsake drawer</p><h2>Some things<br>were never lost.</h2><div class="keepsake-shelf">${['photo','coffin','voice'].map(id=>`<button data-action="memory-${id}" aria-label="Revisit ${memories[id].title.toLowerCase()}" ${!relationship.clues.includes(id)?'disabled':''}>${memoryIcons[id]}<span>${relationship.clues.includes(id)?memories[id].title:'Undiscovered'}</span></button>`).join('')}</div><div class="coming-note">${relationship.solved?'One photo booth strip. One jewelry coffin. One shameless admission. Filed together under Kailee & Yacine.':'Find all three keepsakes and connect the two messages to unlock Yacine’s French letter.'}</div><div class="action-list">${action(relationship.solved?'Read Yacine’s letter':'Continue the case',relationship.solved?'ending':'office')}${action('Browse all case files','cases','secondary-button')}</div>`;}
  const relationshipPanels={office:relationshipOffice,inspect:relationshipInspector,visitor:relationshipConversation,notebook:relationshipNotebook,deduction:relationshipDeduction,ending:relationshipEnding,collection:relationshipCollection};
  function relationshipHandle(cmd){
    if(['office','inspect','notebook','collection'].includes(cmd)){navigate(cmd,true);return;}
    if(cmd==='visitor'){if(relationship.clues.length<3){toast('Inspect all three keepsakes first.');return;}navigate(cmd,true);return;}
    if(cmd==='deduction'){if(!relationship.testimony){toast('Ask Smudge who activated the crush.');return;}navigate(cmd,true);return;}
    if(cmd==='ending'){if(!relationship.solved)return;navigate(cmd,true);return;}
    if(cmd.startsWith('memory-')){const id=cmd.slice(7);if(!memories[id])return;if(!relationship.clues.includes(id)){relationship.clues.push(id);save();toast('Keepsake recorded: '+memories[id].title);playBell();}view='inspect';currentClue=id;render();focusPanel();return;}
    if(cmd.startsWith('rel-ask-')){visitorTopic=cmd.slice(8);if(visitorTopic==='activation'){relationship.testimony=true;save();}render();return;}
    if(cmd.startsWith('rel-evidence-')){const id=cmd.slice(13);selectedEvidence=selectedEvidence.includes(id)?selectedEvidence.filter(v=>v!==id):selectedEvidence.length<2?[...selectedEvidence,id]:[selectedEvidence[1],id];deductionFeedback='';render();return;}
    if(cmd==='rel-present'){if(selectedEvidence.length!==2)return;if(selectedEvidence.includes('activation')&&selectedEvidence.includes('voice')&&relationship.clues.length===3&&relationship.testimony){relationship.solved=true;save();navigate('ending',true);playBell();toast('The MAX CRUSH File: confirmed.');}else{deductionFeedback='The photographs and gift are keepsakes. For this connection, find Kailee’s own declaration and Yacine’s spoken reply.';render();}return;}
    if(cmd==='rel-translate'){translation=!translation;render();return;}
    if(cmd==='pet-smudge'){smudgeLine='I have reviewed Kailee and Yacine’s file. The flirting is excessive. The evidence is compelling.';navigate('visitor',true);return;}
    if(cmd==='replay'){showReset();return;}
  }

  document.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button&&!button.disabled)handle(button.dataset.action);const nav=event.target.closest('[data-nav]');if(nav)navigate(nav.dataset.nav,true);});
  document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();navigate('office');if(innerWidth<=800)window.scrollTo({top:0,behavior:settings.motion?'smooth':'auto'});});
  function showReset(){
    const personalReset=activeCase==='relationship';
    $('modal-content').innerHTML=`<p class="eyebrow">A clean page</p><h2>Reopen the case?</h2><p>This clears ${personalReset?'the MAX CRUSH file’s':'the pocket-watch mystery’s'} progress on this device. Your other case stays saved.</p><div class="action-list"><button class="primary-button" id="confirm-reset">Start the case again</button><button class="secondary-button" id="close-modal">Keep my progress</button></div>`;
    if(!$('modal').open)$('modal').showModal();
    $('confirm-reset').onclick=()=>{if(personalReset)relationship=freshRelationship();else state=initial();save();$('modal').close();navigate('office');toast('The night shift begins again.');};
    $('close-modal').onclick=()=>$('modal').close();
  }
  $('settings-toggle').addEventListener('click',()=>{
    $('modal-content').innerHTML=`<p class="eyebrow">At your service. Reluctantly.</p><h2>The night shift</h2><label class="settings-row">Rain & gentle motion<input id="motion-toggle" class="switch" type="checkbox" ${settings.motion?'checked':''}></label><p>Progress is ${hasStorage?'saved in this browser on this device':'not being saved because browser storage is unavailable'}. Sound starts only when you turn it on.</p><div class="action-list"><button class="secondary-button" id="reset-case">Restart the mystery</button><button class="primary-button" id="close-modal">Back to the station</button></div>`;
    $('modal').showModal();$('close-modal').onclick=()=>$('modal').close();$('reset-case').onclick=showReset;
    $('motion-toggle').onchange=event=>{settings.motion=event.target.checked;try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}document.body.classList.toggle('reduce-motion',!settings.motion);};
  });
  $('modal').addEventListener('click',event=>{if(event.target===$('modal')){const r=$('modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('modal').close();}});
  // Synthesized rain and soft interaction tones; no external audio requests.
  let audio,master,noise, soundEnabled=false, soundBusy=false;
  function audioSetup(){
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');audio=new Audio();master=audio.createGain();master.gain.value=.24;master.connect(audio.destination);
    const buffer=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.2;
    noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1450;const rainVolume=audio.createGain();rainVolume.gain.value=.22;noise.connect(filter);filter.connect(rainVolume);rainVolume.connect(master);noise.start();
  }
  function tone(freq,volume,duration){if(!soundEnabled||!audio||audio.state!=='running')return;const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  function playClick(){tone(440,.045,.09);}
  function playBell(){tone(1046.5,.17,1.2);tone(1568,.045,.9);}
  $('sound-toggle').addEventListener('click',async()=>{if(soundBusy)return;soundBusy=true;try{if(!audio)audioSetup();if(soundEnabled){soundEnabled=false;await audio.suspend();}else{await audio.resume();soundEnabled=true;playBell();}const b=$('sound-toggle');b.innerHTML=svg(soundEnabled?'sound':'mute');b.setAttribute('aria-pressed',String(soundEnabled));b.setAttribute('aria-label',soundEnabled?'Turn ambient sound off':'Turn ambient sound on');toast(soundEnabled?'Station ambience on.':'Station ambience off.');}catch{toast('Sound is unavailable in this browser.');}finally{soundBusy=false;}});
  document.addEventListener('visibilitychange',()=>{if(!audio||!soundEnabled)return;if(document.hidden)void audio.suspend().catch(()=>{});else void audio.resume().catch(()=>{});});
  for(let i=0;i<26;i++){const drop=document.createElement('i');drop.className='raindrop';drop.style.left=(Math.random()*100)+'%';drop.style.animationDuration=(1.5+Math.random()*1.5)+'s';drop.style.animationDelay=(-Math.random()*4)+'s';drop.style.opacity=String(.3+Math.random()*.6);$('rain').appendChild(drop);}
  render();
})();
