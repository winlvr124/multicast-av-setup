# Multicast Signal Studio AVS

This project is an interactive simulation developed using Lovable AI to demonstrate AV-over-IP multicast streaming at Raffles City Convention Centre. 
It features two encoders, three decoders, and a managed network switch to distribute digital signage content to multiple rooms. 
Users can control video sources, start or stop streams, switch decoder connections, and monitor animated network connections through an interactive dashboard and floor plan. 
The simulation demonstrates how multicast technology distributes video efficiently across a network without requiring physical AV equipment.

This project was built with [Lovable](https://lovable.dev) and help from [ChatGPT](https://chatgpt.com).

## Lovable
- Used for the creation of the AV over IP Simulation

## ChatGPT
- Used for prompts to give to Lovable AI
- Created the floorplan photo according to worksheet guidelines

## Website to test

**Live app**: https://multicast-av-setup.lovable.app

## Important Notes
------------------

- This project is an AI-generated simulation.
- It is not connected to actual AV hardware.
- Multicast addresses and streaming activities are simulated.
- The project is intended for educational purposes and not meant for duplication.
- Internet access is required for initial dependency installation.
- Keep PowerShell running while using the simulation.

## System Requirements
----------------------

- Windows 10 or Windows 11
- Node Version Manager (NVM for Windows)
- Node.js 22
- npm (included with Node.js)
- Google Chrome or Microsoft Edge
- Internet connection for initial installation

## Development

Prefer working locally? Check if you have the system requirements and follow the guide below.

## Guide

## STEP 1: Install NVM for Windows

1. Visit:
   https://github.com/coreybutler/nvm-windows/releases

2. Download nvm-2.1.0-beta.13-x64-setup from the latest release.

3. Run the installer and follow the instructions.

4. Restart PowerShell or Command Prompt.

5. Verify installation by running:
   nvm version

## STEP 2: Install node.js

Open PowerShell or Command Prompt and run:
nvm install 22
nvm use 22

Verify installation: 
node -v 
npm -v

NOTE:
If nvm use reports a permission error, try opening
PowerShell as Administrator.

## STEP 3: Extract the project

1. Download the project ZIP file.

2. Extract it into a folder on your computer.

3. Open the extracted project folder.

4. Ensure package.json is inside the folder.

## STEP 4: Open Powershell

1. Open the extracted project folder in File Explorer.

2. Click the address bar.

3. Type powershell and press Enter.

4. PowerShell will open in the project directory.

## STEP 5: Install Dependencies

Run: npm install

Wait for installation to complete.

NOTE:
Deprecation warnings may appear during installation.
These do not necessarily prevent the application from running.

## STEP 6: Start the simulation

Run: npm run dev

Wait for the development server to start.

The terminal will display a local URL, for example:

   http://localhost:3000

Open the URL shown in PowerShell using Chrome or Edge.

The AV-over-IP simulation should now be running.

## Stopping the simulation
1. Return to the PowerShell window.

2. Press Ctrl + C.

3. Confirm termination if prompted.

To restart the simulation, run: npm run dev

There is no need to reinstall dependencies unless they
have changed or are missing.

## Troubleshooting

PROBLEM: NVM IS NOT RECOGNISED

- Ensure NVM for Windows is installed correctly.
- Restart PowerShell or Command Prompt.


PROBLEM: NODE OR NPM IS NOT RECOGNISED

Run: nvm use 22


PROBLEM: MISSING DEPENDENCIES

Run: npm install


PROBLEM: PORT ALREADY IN USE

- Close other running instances of the application.
- Restart the development server.
- Use the new localhost URL if the port changes.


PROBLEM: SIMULATION DOES NOT LOAD

Check that:

- PowerShell remains open.
- The development server is running.
- The correct localhost URL is being used.
- All dependencies were installed successfully.
