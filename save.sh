DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TW_NAME=wrtw.html
cd $DIR
git add $TW_NAME
git commit -m "Standard update to TiddlyWiki."
git push origin master
cd -

