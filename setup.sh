
VERSION=tiddlydesktop-linux64-0.0.3.zip

if [ ! -d td ] ; then
	wget https://github.com/Jermolene/TiddlyDesktop/releases/download/v0.0.3/$VERSION

	mkdir td
	unzip $VERSION -d td
	sed -i s/libudev.so.0/libudev.so.1/g td/nw


fi

