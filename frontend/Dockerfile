FROM node:16.14.2-slim
COPY . /frontend
WORKDIR /frontend
RUN npm install
RUN npm run build
RUN npm install serve -g
# run the npm run build command again at runtime, in order to pick up the REACT_APP_BASE_URL environment var
RUN ["chmod","+x","build_and_run.sh"]
ENTRYPOINT ["./build_and_run.sh"]
