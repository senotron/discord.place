const mongoose = require('mongoose');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const moment = require('moment');
const createActivity = require('@/utils/createActivity');

async function createMongoBackup() {
  try {
    if (!mongoose?.connection?.client?.s?.url) throw new Error('Database connection not established.');

    logger.send('Taking backup of database..');

    const url = mongoose.connection.client.s.url;
    const formattedDate = moment().format('YYYY/MM/DD');
    const backupPath = `./src/database/backups/${formattedDate}`;
    const cmd = generateBackupCommand(url, backupPath, config.excludeCollectionsInBackup);

    await executeBackupCommand(cmd);

    logger.send('Database backup taken successfully.');

    createActivity({
      type: 'MODERATOR_ACTIVITY',
      user_id: client.user.id,
      target: client.user,
      message: 'Database backup taken successfully.'
    });
  } catch (error) {
    logger.send(`Failed to take backup: ${error.message}`);
  }
}

function generateBackupCommand(url, backupPath, excludeCollections) {
  const collectionsToExclude = excludeCollections.map(collection => `--excludeCollection=${collection}`).join(' ');
  return `mongodump --uri="${url}" --gzip --forceTableScan --quiet --db=api --out=${backupPath} ${collectionsToExclude}`;
}

async function executeBackupCommand(cmd) {
  try {
    await exec(cmd);
  } catch (error) {
    throw new Error(`Backup command execution failed: ${error.message}`);
  }
}

module.exports = createMongoBackup;