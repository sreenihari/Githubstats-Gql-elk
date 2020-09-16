This repo has the source code for Github Stats and Docker Nginx + Log Management). With some basic steps the user will be able to run the WebApp(Github Stats) and also provision a basic system which is easy to administer and develop. The WebApp was developed using Node/Express using graphql queries to consume data from Github using the [Github GraphQL API](https://developer.github.com/v4/).The design decision to use graphql was due to the fact of the extensive framework support from Github one of the early adopters of graphql coupled with Node/express which serves the basic needs of a WebApp.Later the same App is run on a NGINX server and also demonstrate data ingestion to ELK Stack. Kibana was skipped here because of the high computing resources needed. Fluentd was used to feed access logs from NGINX to elastic. All this has been achieved using Docker compose. This matches the requirements mentioned in the challenge(s) !!
Finally [Kompose](https://kompose.io/) the conversion tool was used to convert docker compose to kubernetes (Kubernetes deployment on EKS cluster is currently in progress)

Following are some miminal steps required to get the application working. As a pre-requisite Docker standalone tools are required to build dockerfiles and docker compose files 

0) Clone this repo to any of your local folders

1) Github PAT token is required to run the query on the endpoint URL. This is included in the .env file of the source. Note that this token has no access rights so its good to use it as is. A good practice is to store it in a secret vault.If you want to try with your token create one using [instructions](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) and update in ./src/.env. If WebApp is launched seperately you need to pass it along with the docker run command like below

```
 # Refer Step 2 for temporary mount point
   > docker run --env APIKEY={YOUR KEY}-v /tmp/mnt:/app/InputOutput -p 3000:3000 -d sreeni/githubstats
```

2) Temporary folder(s) are required to mount input files and also viewing output results of Github Stats app; Addionaly the same folder has been used to volume map for elastic service. I used the folder /tmp/mnt. Note that data is not persistent after system restart. 
```
   > mkdir -p /tmp/mnt/elastic/data
```
3) Copy input file for app from location below to the mount point(viz /tmp/mnt). 

```
  > sudo cp /src/express/samples/* /tmp/mnt # output.csv will get generated automatically when the WebApp is invoked

```
To launch standalone instance build docker file on ./src/express folder like below and launch http://localhost:3000

```
  > cd ./src/express
  > docker build -t sreeni/githubstats .
  > docker run --env APIKEY={YOUR KEY}-v /tmp/mnt:/app/InputOutput -p 3000:3000 -d sreeni/githubstats
  
```

Sample Content of input file repolist 

```
 > cat repolist.csv
   repoOwner/repoName
   raunofreiberg/ui-playbook
   taniarascia/taniarascia
```
Expected output if repoOwner and repoName are both good

```
 > mnt cat output.csv
   Name	Clone URL	Date of last commit	Name of last author
   ui-playbook	https://github.com/raunofreiberg/ui-playbook	2020-07-23T21:32:06+03:00	Rauno Freiberg
   taniarascia	https://github.com/taniarascia/taniarascia	2020-07-19T20:46:29-05:00	Tania Rascia
```
P.S: There is an [issue](https://github.com/sreenihari/Traveloka---DevOps-Challenge/issues/3)  which was overlooked. The app needs to be reloaded for any changes in the csv.Bad!

4) To build the full environment with ingestion traverse to the .src/ and launch docker-compose with the compose file

```
 > cd src
 ➜  src git:(master) ll
 total 8
 drwxr-xr-x  18 sreeni  staff   576B Jul 24 17:26 deploy
 -rw-r--r--   1 sreeni  staff   2.9K Jul 24 13:17 docker-compose.yml
 drwxr-xr-x  12 sreeni  staff   384B Jul 24 18:00 express
 drwxr-xr-x   4 sreeni  staff   128B Jul 24 12:49 fluentd
 drwxr-xr-x   4 sreeni  staff   128B Jul 24 07:41 init
 drwxr-xr-x   5 sreeni  staff   160B Jul 24 10:38 nginx

 > docker-compose -f docker-compose.yml build up # -d if in background mode. Note that you will not be able to see any display 

```
Elastic search takes a while to load. It looks like this 

```
> docker ps
CONTAINER ID        IMAGE NAMES                                             COMMAND                  CREATED             STATUS                 PORTS                                
e56f8d78d040        express-server                                        "docker-entrypoint.s…"   2 hours ago         Up 2 hours             0.0.0.0:3000->3000/tcp               express-server-container
a85070ae72ef        nginx-server                                          "/docker-entrypoint.…"   2 hours ago         Up 2 hours             80/tcp, 0.0.0.0:2345->8080/tcp       nginx-server-container
c4ac754534f7        fluentd-with-elastic                                  "/bin/entrypoint.sh …"   2 hours ago         Up 2 hours             5140/tcp, 0.0.0.0:24224->24224/tcp   fluentd
76cdfe188154        docker.elastic.co/elasticsearch/elasticsearch:7.0.1   "/usr/local/bin/dock…"   2 hours ago         Up 2 hours (healthy)   0.0.0.0:9200->9200/tcp, 9300/tcp     elasticsearch
```
NGINX is configuired at http://localhost:2345. It will redirected to the web app automatically.The service below shows access logs spit to the terminal.

```
fluentd            | 2020-07-24 12:26:24.000000000 +0000 httpd.access: {"container_id":"a85070ae72ef2fd1b0beca2cabd067bd2397201d72be05a6fd610f6cebd23c13","container_name":"/nginx-server-container","source":"stdout","log":"172.18.0.1 - - [24/Jul/2020:12:26:24 +0000] \"GET /data HTTP/1.1\" 304 0 \"http://localhost:2345/\" \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36\""}
```
Elastic search is configured at http://localhost:9200.

5) Docker compose is very good for development environments. However for real production kubernetes is preferred. I discovered that there is a handy tool to convert the docker compose to kubernetes deployments which is kompose. I have generated in ./src/deploy folders. 



