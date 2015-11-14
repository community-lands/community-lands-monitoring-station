rm -rf MonitoringStation-*
electron-packager . MonitoringStation --platform=darwin --arch=x64 --version=0.33.1
zip -r MonitoringStation-darwin-x64-1.0.0.zip MonitoringStation-darwin-x64
electron-packager . MonitoringStation --platform=win32 --arch=x64 --version=0.33.1
zip -r MonitoringStation-win32-x64-1.0.0.zip MonitoringStation-win32-x64
