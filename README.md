This is a self-contained offline monitoring station for the Community Lands
project. It includes other components such as MapFilter in a preconfigured
way for deployment to various communities.

## Instructions

To install this station on your computer, clone the repository and install
dependencies.

```bash
$ git clone git@github.com:rfc2616/community-lands-monitoring-station.git
$ cd community-lands-monitoring-station
$ npm install
```

This is an Electron app; you can run it with

```bash
$ electron .
```

The project can be built to an installable Windows or Mac version via
electron-packager; do this with build.sh or build-mac.sh.
