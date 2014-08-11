#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TW_NAME=wrtw.html
cd $DIR
x=$(git add $TW_NAME 2>&1)
y=$(git commit -m "Standard update to TiddlyWiki." 2>&1)
z=$(git push origin master 2>&1)
zenity --info --text="$x$y$z"
cd -

