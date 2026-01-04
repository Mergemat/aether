#!/bin/sh
# Get the directory where this script is located
DIR=$(dirname "$0")
APP_NAME="Aether.app" # <--- CHANGE THIS to your actual app name

echo "----------------------------------------------------"
echo "Fixing 'App is Damaged' error for $APP_NAME"
echo "----------------------------------------------------"
echo "This script will remove the macOS quarantine flag."
echo "You may be asked to enter your Mac password."
echo ""

# Check if the app is in the same folder (DMG) or Applications
if [ -d "/Applications/$APP_NAME" ]; then
    TARGET="/Applications/$APP_NAME"
elif [ -d "$DIR/$APP_NAME" ]; then
    TARGET="$DIR/$APP_NAME"
else
    echo "ERROR: Could not find $APP_NAME in /Applications or the current folder."
    read -p "Press Enter to exit..."
    exit 1
fi

sudo xattr -rd com.apple.quarantine "$TARGET"

echo ""
echo "SUCCESS: The flag has been removed."
echo "You can now close this window and open the app normally."
read -p "Press Enter to exit..."
