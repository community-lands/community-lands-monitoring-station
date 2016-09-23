dir=(`pwd`)
step=1
start=1
end=100
build_target="rob_heittman_solertium_com@www.communitylands.org:/u/apps/communitylands/current/public/system/builds"
win=0
mac=0

while [[ "$1" != "" ]]; do
  case $1 in
    -s | --start )
      shift
      start=$1
      ;;
    -e | --end )
      shift
      end=$1
      ;;
    --no-upload )
      end=5
      ;;
    -t | --target )
      shift
      build_target=$1
      ;;
    --mac )
      win=1
      mac=0
      ;;
    --win )
      win=0
      mac=1
      ;;
    * )
      ;;
  esac
  shift
done

echo "# Cleaning out tiles"
rm Monitoring/Maps/Bing/*.jpeg

echo "# Installing dependencies if needed"
npm install

echo "# Building Community Lands Monitoring Station from $dir"

if [ $step -ge $start -a $step -le $end ]
then
  echo "1) Updating MapFilter..."
  cd ../mapfilter
  git checkout fileodk
  if [[ "$?" != 0 ]]
  then
    echo "Failed to checkout mapfilter branch 'fileodk'; perhaps there are conflicts. Fix this first, then re-run build script"
    exit
  fi
  git pull

  if [[ "$?" != 0 ]]
  then
    echo "Failed to execute git pull on mapfilter; perhaps there are conflicts. Fix this first, then re-run build script"
    exit
  fi
  cd $dir
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "2) Updating Monitoring Station"
  git checkout master
  git pull
  if [ "$?" != 0 ]
  then
    echo "Failed to execute git pull on monitoring-station; perhaps there are conflicts. Fix this first, then re-run build script"
    exit
  fi
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "3) Building MapFilter..."
  cd ../mapfilter
  sh install-dependencies.sh
  npm run build:web && cp dist/* $dir/mapfilter/
  cd $dir
fi


((step++))

if [ $step -ge $start -a $step -le $end ]
then
  git log -n 1 --format='{ "version": "%h" }' > application/data/version.json

  echo "4) Creating builds for:"
  rm -rf builds
  if [ $win == 0 ]
  then
    echo " ----- Windows -----"
    electron-packager `pwd` MonitoringStation --platform=win32 --arch=x64 --out builds --version=1.4.0
  fi
  if [ $mac == 0 ]
  then
    echo " -----   Mac   -----"
    electron-packager `pwd` MonitoringStation --platform=darwin --arch=x64 --out builds --version=1.4.0
  fi
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "5) Packaging assets..."
  cd builds

  d=$(date "+%Y%m%d")

  if [ $win == 0 ]
  then
    cd MonitoringStation-win32-x64
    zip -q -r --exclude=*.git* --exclude=*.DS_Store* --exclude=*.env* --exclude=*build*.sh* MonitoringStation-win-$d.zip .
    cd ..
  fi

  if [ $mac == 0 ]
  then
    cd MonitoringStation-darwin-x64
    zip -q -r --exclude=*.git* --exclude=*.DS_Store* --exclude=*.env* --exclude=*build*.sh* MonitoringStation-macosx-$d.zip .
  fi
  cd $dir
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "6) Uploading to server..."
  cd builds

  if [ $win == 0 ]
  then
    rsync -avz -P MonitoringStation-win32-x64/MonitoringStation*.zip $build_target/win/
  fi
  if [ $mac == 0 ]
  then
    rsync -avz -P MonitoringStation-darwin-x64/MonitoringStation*.zip $build_target/mac/
  fi

  echo "Copied files to $build_target"
  cd $dir
fi

echo "Done."
