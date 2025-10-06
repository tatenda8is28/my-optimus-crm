const User = require('./User');
const Campaign = require('./Campaign');
const Lead = require('./Lead');
const Message = require('./Message');
const Task = require('./Task');

// Define Relationships

// Campaign <-> Lead (One-to-Many)
Campaign.hasMany(Lead, { foreignKey: 'campaignId' });
Lead.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Lead <-> Message (One-to-Many)
Lead.hasMany(Message, { foreignKey: 'leadId' });
Message.belongsTo(Lead, { foreignKey: 'leadId' });

// Lead <-> Task (One-to-Many)
Lead.hasMany(Task, { foreignKey: 'leadId' });
Task.belongsTo(Lead, { foreignKey: 'leadId' });

// User <-> Task (One-to-Many) - Tasks are assigned to a user
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

// Export all models
module.exports = {
  User,
  Campaign,
  Lead,
  Message,
  Task,
};