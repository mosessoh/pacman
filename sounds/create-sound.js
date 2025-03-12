// This script creates a simple "nom" sound for Pacman eating dots
const fs = require('fs');
const { exec } = require('child_process');

// Create a command to generate a simple "nom" sound using SoX
const command = `
sox -n -r 44100 -c 2 sounds/dot-eat.mp3 synth 0.1 sine 880 fade 0 0.1 0.05 synth 0.1 sine 440 fade 0 0.1 0.05
`;

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log('Sound file created successfully!');
});
