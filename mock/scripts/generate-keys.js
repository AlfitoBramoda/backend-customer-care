#!/usr/bin/env node
const EnvValidator = require('../config/env_validator');

console.log('🔐 B-Care Security Key Generator');
console.log('================================');
EnvValidator.generateSecureKeys();
console.log('');
console.log('📝 Copy these keys to your .env file');
console.log('⚠️  Keep these keys secure and never commit them to git!');
