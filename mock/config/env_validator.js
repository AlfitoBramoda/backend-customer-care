const crypto = require('crypto');

class EnvValidator {
    static validateAndSetDefaults() {
        const env = process.env.NODE_ENV || 'development';
        
        console.log(`🔍 Validating environment: ${env}`);
        
        // Different validation rules per environment
        if (env === 'production') {
            this.validateProduction();
        } else if (env === 'staging') {
            this.validateStaging();
        } else {
            this.validateDevelopment();
        }

        // Set common defaults
        this.setCommonDefaults();

        console.log(`✅ Environment validation passed for: ${env}`);
    }

    static validateProduction() {
        const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'DB_NAME'];
        const missing = required.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            throw new Error(`Missing PRODUCTION env vars: ${missing.join(', ')}`);
        }

        // Strict validation for production
        if (process.env.JWT_SECRET.length < 64) {
            throw new Error('Production JWT_SECRET must be at least 64 characters');
        }

        if (process.env.JWT_SECRET.includes('dev') || process.env.JWT_SECRET.includes('test')) {
            throw new Error('Production JWT_SECRET cannot contain dev/test keywords');
        }
    }

    static validateStaging() {
        const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'DB_NAME'];
        const missing = required.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            throw new Error(`Missing STAGING env vars: ${missing.join(', ')}`);
        }

        // Medium validation for staging
        if (process.env.JWT_SECRET.length < 32) {
            throw new Error('Staging JWT_SECRET must be at least 32 characters');
        }
    }

    static validateDevelopment() {
        // Set development defaults if missing
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = 'dev_shared_jwt_secret_key_for_team_collaboration_minimum_32_characters_long_2024';
            console.log('⚠️  Using default development JWT_SECRET');
        }
        
        if (!process.env.JWT_REFRESH_SECRET) {
            process.env.JWT_REFRESH_SECRET = 'dev_shared_refresh_secret_key_different_from_jwt_for_team_collaboration_2024';
            console.log('⚠️  Using default development JWT_REFRESH_SECRET');
        }
        
        if (!process.env.DB_HOST) {
            process.env.DB_HOST = 'localhost';
            console.log('⚠️  Using default development DB_HOST');
        }
        
        if (!process.env.DB_NAME) {
            process.env.DB_NAME = 'bcare_dev_db';
            console.log('⚠️  Using default development DB_NAME');
        }

        console.log('🔧 Using shared development environment for team collaboration');
    }

    static setCommonDefaults() {
        // Set secure defaults
        process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '12';
        process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
        process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        process.env.JWT_ISSUER = process.env.JWT_ISSUER || 'bcare-api';
        process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'bcare-client';

        // Validate NODE_ENV
        if (!['development', 'production', 'test', 'staging'].includes(process.env.NODE_ENV)) {
            process.env.NODE_ENV = 'development';
        }
    }

    static generateSecureKeys() {
        console.log('🔑 Generate these secure keys for your .env file:');
        console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
        console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));
        console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
        console.log('ENCRYPTION_IV=' + crypto.randomBytes(16).toString('hex'));
        console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
    }
}

module.exports = EnvValidator;
