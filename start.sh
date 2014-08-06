
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TW=wrtw.html
cd $DIR

if [[ ! -z $(git status --porcelain) ]] ; then
	zenity --warning --text="Local changes; can't start."
else
	git pull origin master

	firefox $TW
fi

cd -
