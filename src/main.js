// Load environment variables from .env file
require('dotenv').config();

const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const OpenAI = require('openai');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: width,
    height: 80, // Thinner bar
    x: 0,
    y: 0, // Position at top of screen
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    focusable: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Initially allow mouse events so buttons work
  mainWindow.setIgnoreMouseEvents(false);
  
  // Make window global overlay - stays on top of all apps and screens
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setFullScreenable(false);
  
  // Start hidden - will show on first Command+M
  mainWindow.hide();
  
  mainWindow.loadFile('src/renderer/index.html');
  
  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  // Debug: Log window state
  console.log('Window created with dimensions:', width, 'x', 200);
  console.log('Window position:', 0, ',', 0);

  // Register global shortcut for show/hide and microphone toggle
  const shortcutRegistered = globalShortcut.register('CommandOrControl+M', () => {
    console.log('Global shortcut CommandOrControl+M triggered');
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        // First press: Show the window
        console.log('Showing music bar...');
        mainWindow.show();
        mainWindow.focus();
      } else {
        // Subsequent presses: Toggle microphone when visible
        console.log('Toggling microphone...');
        mainWindow.webContents.send('toggle-microphone');
      }
    }
  });
  
  if (shortcutRegistered) {
    console.log('Global shortcut CommandOrControl+M registered successfully');
  } else {
    console.log('Failed to register global shortcut CommandOrControl+M');
  }

  // Register Escape key to hide the window
  const escapeRegistered = globalShortcut.register('Escape', () => {
    console.log('Escape key pressed - hiding music bar');
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });

  if (escapeRegistered) {
    console.log('Global shortcut Escape registered successfully');
  } else {
    console.log('Failed to register global shortcut Escape');
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // This is safe in main process
});

// IPC handlers for communication with renderer
ipcMain.handle('toggle-mouse-events', (event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.handle('get-freesound-api-key', () => {
  return process.env.FREESOUND_API_KEY;
});

ipcMain.handle('interpret-music-request', async (event, userInput) => {
  console.log('🤖 Main process interpreting:', userInput);
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('🤖 OpenAI API key not found in environment');
      throw new Error('OpenAI API key not found');
    }
    
    console.log('🤖 OpenAI API key found, making request...');
    
    const prompt = `
You are a music search expert. Convert this user request into Freesound.org search parameters.
User request: "${userInput}"

Respond with JSON only:
{
  "query": "search terms for freesound",
  "filter": "freesound filter string",
  "style": "one word style category",
  "mood": "descriptive mood"
}

Guidelines:
- query: 3-5 keywords describing the sound type
- filter: Use freesound filters like "tag:ambient duration:[60 TO *] avg_rating:[3 TO *] license:\\"Creative Commons 0\\""
- style: ambient, piano, nature, focus, electronic, rock, metal, etc.
- mood: peaceful, energetic, dark, bright, aggressive, etc.

Common filters:
- tag:ambient, tag:piano, tag:rain, tag:loop, tag:focus, tag:rock, tag:metal, tag:guitar
- duration:[60 TO *] (at least 1 minute)
- avg_rating:[3 TO *] (good quality)
- license:"Creative Commons 0" (CC0 public domain only - ALWAYS INCLUDE)
- ac_brightness:[0 TO 50] (darker sounds)
- ac_warmth:[50 TO 100] (warmer sounds)

Examples:
- "play some rock music" -> {"query": "rock guitar electric", "filter": "tag:rock duration:[60 TO *] avg_rating:[3 TO *] license:\\"Creative Commons 0\\"", "style": "rock", "mood": "energetic"}
- "ambient sounds" -> {"query": "ambient atmospheric calm", "filter": "tag:ambient duration:[60 TO *] avg_rating:[3 TO *] license:\\"Creative Commons 0\\"", "style": "ambient", "mood": "peaceful"}

IMPORTANT: Always include license:"Creative Commons 0" in the filter to ensure only public domain sounds are used.
`;

    console.log('🤖 Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });
    
    console.log('🤖 OpenAI response received:', response.choices[0].message.content);
    
    const result = JSON.parse(response.choices[0].message.content);
    console.log('🤖 Main process GPT result:', result);
    return result;
    
  } catch (error) {
    console.error('🤖 Main process GPT failed with error:', error);
    console.error('🤖 Error details:', error.message);
    console.error('🤖 Falling back to default ambient interpretation');
    
    // Return fallback interpretation with CC0 license
    return {
      query: 'ambient peaceful background',
      filter: 'duration:[60 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
      style: 'ambient',
      mood: 'peaceful'
    };
  }
});

ipcMain.handle('hide-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});

ipcMain.handle('quit-app', () => {
  app.quit();
}); 