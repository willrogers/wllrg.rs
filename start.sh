
TW=wrtw.html

if [[ ! -z $(git status --porcelain) ]] ; then
	echo "Local changes; can't start."
else
	git pull origin master

	firefox $TW && ./save.sh
fi
