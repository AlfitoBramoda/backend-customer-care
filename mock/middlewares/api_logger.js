const apiLogger = (req, res, next) => {
    // IP to Name mapping
    const ipNames = {
        '127.0.0.1': 'Localhost',
        '::1': 'Localhost-IPv6',
        '110.136.11.112': 'Laptop-Alfito',
        '110.138.80.224': 'Tim Website 1',
        '192.168.1.102': 'Mobile-Testing',
        '10.0.0.50': 'External-Client',
        '34.121.13.94': 'GCP-Server'
    };
    
    const timestamp = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const clientName = ipNames[ip] || `Unknown-${ip}`;
    const method = req.method;
    const url = req.originalUrl || req.url;
    
    // Log request
    console.log(`🌐 [${timestamp}] ${method} ${url} - ${clientName}`);
    
    // Log response when finished
    res.on('finish', () => {
        const statusCode = res.statusCode;
        const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
        
        // Add special indicator for auth endpoints to avoid token exposure
        const logSuffix = url.includes('/auth/') ? ' [Auth]' : '';
        console.log(`${statusEmoji} [${timestamp}] ${method} ${url} - ${statusCode} - ${clientName}${logSuffix}`);
    });
    
    next();
};

module.exports = apiLogger;