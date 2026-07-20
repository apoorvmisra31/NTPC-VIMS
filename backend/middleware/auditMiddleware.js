const { AuditLog } = require('../models');

exports.auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      if (req.user && res.statusCode >= 200 && res.statusCode < 400) {
        try {
          await AuditLog.create({
            user: req.user._id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action,
            resource,
            resourceId: req.params.id || data?.data?._id,
            details: { method: req.method, path: req.path, body: req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      }
      originalJson(data);
    };
    next();
  };
};
