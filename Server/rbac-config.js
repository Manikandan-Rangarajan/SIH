const RBAC = require('@yanfoo/rbac-a'); // Import the RBAC module

// Configure roles and permissions
const roles = {
    admin: ['*'],
    superuser: ['*'],
    client: ['send_msg', 'receive_msg'],
    freightForwarder: ['receive_msg'],
    approvedFreightForwarder: ['send_msg', 'receive_msg']
};

const permissions = {
    '*': ['*'],
    send_msg: ['POST'],
    receive_msg: ['GET']
};

// Initialize RBAC
const rbac = RBAC({ roles, permissions }); // Assuming RBAC is a function

module.exports = rbac; // Export the RBAC instance
