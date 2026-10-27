(function (root) {
  const normalize = text => String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae');
  const choice = (label, action) => ({ label, action });
  const homeChoices = () => [choice('Ég er með pælingu', 'start'), choice('Ég kann ekki að pósa', 'faq:posing'), choice('Hvað kostar þetta?', 'faq:price'), choice('Hvernig bóka ég?', 'faq:booking')];
  const topics = {
    price: { match: /verd|kost|kr[oó]n|pakka|pakkar|price|dyrt|odyr|afslatt|tilbod/, text: 'Verð fer eftir útfærslu myndatökunnar. Ég er ekki með staðfestan verðlista hér. Segðu Alex frá pælingunni þinni og fáðu verð og hvað er innifalið áður en þú bókar.' },
    booking: { match: /bok|laus|laust|tima|dagset|helgi|morgun|available|calendar/, text: 'Allar bókanir byrja á persónulegri fyrirspurn til Alex. Segðu hvað þig langar að gera og hvaða tímasetning gæti hentað. Alex skoðar dagskrána sína og þið finnið tíma saman, ég get ekki staðfest eða pantað tíma.' },
    posing: { match: /pos|stelling|sitja fyrir|stress|kvid|feimin|feiminn|feimin\/n|othae?g|likam|utlit|myndvaen|myndvaen|ljot/, text: 'Þú þarft ekki að kunna að pósa. Alex leiðbeinir þér og þið prófið stellingar, hreyfingu og ljós saman. Ef eitthvað gerir þig óörugga/n má alveg nefna það í fyrirspurninni.' },
    clothes: { match: /fot|klaed|dress|kl[eæ]d|litir|liti|color|outfit/, text: 'Alex elskar liti og framandi föt. Segðu hvaða stemningu þú ert að hugsa um, þá getið þið þróað hugmynd um klæðnað, liti og stað saman. Það þarf ekki að vera fullmótuð pæling.' },
    location: { match: /stad|uti|nattur|skog|haust|studio|reykjav|hvar/, text: 'Hér á síðunni sérðu bæði útitökur og stúdíótökur. Alex hefur sérstakt dálæti á haustlitum og flottum stöðum. Staðsetning og aðstaða fyrir þína töku eru ákveðin með honum.' },
    delivery: { match: /afhend|afhent|skil|fae.*mynd|fa.*myndirnar|bida|vinnsl|retouch|photoshop/, text: 'Alex þarf að staðfesta afhendingartíma og myndafjölda fyrir verkefnið þitt. Nefndu endilega ef þú þarft myndirnar fyrir ákveðinn dag.' },
    embla: { match: /embla|teikn/, text: 'Alex dáðist að því sem Embla var að skapa og langaði að vinna með henni. Þau þróuðu hugmyndina saman: fyrst kom teikningin og svo myndatakan. Þú getur séð ferlið í Emblu-sögunni á síðunni.', section: 'sogur' },
    work: { match: /daemi|portfolio|sja mynd|syna mynd|myndirnar|verkefni/, text: 'Myndirnar og myndböndin af Betu, Daða og Jenný sýna ólíka liti, ljós og stemningu. Emblu-sagan sýnir svo hvernig sameiginleg hugmynd varð að myndatöku.', section: 'myndir' },
    about: { match: /hver er alex|hver er snjokall|ljosmyndari|um alex/, text: 'Alex Snær er ljósmyndarinn á bak við Snjókallinn. Hann er úr Laugardalnum og elskar að kynnast fólki í gegnum myndatökur, prófa nýjar hugmyndir og leika sér með liti.', section: 'alex' },
    identity: { match: /hver ert|manneskja|gervigreind|ertu alex|ertu alvoru|vistar|vistast|personuvernd/, text: 'Ég er Snædís, sjálfvirk spjallhjálp með tilbúnum svörum um Snjókallinn. Ég er ekki Alex. Þetta spjall er ekki sent til hans eða vistað eftir að þú endurhleður síðunni. Þú getur fært pælinguna þína í fyrirspurn og sent sjálf/ur.' },
    contact: { match: /hafa samband|tala vid|netfang|email|tolvupost|senda alex/, text: 'Þú getur sent Alex persónulega fyrirspurn á snjokallinn@snjokallinn.com. Byrjaðu á ljósmyndakvissinu, skoðaðu verðmatið og fylltu svo út bókunarspurningalistann. Nýja beina sendingin er enn í vinnslu.', section: 'fyrirspurn' }
  };
  function createAssistant() {
    let stage = null;
    let draft = {};
    const continuation = () => stage ? [choice('Halda áfram með pælinguna', 'continue'), choice('Hætta við pælingu', 'cancel')] : [choice('Móta fyrirspurn', 'start'), choice('Fleiri spurningar', 'home')];
    function prompt() {
      if (stage === 'idea') return { text: 'Hvað langar þig að fanga? Segðu frá stemningu, tilefni eða hugmynd. Það má líka vera: „Mig langar í flottar myndir en veit ekki alveg hvernig.“', choices: [choice('Litir og eitthvað óvænt', 'answer:Litir og eitthvað óvænt'), choice('Hlýjar myndir í náttúrunni', 'answer:Hlýjar myndir í náttúrunni'), choice('Ég veit það ekki enn', 'answer:Ég veit það ekki enn')] };
      if (stage === 'place') return { text: 'Hvar sérðu þetta fyrir þér, úti, í stúdíói eða á einhverjum sérstökum stað?', choices: [choice('Úti', 'answer:Úti'), choice('Í stúdíói', 'answer:Í stúdíói'), choice('Finnum það með Alex', 'answer:Vil finna stað með Alex')] };
      if (stage === 'when') return { text: 'Hvenær gæti myndataka hentað þér? Þú getur nefnt mánuð eða tímabil. Þetta er ósk, ekki bókaður tími.', choices: [choice('Ég er sveigjanleg/ur', 'answer:Sveigjanleg tímasetning'), choice('Á eftir að ákveða', 'answer:Tímasetning óákveðin')] };
      return summary();
    }
    function summary() {
      return { text: `Hér er pælingan þín til Alex:\n\n${draft.idea}\nStaður: ${draft.place}\nTímasetning: ${draft.when}\n\nViltu færa þetta yfir í fyrirspurnarformið? Ekkert hefur verið sent eða bókað.`, choices: [choice('Setja í fyrirspurn', 'handoff'), choice('Byrja pælinguna aftur', 'start'), choice('Spyrja um annað', 'cancel')] };
    }
    function welcome() { return { text: 'Hæ! Ég er Snædís 🫶 Ég get hjálpað þér að kynnast myndatökunum hjá Alex eða koma pælingunni þinni í orð. Hvar eigum við að byrja?', choices: homeChoices() }; }
    function faq(key) {
      const topic = topics[key];
      if (!topic) return welcome();
      return { text: topic.text, choices: [...(topic.section ? [choice(topic.section === 'fyrirspurn' ? 'Opna fyrirspurn' : 'Skoða á síðunni', 'section:' + topic.section)] : []), ...continuation()] };
    }
    function answer(value) {
      if (stage === 'idea') { draft.idea = value; stage = 'place'; }
      else if (stage === 'place') { draft.place = value; stage = 'when'; }
      else if (stage === 'when') { draft.when = value; stage = 'done'; }
      else return reply(value);
      return prompt();
    }
    function act(action) {
      if (action === 'restart') { stage = null; draft = {}; return welcome(); }
      if (action === 'start') { stage = 'idea'; draft = {}; return prompt(); }
      if (action === 'continue') return stage ? prompt() : welcome();
      if (action === 'home' || action === 'cancel') { stage = null; return welcome(); }
      if (action.startsWith('faq:')) return faq(action.slice(4));
      if (action.startsWith('answer:')) return answer(action.slice(7));
      if (action === 'handoff' && stage === 'done') return { text: 'Þú getur nú lesið yfir pælinguna í fyrirspurnarforminu og bætt nafni þínu við.', draft: { idea: `${draft.idea}\nStaður: ${draft.place}`, when: draft.when }, choices: [choice('Fleiri spurningar', 'home')] };
      if (action.startsWith('section:') && ['sogur', 'myndir', 'alex', 'fyrirspurn'].includes(action.slice(8))) return { section: action.slice(8) };
      return welcome();
    }
    function reply(raw) {
      const text = String(raw).trim().slice(0, 600);
      if (!text) return { text: 'Skrifaðu nokkur orð eða veldu spurningu hér fyrir neðan.', choices: stage ? prompt().choices : homeChoices() };
      const n = normalize(text);
      if (/^(haetta|haettu|stop|cancel|byrja aftur)[.! ]*$/.test(n)) return act('restart');
      if (stage && stage !== 'done' && !/[?？]/.test(text) && !/^(hvad kostar|hvernig boka|ertu |hvenær fae|hvenaer fae)/.test(n)) return answer(text);
      const matches = Object.keys(topics).filter(key => topics[key].match.test(n)).slice(0, 2);
      if (matches.length) {
        const first = faq(matches[0]);
        if (matches.length > 1) first.text += '\n\n' + topics[matches[1]].text;
        return first;
      }
      if (/hugmynd|paeling|mig langar|eg vil|eg veit ekki|hjalp/.test(n)) return act('start');
      if (/^(hae|hallo|hello|hi|godan dag)[.! ]*$/.test(n)) return welcome();
      if (/^(takk|takk fyrir|ok|okei|flott|geggjad)[.! ]*$/.test(n)) return { text: 'Ekkert mál 🫶 Viltu spyrja um fleira eða móta fyrirspurn til Alex?', choices: continuation() };
      return { text: 'Ég er ekki með tilbúið svar við þessu. Alex er rétti aðilinn til að svara því, þú getur sett spurninguna í fyrirspurnina. Ég get líka hjálpað með bókun, stellingar, klæðnað og hugmyndir.', choices: [choice('Opna fyrirspurn', 'section:fyrirspurn'), ...continuation()] };
    }
    return { welcome, reply, act };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createAssistant };
  else root.SnjokallinnChat = { createAssistant };
})(typeof window !== 'undefined' ? window : this);
