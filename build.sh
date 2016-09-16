rm -rf builds
# electron-packager . MonitoringStation --platform=darwin --arch=x64 --out builds --version=0.33.1
electron-packager `pwd` MonitoringStation --platform=win32 --arch=x64 --out builds --version=1.3.5
cd builds
# zip -r MonitoringStation-darwin-x64-1.0.0.zip MonitoringStation-darwin-x64
cd MonitoringStation-win32-x64
zip -r MonitoringStation.zip .
cd ..
cd ..
