rm -rf builds
# electron-packager . MonitoringStation --platform=darwin --arch=x64 --out builds --version=0.33.1
electron-packager . MonitoringStation --platform=darwin --arch=x64 --out builds --version=0.37.3
cd builds
# zip -r MonitoringStation-darwin-x64-1.0.0.zip MonitoringStation-darwin-x64
cd MonitoringStation-darwin-x64
zip -r MonitoringStation.zip .
cd ..
cd ..
