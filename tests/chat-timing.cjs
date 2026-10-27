const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const EngineModule = require('node:module');
const engineModule = new EngineModule('chat-engine');
engineModule._compile(require('node:fs').readFileSync('public/chat-engine.js', 'utf8'), 'chat-engine.cjs');
const { createAssistant } = engineModule.exports;

// A small DOM/timer harness checks pending-reply races without real-time waits.
class Element {
  constructor() { this.children = []; this.events = {}; this.attrs = {}; this.value = ''; this.hidden = false; this.maxLength = 2000; }
  addEventListener(type, fn) { this.events[type] = fn; }
  fire(type, event = {}) { this.events[type]?.({ preventDefault() {}, ...event }); }
  setAttribute(key, value) { this.attrs[key] = value; }
  append(...items) { for (const item of items) { item.parent = this; this.children.push(item); } }
  replaceChildren() { for (const child of this.children) child.parent = null; this.children = []; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  get firstElementChild() { return this.children[0]; }
  focus() { focused = this; }
  scrollIntoView() {}
}
let focused;
const elements = new Map();
const get = key => { if (!elements.has(key)) elements.set(key, new Element()); return elements.get(key); };
get('#snaedis-chat').hidden = true;
const timers = new Map();
let timerId = 0;
const document = { querySelector: get, getElementById: id => get('#' + id), createElement: () => new Element() };
const dispatched=[];
const window = {
  dispatchEvent(event) { dispatched.push(event.type); },
  SnjokallinnChat: { createAssistant },
  setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; },
  clearTimeout(id) { timers.delete(id); },
  matchMedia: () => ({ matches: true })
};
vm.runInNewContext(fs.readFileSync('public/chat.js', 'utf8'), { document, window, Event, Math: Object.assign(Object.create(Math), { random: () => 0 }), Set });
const log = get('#chat-messages');
const input = get('#chat-input');
const choices = get('#chat-choices');
const pending = () => [...timers.values()][0];
function flush() { assert.equal(timers.size, 1); const job = pending(); timers.clear(); job.fn(); }
const messages = () => log.children.filter(child => child.className?.startsWith('chat-message'));

get('#chat-launcher').fire('click');
assert.equal(get('#snaedis-chat').hidden, true, 'First tap only enlarges the portrait');
assert.equal(get('#chat-launcher').attrs['data-size'], 'expanded');
assert.equal(timers.size, 0, 'First tap must not start a chat response');
get('#chat-launcher').fire('keydown', { key: 'Escape' });
assert.equal(get('#chat-launcher').attrs['data-size'], 'compact');
get('#chat-launcher').fire('click');
get('#chat-launcher').fire('click');
assert.equal(get('#snaedis-chat').hidden, false, 'Second tap opens the chat');
assert.equal(messages().length, 0);
assert.equal(pending().delay, 850);
input.value = 'Hvað kostar þetta?';
get('#chat-form').fire('submit');
assert.equal(input.value, 'Hvað kostar þetta?', 'A submission during typing must preserve the draft');
flush();
assert.equal(messages().length, 1);
get('#chat-form').fire('submit');
assert.equal(pending().delay, 3200, 'Occasional thoughtful replies take longer');
assert.equal(choices.children.length, 0);
get('#chat-form').fire('submit');
assert.equal(timers.size, 1, 'Repeated submission cannot queue duplicate replies');
get('#chat-close').fire('click');
flush();
assert.equal(get('#snaedis-chat').hidden, true);
assert.equal(focused, get('#chat-launcher'), 'A background reply must not steal focus');
assert.equal(get('#chat-launcher').attrs['data-size'], 'compact', 'Closing returns to a small portrait');
get('#chat-launcher').fire('click');
assert.equal(get('#snaedis-chat').hidden, true);
get('#chat-launcher').fire('click');
assert.equal(get('#snaedis-chat').hidden, false);
assert.equal(timers.size, 0, 'Reopening must not create another greeting');
input.value = 'Í hverju á ég að vera?';
get('#chat-form').fire('submit');
assert.equal(pending().delay, 1000, 'Long pauses cannot happen twice in a row');
get('#chat-restart').fire('click');
assert.equal(timers.size, 1, 'Restart cancels the old response');
assert.equal(messages().length, 0);
flush();
assert.equal(messages().length, 1, 'Only the new greeting survives restart');

// Complete the guided draft and ensure explicit form navigation stays instant.
choices.children[0].fire('click'); flush();
for (const text of ['Haustlitir', 'Úti', 'Október']) {
  input.value = text; get('#chat-form').fire('submit'); flush();
}
get('#idea').value = 'Fyrri texti';
choices.children[0].fire('click');
assert.equal(timers.size, 0);
assert.match(get('#idea').value, /^Fyrri texti\n\nHaustlitir/);
assert.equal(get('#snaedis-chat').hidden, true);
assert.equal(get('.chat-send').attrs['aria-disabled'], 'false');
assert.ok(dispatched.includes('open-booking-draft'), 'Chat must hand off through the ordered booking journey');
console.log('Chat timing passed: delay, thoughtful variation, duplicate guard, close/reopen, reset cancellation, and immediate draft handoff.');
