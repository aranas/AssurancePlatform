#!/bin/bash

## this somewhat horrible hack is because we want to set the backend URL
## via an environment variable, but env vars are no longer picked up once
## 'npm run build' has been run, so we substitute the env var value in
## place of the default URL in the built javascript file :-/
filename=`ls build/static/js/main*.js`
sed "s;http://localhost:8000/api;${REACT_APP_BASE_URL};g" $filename > tmpfile.js
mv tmpfile.js $filename
serve -s build
