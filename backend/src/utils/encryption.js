const CryptoJS = require('crypto-js');
const env = require('../config/env');

function encrypt(text) {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, env.get('ENCRYPTION_KEY')).toString();
}

function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  const bytes = CryptoJS.AES.decrypt(ciphertext, env.get('ENCRYPTION_KEY'));
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
