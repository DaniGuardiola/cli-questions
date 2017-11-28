const _ = require('lodash');
const Promise = require('bluebird');
const readline = require('readline-sync');
require('colors');

/*
q   ->  question
qs  ->  questions
a   ->  answer
as  ->  answers
cb  ->  callback
 */

const askCb = (q, cb) => {
  const text = q.text || q; // If no text property, direct question string is assumed
  const optional = q.optional && !q.default; // Optional only if no default defined
  const defaultText = q.default ? `(${q.default}) `.blue : ''; // Default value text
  const display = `${optional ? '(opt) '.blue : ''}${text} ${defaultText}`.bold; // Text to display

  const data = q.bool ? // Ask for input
    readline.keyInYN(`${display}`) : // Text
    readline.question(display, { hideEchoBack: q.hidden === true }); // Boolean (y/n)

  if (!optional && !q.default && data === '') return askCb(q, cb); // Ask again if not optional
  const a = data !== '' ? data : (q.default || ''); // Use default if empty input
  cb(a); // Return answer
};

const askPromise = q => (new Promise(resolve => askCb(q, resolve))); // Promisified askCb

const ask = (q, cb) => (cb ? askCb(q, cb) : askPromise(q)); // Route depending on callback

const toArray = qs => _.values(_.mapValues(qs, (val, key) => {
  val.id = key;
  return val;
}));

const toObject = (qs, as) => {
  const obj = {};
  _.each(qs, (val, index) => {
    obj[val.id] = as[index];
  });
  return obj;
};

const askMany = (q, cb) => {
  const qs = toArray(q); // For mapSeries
  return Promise.mapSeries(qs, askPromise) // Ask questions
    .then(as => toObject(qs, as)) // For final output
    .tap(as => (cb ? cb(as) : '')); // Callback support
};

module.exports = { ask, askMany };
