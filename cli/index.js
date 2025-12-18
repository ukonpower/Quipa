#!/usr/bin/env node

const { program } = require('commander');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Load config file
function loadConfig() {
  const configPath = path.join(process.cwd(), '.quiparc.json');

  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error(chalk.yellow('Warning: Failed to load .quiparc.json'));
      return {};
    }
  }

  return {};
}

// Save config file
function saveConfig(config) {
  const configPath = path.join(process.cwd(), '.quiparc.json');

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('✓ Config saved to .quiparc.json'));
  } catch (error) {
    console.error(chalk.red('Failed to save config:'), error.message);
  }
}

// Upload command
program
  .command('upload')
  .description('Upload IPA file to Quipa server')
  .requiredOption('--ipa <path>', 'Path to IPA file')
  .option('--app <appId>', 'App ID')
  .option('--version <version>', 'Version number')
  .option('--bundle-id <bundleId>', 'Bundle identifier')
  .option('--name <appName>', 'App name')
  .option('--server <url>', 'Server URL', 'http://localhost:3000')
  .action(async (options) => {
    const config = loadConfig();

    // Merge config with options (options take precedence)
    const appId = options.app || config.defaultApp;
    const version = options.version;
    const bundleId = options.bundleId || config.bundleId;
    const appName = options.name || config.appName;
    const serverUrl = options.server || config.server || 'http://localhost:3000';
    const ipaPath = options.ipa;

    // Validate required fields
    if (!appId) {
      console.error(chalk.red('Error: --app is required'));
      process.exit(1);
    }

    if (!version) {
      console.error(chalk.red('Error: --version is required'));
      process.exit(1);
    }

    if (!bundleId) {
      console.error(chalk.red('Error: --bundle-id is required'));
      process.exit(1);
    }

    if (!appName) {
      console.error(chalk.red('Error: --name is required'));
      process.exit(1);
    }

    // Check if IPA file exists
    if (!fs.existsSync(ipaPath)) {
      console.error(chalk.red(`Error: IPA file not found: ${ipaPath}`));
      process.exit(1);
    }

    const spinner = ora('Uploading IPA file...').start();

    try {
      // Create form data
      const formData = new FormData();
      formData.append('ipa', fs.createReadStream(ipaPath));
      formData.append('appId', appId);
      formData.append('version', version);
      formData.append('bundleId', bundleId);
      formData.append('appName', appName);

      // Get file size for progress
      const fileSize = fs.statSync(ipaPath).size;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

      spinner.text = `Uploading ${fileSizeMB} MB...`;

      // Upload
      const response = await axios.post(`${serverUrl}/upload`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          spinner.text = `Uploading ${fileSizeMB} MB... ${percentCompleted}%`;
        }
      });

      spinner.succeed(chalk.green('Upload successful!'));

      console.log('\n' + chalk.bold.cyan('📱 Installation Details:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.white(`App ID:      ${response.data.data.appId}`));
      console.log(chalk.white(`Version:     ${response.data.data.version}`));
      console.log(chalk.white(`Bundle ID:   ${response.data.data.metadata.bundleId}`));
      console.log(chalk.white(`App Name:    ${response.data.data.metadata.appName}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.bold.green(`\n🔗 Install URL:\n   ${response.data.data.installUrl}`));
      console.log(chalk.gray('\nOpen this URL in Safari on your iOS device to install the app.\n'));
    } catch (error) {
      spinner.fail(chalk.red('Upload failed'));

      if (error.response) {
        console.error(chalk.red('Error:'), error.response.data.error || error.response.data.message);
      } else if (error.request) {
        console.error(chalk.red('Error: Could not connect to server'));
        console.error(chalk.yellow(`Make sure the server is running at ${serverUrl}`));
      } else {
        console.error(chalk.red('Error:'), error.message);
      }

      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize Quipa configuration')
  .option('--server <url>', 'Server URL', 'http://localhost:3000')
  .option('--app <appId>', 'Default app ID')
  .option('--bundle-id <bundleId>', 'Default bundle identifier')
  .option('--name <appName>', 'Default app name')
  .action((options) => {
    const config = {
      server: options.server,
      defaultApp: options.app,
      bundleId: options.bundleId,
      appName: options.name
    };

    // Remove undefined values
    Object.keys(config).forEach(key => {
      if (config[key] === undefined) {
        delete config[key];
      }
    });

    saveConfig(config);

    console.log(chalk.green('\n✓ Quipa configuration initialized\n'));
    console.log(chalk.cyan('You can now use shorter commands:'));
    console.log(chalk.gray('  quipa upload --ipa ./app.ipa --version 1.0.0\n'));
  });

program
  .name('quipa')
  .description('Quipa CLI - IPA distribution tool')
  .version('1.0.0');

program.parse();
