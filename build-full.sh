# TARGETS
#
# 1: Update MapFilter
# 2: Update Monitoring Station
# 3: Update Private Website Templates
# 4: Build MapFilter
# 5: Update App Version
# 6: Create Installers
# 7: Packaging Assets
# 8: Upload to Server

dir=(`pwd`)
step=1
start=1
end=100
build_target="rob_heittman_solertium_com@www.communitylands.org:/u/apps/communitylands/current/public/system/builds"
win=0
mac=0
master_build=0



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
      end=7
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
    --custom )
      master_build=1
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
  echo "$step) Updating MapFilter..."
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

if [ $step -ge $start -a $step -le $end -a $master_build == 0 ]
then
  echo "$step) Updating Monitoring Station"
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
  echo "$step) Importing templates and latest site builder library..."
  cd ../private-website-templates
  git pull
  cd $dir
  cp -rp ../private-website-templates/src/templates/* templates/
  cp -rp ../private-website-templates/lib/* application/
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "$step) Building MapFilter..."
  cd ../mapfilter
  git pull
  sh install-dependencies.sh
  npm run build:web && cp dist/* $dir/mapfilter/
  cd $dir
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "$step) Updating version..."
  git log -n 1 --format='{ "version": "%h" }' > application/data/version.json
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "$step) Creating builds for:"
  rm -rf builds
  if [ $win == 0 ]
  then
    echo " ----- Windows -----"
    npm run compile:win
  fi
  if [ $mac == 0 ]
  then
    echo " -----   Mac   -----"
    npm run compile:mac
  fi
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "$step) Packaging assets..."
  cd dist

  d=$(date "+%Y%m%d")

  if [ $win == 0 ]
  then
    # cd installer-win-x64
    zip -q -r MonitoringStation-win-$d.zip installer-win-x64/*.exe
    cd ..
  fi

  if [ $mac == 0 ]
  then
    # cd MonitoringStation-darwin-x64
    zip -q -r MonitoringStation-macosx-$d.zip *.dmg
  fi
  cd $dir
fi

((step++))

if [ $step -ge $start -a $step -le $end ]
then
  echo "$step) Uploading to server..."
  cd dist

  if [ $win == 0 ]
  then
    rsync -avz -P MonitoringStation-win*.zip $build_target/win/
  fi
  if [ $mac == 0 ]
  then
    rsync -avz -P MonitoringStation-mac*.zip $build_target/mac/
  fi

  echo "Copied files to $build_target"
  cd $dir
fi

echo "Done."
