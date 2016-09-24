This is a self-contained offline monitoring station for the Community Lands
project. It includes other components such as MapFilter in a preconfigured
way for deployment to various communities.

## Instructions

To install this station on your computer, clone the repository and install
dependencies.

```bash
$ git clone git@github.com:community-lands/community-lands-monitoring-station.git
$ cd community-lands-monitoring-station
$ npm install
```

This is an Electron app; you can run it with

```bash
$ electron .
```

Developing on a Mac workstation, the project can be built to an
installable Windows or Mac version via electron-packager; do this
with `build-full.sh`. You must have electron installed at the system level,
and all the community-lands repositories checked out as siblings of your community-lands-monitoring-station. `wine` is required to build for Windows.
The build script will `git pull`, `npm install` and synchronize dependencies
to make a consistent build. The final step will upload the build to the
Community Lands download page; for this to work, you must have your public key
installed on that system.

`build-full.sh` supports running a single or a range of steps; see the
code for options.
